'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Instagram,
  Music2,
  Plus,
  Trash2,
  RefreshCw,
  ChevronRight,
  BarChart2,
  AlertCircle,
  Clock,
  CheckCircle,
} from 'lucide-react'
import { MetricsCards } from '@/components/MetricsCards'
import { PostHeatmap } from '@/components/PostHeatmap'
import { PostsTable } from '@/components/PostsTable'
import { GrowthChart } from '@/components/GrowthChart'
import { TopPosts } from '@/components/TopPosts'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { parseInstagram, parseTikTok } from '@/lib/parsers'
import type { Platform, Profile, ProfileStatus } from '@/lib/types'

// ── helpers ──────────────────────────────────────────────────────────────────

function cleanUsername(raw: string): string {
  return raw
    .trim()
    .replace(/https?:\/\/(www\.)?(instagram\.com|tiktok\.com)\/@?/, '')
    .replace(/[/\s@]/g, '')
}

function initials(u: string) {
  return u.substring(0, 2).toUpperCase()
}

const PLATFORM_COLORS = [
  '#6366f1', '#e1306c', '#f59e0b', '#22c55e',
  '#0ea5e9', '#a855f7', '#ef4444', '#14b8a6',
]

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ProfileStatus }) {
  const map: Record<ProfileStatus, { cls: string; label: string; icon: React.ReactNode }> = {
    idle: { cls: 'badge badge-idle', label: 'Αναμονή', icon: <Clock size={10} /> },
    loading: { cls: 'badge badge-loading', label: 'Φορτώνει...', icon: <span className="spinner" /> },
    done: { cls: 'badge badge-done', label: 'Έτοιμο', icon: <CheckCircle size={10} /> },
    error: { cls: 'badge badge-error', label: 'Σφάλμα', icon: <AlertCircle size={10} /> },
  }
  const { cls, label, icon } = map[status]
  return (
    <span className={cls}>
      {icon}
      {label}
    </span>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [activePlatform, setActivePlatform] = useState<Platform>('instagram')
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null)
  const [inputVal, setInputVal] = useState('')
  const [inputError, setInputError] = useState('')
  const [initialized, setInitialized] = useState(false)

  // ── load profiles on mount ──────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/profiles')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          // Map DB snake_case to camelCase where needed
          const mapped: Profile[] = data.map((p) => ({
            id: p.id,
            username: p.username,
            platform: p.platform,
            status: p.status || 'idle',
            data: p.data || undefined,
            error: p.error_message || undefined,
            last_scraped_at: p.last_scraped_at,
            created_at: p.created_at,
          }))
          setProfiles(mapped)
        }
      })
      .catch(() => {
        // No DB configured — start fresh
      })
      .finally(() => setInitialized(true))
  }, [])

  // ── platform profiles ───────────────────────────────────────────────────────
  const platformProfiles = profiles.filter((p) => p.platform === activePlatform)
  const activeProfile = profiles.find((p) => p.id === activeProfileId) || null

  // ── add profile ─────────────────────────────────────────────────────────────
  async function addProfile() {
    setInputError('')
    const username = cleanUsername(inputVal)
    if (!username) { setInputError('Βάλε ένα έγκυρο username.'); return }
    if (platformProfiles.find((p) => p.username === username)) {
      setInputError('Υπάρχει ήδη στη λίστα.'); return
    }
    if (platformProfiles.length >= 20) {
      setInputError('Μέγιστο 20 profiles ανά platform.'); return
    }

    const res = await fetch('/api/profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, platform: activePlatform }),
    })
    const newProfile: Profile = await res.json()
    setProfiles((prev) => [...prev, { ...newProfile, status: 'idle' }])
    setInputVal('')
  }

  // ── delete profile ──────────────────────────────────────────────────────────
  async function deleteProfile(id: string) {
    await fetch(`/api/profiles/${id}`, { method: 'DELETE' })
    setProfiles((prev) => prev.filter((p) => p.id !== id))
    if (activeProfileId === id) setActiveProfileId(null)
  }

  // ── analyze profile ─────────────────────────────────────────────────────────
  const analyzeProfile = useCallback(
    async (profile: Profile) => {
      // Set loading
      setProfiles((prev) =>
        prev.map((p) => (p.id === profile.id ? { ...p, status: 'loading', error: undefined } : p))
      )
      setActiveProfileId(profile.id)

      try {
        // Start Apify run
        const startRes = await fetch('/api/scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: profile.username, platform: profile.platform }),
        })
        const startJson = await startRes.json()
        if (!startRes.ok || startJson.error) throw new Error(startJson.error || 'Αποτυχία εκκίνησης')

        const { runIds } = startJson
        if (!runIds?.length) throw new Error('Δεν επιστράφηκαν run IDs')

        // Poll for status every 5s, max 2.5 min
        let items: Record<string, unknown>[] | null = null
        for (let i = 0; i < 30; i++) {
          await new Promise((r) => setTimeout(r, 5000))
          const pollRes = await fetch(`/api/scrape/status?runIds=${runIds.join(',')}`)
          const pollJson = await pollRes.json()

          if (pollJson.status === 'succeeded') {
            items = pollJson.items
            break
          }
          if (pollJson.status === 'failed') {
            throw new Error(pollJson.error || `Το run απέτυχε`)
          }
          // still running — continue polling
        }

        if (!items) throw new Error('Timeout: η ανάλυση πήρε πολύ ώρα')

        const data =
          profile.platform === 'instagram'
            ? parseInstagram(items)
            : parseTikTok(items)

        // Save to DB
        await fetch(`/api/profiles/${profile.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'done',
            data,
            last_scraped_at: new Date().toISOString(),
            error_message: null,
          }),
        })

        setProfiles((prev) =>
          prev.map((p) =>
            p.id === profile.id
              ? { ...p, status: 'done', data, last_scraped_at: new Date().toISOString() }
              : p
          )
        )
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Άγνωστο σφάλμα'
        await fetch(`/api/profiles/${profile.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'error', error_message: message }),
        })
        setProfiles((prev) =>
          prev.map((p) => (p.id === profile.id ? { ...p, status: 'error', error: message } : p))
        )
      }
    },
    []
  )

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>
      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside
        style={{
          width: 260,
          flexShrink: 0,
          background: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: '18px 16px 14px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <BarChart2 size={20} color="var(--accent)" />
          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>
            Social Analytics
          </span>
        </div>

        {/* Platform tabs */}
        <div style={{ padding: '12px 12px 0', display: 'flex', gap: 6 }}>
          {(['instagram', 'tiktok'] as Platform[]).map((p) => (
            <button
              key={p}
              onClick={() => {
                setActivePlatform(p)
                setActiveProfileId(null)
              }}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                padding: '7px 4px',
                borderRadius: 7,
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 500,
                background:
                  activePlatform === p ? (p === 'instagram' ? '#e1306c22' : '#ffffff15') : 'transparent',
                color:
                  activePlatform === p
                    ? p === 'instagram'
                      ? 'var(--ig)'
                      : 'var(--tt)'
                    : 'var(--text-2)',
                transition: 'all 0.15s',
              }}
            >
              {p === 'instagram' ? <Instagram size={13} /> : <Music2 size={13} />}
              {p === 'instagram' ? 'Instagram' : 'TikTok'}
            </button>
          ))}
        </div>

        {/* Add input */}
        <div style={{ padding: '12px 12px 0' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addProfile()}
              placeholder="username..."
              style={{ flex: 1, minWidth: 0 }}
            />
            <button
              className="btn btn-primary"
              onClick={addProfile}
              style={{ padding: '8px 10px', flexShrink: 0 }}
            >
              <Plus size={14} />
            </button>
          </div>
          {inputError && (
            <div
              style={{
                marginTop: 6,
                fontSize: 11,
                color: 'var(--red)',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <AlertCircle size={11} /> {inputError}
            </div>
          )}
        </div>

        {/* Profile count */}
        <div
          style={{
            padding: '10px 16px 6px',
            fontSize: 11,
            color: 'var(--text-3)',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          {activePlatform === 'instagram' ? 'Instagram' : 'TikTok'} ({platformProfiles.length}/20)
        </div>

        {/* Profile list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 12px' }}>
          {!initialized && (
            <div
              style={{
                padding: '20px 8px',
                textAlign: 'center',
                fontSize: 12,
                color: 'var(--text-3)',
              }}
            >
              <span className="spinner" style={{ display: 'inline-block', marginBottom: 8 }} />
            </div>
          )}

          {initialized && platformProfiles.length === 0 && (
            <div
              style={{
                padding: '24px 8px',
                textAlign: 'center',
                fontSize: 12,
                color: 'var(--text-3)',
                lineHeight: 1.6,
              }}
            >
              Δεν έχεις profiles.
              <br />
              Πρόσθεσε ένα username πάνω.
            </div>
          )}

          {platformProfiles.map((profile, idx) => {
            const color = PLATFORM_COLORS[idx % PLATFORM_COLORS.length]
            const isActive = profile.id === activeProfileId

            return (
              <div
                key={profile.id}
                onClick={() => profile.status === 'done' && setActiveProfileId(profile.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 8px',
                  borderRadius: 8,
                  cursor: profile.status === 'done' ? 'pointer' : 'default',
                  background: isActive ? 'var(--bg-card)' : 'transparent',
                  border: isActive ? '1px solid var(--border)' : '1px solid transparent',
                  marginBottom: 2,
                  transition: 'all 0.1s',
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: color + '22',
                    color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {initials(profile.username)}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: 'var(--text)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    @{profile.username}
                  </div>
                  <StatusBadge status={profile.status} />
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                  <button
                    title="Ανάλυση"
                    className="btn btn-ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      analyzeProfile(profile)
                    }}
                    disabled={profile.status === 'loading'}
                    style={{ padding: '4px 6px', fontSize: 11 }}
                  >
                    <RefreshCw
                      size={12}
                      style={{
                        animation: profile.status === 'loading' ? 'spin 0.7s linear infinite' : 'none',
                      }}
                    />
                  </button>
                  <button
                    title="Διαγραφή"
                    className="btn btn-danger"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteProfile(profile.id)
                    }}
                    style={{ padding: '4px 6px' }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <main style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        {/* No profile selected */}
        {!activeProfile && (
          <EmptyState platform={activePlatform} hasProfiles={platformProfiles.length > 0} />
        )}

        {/* Profile loading */}
        {activeProfile && activeProfile.status === 'loading' && (
          <div>
            <ProfileHeader profile={activeProfile} platform={activePlatform} />
            <div style={{ marginTop: 16 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 16,
                  fontSize: 13,
                  color: 'var(--text-2)',
                }}
              >
                <span className="spinner" />
                Γίνεται ανάλυση του @{activeProfile.username}... Αυτό μπορεί να πάρει 1-2 λεπτά.
              </div>
              <LoadingSkeleton />
            </div>
          </div>
        )}

        {/* Profile error */}
        {activeProfile && activeProfile.status === 'error' && (
          <div>
            <ProfileHeader profile={activeProfile} platform={activePlatform} />
            <div
              className="card"
              style={{
                marginTop: 16,
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
                textAlign: 'center',
              }}
            >
              <AlertCircle size={32} color="var(--red)" />
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
                Αποτυχία ανάλυσης
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-2)', maxWidth: 400 }}>
                {activeProfile.error || 'Άγνωστο σφάλμα'}
              </div>
              <button
                className="btn btn-primary"
                onClick={() => analyzeProfile(activeProfile)}
              >
                <RefreshCw size={13} /> Δοκιμή ξανά
              </button>
            </div>
          </div>
        )}

        {/* Profile done */}
        {activeProfile && activeProfile.status === 'done' && activeProfile.data && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <ProfileHeader profile={activeProfile} platform={activePlatform} onAnalyze={analyzeProfile} />

            <MetricsCards data={activeProfile.data} platform={activePlatform} />

            <PostHeatmap posts={activeProfile.data.posts} />

            <PostsTable posts={activeProfile.data.posts} platform={activePlatform} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <GrowthChart posts={activeProfile.data.posts} />
              <TopPosts posts={activeProfile.data.posts} platform={activePlatform} />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ProfileHeader({
  profile,
  platform,
  onAnalyze,
}: {
  profile: Profile
  platform: Platform
  onAnalyze?: (p: Profile) => void
}) {
  const platformColor = platform === 'instagram' ? 'var(--ig)' : 'var(--tt)'
  const platformLabel = platform === 'instagram' ? 'Instagram' : 'TikTok'
  const PlatformIcon = platform === 'instagram' ? Instagram : Music2

  const isStale =
    profile.last_scraped_at
      ? Date.now() - new Date(profile.last_scraped_at).getTime() > 24 * 60 * 60 * 1000
      : false

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: platformColor + '22',
            color: platformColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 15,
            fontWeight: 700,
          }}
        >
          {profile.username.substring(0, 2).toUpperCase()}
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>
              @{profile.username}
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '2px 8px',
                borderRadius: 99,
                fontSize: 11,
                fontWeight: 500,
                background: platformColor + '22',
                color: platformColor,
              }}
            >
              <PlatformIcon size={11} /> {platformLabel}
            </span>
            {isStale && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '2px 8px',
                  borderRadius: 99,
                  fontSize: 11,
                  fontWeight: 500,
                  background: 'rgba(245,158,11,0.15)',
                  color: '#f59e0b',
                  border: '1px solid rgba(245,158,11,0.3)',
                }}
              >
                <AlertCircle size={10} /> Δεδομένα &gt;24ω
              </span>
            )}
          </div>
          {profile.last_scraped_at && (
            <div style={{ fontSize: 11, color: isStale ? '#f59e0b' : 'var(--text-3)', marginTop: 2 }}>
              Τελευταία ανάλυση:{' '}
              {new Date(profile.last_scraped_at).toLocaleString('el-GR', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          )}
        </div>
      </div>

      {onAnalyze && (
        <button
          className="btn btn-ghost"
          onClick={() => onAnalyze(profile)}
        >
          <RefreshCw size={13} /> Ανανέωση
        </button>
      )}
    </div>
  )
}

function EmptyState({
  platform,
  hasProfiles,
}: {
  platform: Platform
  hasProfiles: boolean
}) {
  const PlatformIcon = platform === 'instagram' ? Instagram : Music2
  const platformColor = platform === 'instagram' ? 'var(--ig)' : 'var(--tt)'

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '80vh',
        gap: 16,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: platformColor + '18',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <PlatformIcon size={28} color={platformColor} />
      </div>
      <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)' }}>
        {hasProfiles
          ? 'Επίλεξε ένα profile από τη λίστα'
          : 'Πρόσθεσε το πρώτο σου profile'}
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-2)', maxWidth: 340, lineHeight: 1.6 }}>
        {hasProfiles ? (
          <>
            Κάνε κλικ στο <RefreshCw size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> για να ξεκινήσεις την ανάλυση,
            μετά κάνε κλικ στο profile για να δεις τα δεδομένα.
          </>
        ) : (
          <>
            Πληκτρολόγησε το username ενός{' '}
            {platform === 'instagram' ? 'Instagram' : 'TikTok'} λογαριασμού
            στο πλαίσιο αριστερά και πάτα Enter.
          </>
        )}
      </div>
      {!hasProfiles && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            color: 'var(--text-3)',
          }}
        >
          <ChevronRight size={14} />
          Παράδειγμα: <code style={{ color: 'var(--accent)' }}>cristiano</code>
        </div>
      )}
    </div>
  )
}
