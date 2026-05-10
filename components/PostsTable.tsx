'use client'

import { useEffect, useState } from 'react'
import { Post } from '@/lib/types'
import { fmt } from '@/lib/parsers'
import { format } from 'date-fns'
import { el } from 'date-fns/locale'
import { ChevronUp, ChevronDown, X, ExternalLink } from 'lucide-react'
import Image from 'next/image'

// ── Thumbnail with proxy + emoji fallback ─────────────────────────────────────

function ThumbnailCell({ post, size = 44 }: { post: Post; size?: number }) {
  const [failed, setFailed] = useState(false)
  const proxySrc = post.thumbnail
    ? `/api/thumbnail?url=${encodeURIComponent(post.thumbnail)}`
    : null
  const emoji = post.type === 'Reel' || post.type === 'Video' ? '🎬' : '🖼'

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size > 80 ? 12 : 6,
        overflow: 'hidden',
        background: 'var(--bg-subtle)',
        border: '1px solid var(--border)',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {proxySrc && !failed ? (
        <Image
          src={proxySrc}
          alt=""
          width={size}
          height={size}
          style={{ objectFit: 'cover', width: '100%', height: '100%' }}
          unoptimized
          onError={() => setFailed(true)}
        />
      ) : (
        <span style={{ fontSize: size > 80 ? 40 : 20 }}>{emoji}</span>
      )}
    </div>
  )
}

// ── Post detail modal ─────────────────────────────────────────────────────────

const typeBadgeStyle: Record<string, { bg: string; color: string }> = {
  Reel:     { bg: 'rgba(240,71,108,0.18)', color: '#f0476c' },
  Video:    { bg: 'rgba(129,140,248,0.18)', color: '#818cf8' },
  Photo:    { bg: 'rgba(14,165,233,0.18)', color: '#38bdf8' },
  Carousel: { bg: 'rgba(245,158,11,0.18)', color: '#fbbf24' },
}

function PostModal({
  post,
  platform,
  onClose,
}: {
  post: Post
  platform: 'instagram' | 'tiktok'
  onClose: () => void
}) {
  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const badge = typeBadgeStyle[post.type] || typeBadgeStyle.Photo
  const platformLabel = platform === 'instagram' ? 'Instagram' : 'TikTok'

  const postUrl =
    post.url ||
    (platform === 'instagram' && post.id
      ? `https://www.instagram.com/p/${post.id}/`
      : platform === 'tiktok' && post.id
      ? `https://www.tiktok.com/@user/video/${post.id}`
      : null)

  const stats: { label: string; value: string; highlight?: boolean }[] = [
    { label: 'Τύπος', value: post.type },
    {
      label: 'Ημερομηνία',
      value: post.date
        ? format(new Date(post.date), 'dd MMMM yyyy, HH:mm', { locale: el })
        : '—',
    },
    {
      label: 'Προβολές',
      value:
        post.views > 0
          ? fmt(post.views)
          : post.type === 'Photo' || post.type === 'Carousel'
          ? '—'
          : '0',
    },
    { label: 'Likes', value: fmt(post.likes) },
    { label: 'Αποθηκεύσεις', value: post.saves > 0 ? fmt(post.saves) : '—' },
    { label: 'Σχόλια', value: fmt(post.comments) },
    ...(post.shares > 0 ? [{ label: 'Κοινοποιήσεις', value: fmt(post.shares) }] : []),
    {
      label: 'Engagement %',
      value: `${post.engagementRate.toFixed(2)}%`,
      highlight: post.engagementRate >= 3,
    },
  ]

  return (
    /* Backdrop */
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        animation: 'fadeIn 0.18s ease',
      }}
    >
      {/* Modal panel */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#1a1a2e',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 18,
          width: '100%',
          maxWidth: 440,
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
          animation: 'slideUp 0.2s ease',
          position: 'relative',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            zIndex: 10,
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: '50%',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#fff',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.2)')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)')}
        >
          <X size={16} />
        </button>

        {/* Thumbnail — full width */}
        <div
          style={{
            width: '100%',
            aspectRatio: '1 / 1',
            background: 'rgba(255,255,255,0.04)',
            borderRadius: '18px 18px 0 0',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ThumbnailCell post={post} size={440} />
        </div>

        {/* Content */}
        <div style={{ padding: '20px 24px 24px' }}>
          {/* Type badge */}
          <div style={{ marginBottom: 16 }}>
            <span
              style={{
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: 99,
                fontSize: 12,
                fontWeight: 600,
                background: badge.bg,
                color: badge.color,
              }}
            >
              {post.type}
            </span>
          </div>

          {/* Stats grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {stats.map(({ label, value, highlight }) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '9px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{label}</span>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: highlight ? '#ec4899' : 'rgba(255,255,255,0.9)',
                  }}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* Open link */}
          {postUrl && (
            <a
              href={postUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginTop: 20,
                padding: '12px 0',
                borderRadius: 10,
                background: platform === 'instagram'
                  ? 'linear-gradient(135deg,#e1306c,#833ab4)'
                  : 'linear-gradient(135deg,#010101,#69c9d0)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = '0.85')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = '1')}
            >
              <ExternalLink size={14} />
              Άνοιγμα στο {platformLabel}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main table component ───────────────────────────────────────────────────────

interface Props {
  posts: Post[]
  platform: 'instagram' | 'tiktok'
}

type SortKey = 'date' | 'views' | 'likes' | 'saves' | 'comments' | 'shares' | 'engagementRate'

export function PostsTable({ posts, platform }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)

  const sorted = [...posts]
    .sort((a, b) => {
      if (sortKey === 'date') {
        return sortDir === 'desc'
          ? new Date(b.date).getTime() - new Date(a.date).getTime()
          : new Date(a.date).getTime() - new Date(b.date).getTime()
      }
      const av = a[sortKey] as number
      const bv = b[sortKey] as number
      return sortDir === 'desc' ? bv - av : av - bv
    })
    .slice(0, 10)

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ChevronDown size={12} style={{ opacity: 0.25 }} />
    return sortDir === 'desc' ? (
      <ChevronDown size={12} style={{ color: 'var(--accent)' }} />
    ) : (
      <ChevronUp size={12} style={{ color: 'var(--accent)' }} />
    )
  }

  function Th({ label, k, right }: { label: string; k?: SortKey; right?: boolean }) {
    return (
      <th
        onClick={k ? () => toggleSort(k) : undefined}
        style={{
          padding: '10px 12px',
          fontSize: 11,
          fontWeight: 600,
          color: k && sortKey === k ? 'var(--text)' : 'var(--text-2)',
          textAlign: right ? 'right' : 'left',
          cursor: k ? 'pointer' : 'default',
          whiteSpace: 'nowrap',
          userSelect: 'none',
          background: 'var(--bg-subtle)',
          borderBottom: '1px solid var(--border)',
          letterSpacing: 0.3,
          textTransform: 'uppercase',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          {label}
          {k && <SortIcon k={k} />}
        </span>
      </th>
    )
  }

  return (
    <>
      {/* Keyframe styles */}
      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(24px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
            Τελευταία 10 Posts
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
            {sorted.length} από {posts.length}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <Th label="Post" />
                <Th label="Ημ/νία" k="date" />
                <Th label="Τύπος" />
                <Th label="Προβολές" k="views" right />
                <Th label="Likes" k="likes" right />
                <Th label="Αποθ." k="saves" right />
                <Th label="Σχόλια" k="comments" right />
                {platform === 'tiktok' && <Th label="Κοιν." k="shares" right />}
                <Th label="Eng.%" k="engagementRate" right />
              </tr>
            </thead>
            <tbody>
              {sorted.map((post, i) => {
                const badge = typeBadgeStyle[post.type] || typeBadgeStyle.Photo
                return (
                  <tr
                    key={post.id}
                    onClick={() => setSelectedPost(post)}
                    style={{
                      borderBottom: i < sorted.length - 1 ? '1px solid var(--border)' : 'none',
                      cursor: 'pointer',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) => {
                      ;(e.currentTarget as HTMLElement).style.background = 'var(--bg-subtle)'
                    }}
                    onMouseLeave={(e) => {
                      ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                    }}
                  >
                    {/* Thumbnail */}
                    <td style={{ padding: '8px 12px', width: 56 }}>
                      <ThumbnailCell post={post} />
                    </td>

                    {/* Date */}
                    <td style={{ padding: '8px 12px', fontSize: 12, color: 'var(--text-2)', whiteSpace: 'nowrap' }}>
                      {post.date ? format(new Date(post.date), 'dd MMM yy', { locale: el }) : '—'}
                    </td>

                    {/* Type badge */}
                    <td style={{ padding: '8px 12px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 9px',
                          borderRadius: 99,
                          fontSize: 11,
                          fontWeight: 600,
                          background: badge.bg,
                          color: badge.color,
                        }}
                      >
                        {post.type}
                      </span>
                    </td>

                    {/* Views */}
                    <td style={{ padding: '8px 12px', fontSize: 13, fontWeight: 600, textAlign: 'right', color: 'var(--text)' }}>
                      {post.views > 0
                        ? fmt(post.views)
                        : post.type === 'Photo' || post.type === 'Carousel'
                        ? '—'
                        : '0'}
                    </td>

                    {/* Likes */}
                    <td style={{ padding: '8px 12px', fontSize: 13, textAlign: 'right', color: 'var(--text-2)' }}>
                      {fmt(post.likes)}
                    </td>

                    {/* Saves */}
                    <td style={{ padding: '8px 12px', fontSize: 13, textAlign: 'right', color: 'var(--text-2)' }}>
                      {post.saves > 0 ? fmt(post.saves) : '—'}
                    </td>

                    {/* Comments */}
                    <td style={{ padding: '8px 12px', fontSize: 13, textAlign: 'right', color: 'var(--text-2)' }}>
                      {fmt(post.comments)}
                    </td>

                    {/* Shares (TikTok only) */}
                    {platform === 'tiktok' && (
                      <td style={{ padding: '8px 12px', fontSize: 13, textAlign: 'right', color: 'var(--text-2)' }}>
                        {fmt(post.shares)}
                      </td>
                    )}

                    {/* Engagement rate */}
                    <td style={{ padding: '8px 12px', fontSize: 12, textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <span
                        style={{
                          color:
                            post.engagementRate >= 3
                              ? 'var(--green)'
                              : post.engagementRate >= 1
                              ? 'var(--text-2)'
                              : 'var(--text-3)',
                          fontWeight: post.engagementRate >= 3 ? 600 : 400,
                        }}
                      >
                        {post.engagementRate.toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                )
              })}

              {sorted.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                    Δεν βρέθηκαν posts
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {selectedPost && (
        <PostModal
          post={selectedPost}
          platform={platform}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </>
  )
}
