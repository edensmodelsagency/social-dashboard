'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { X, ExternalLink } from 'lucide-react'
import { Post } from '@/lib/types'
import { fmt } from '@/lib/parsers'
import { format } from 'date-fns'
import { el } from 'date-fns/locale'

// ── Shared thumbnail with proxy + emoji fallback ──────────────────────────────

export function ThumbnailCell({ post, size = 44 }: { post: Post; size?: number }) {
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

// ── Type badge colours (shared) ───────────────────────────────────────────────

export const TYPE_BADGE: Record<string, { bg: string; color: string }> = {
  Reel:     { bg: 'rgba(240,71,108,0.18)', color: '#f0476c' },
  Video:    { bg: 'rgba(129,140,248,0.18)', color: '#818cf8' },
  Photo:    { bg: 'rgba(14,165,233,0.18)',  color: '#38bdf8' },
  Carousel: { bg: 'rgba(245,158,11,0.18)',  color: '#fbbf24' },
}

// ── Post detail modal ─────────────────────────────────────────────────────────

interface PostModalProps {
  post: Post
  platform: 'instagram' | 'tiktok'
  onClose: () => void
}

export function PostModal({ post, platform, onClose }: PostModalProps) {
  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const badge = TYPE_BADGE[post.type] || TYPE_BADGE.Photo
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
    { label: 'Likes',          value: fmt(post.likes) },
    { label: 'Αποθηκεύσεις',  value: post.saves > 0 ? fmt(post.saves) : '—' },
    { label: 'Σχόλια',        value: fmt(post.comments) },
    ...(post.shares > 0 ? [{ label: 'Κοινοποιήσεις', value: fmt(post.shares) }] : []),
    {
      label: 'Engagement %',
      value: `${post.engagementRate.toFixed(2)}%`,
      highlight: post.engagementRate >= 3,
    },
  ]

  return (
    <>
      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(24px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>

      {/* Backdrop */}
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
        {/* Panel */}
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
          {/* Close */}
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

          {/* Full-width thumbnail */}
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
                  <span style={{ fontSize: 14, fontWeight: 600, color: highlight ? '#ec4899' : 'rgba(255,255,255,0.9)' }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>

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
                  background:
                    platform === 'instagram'
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
    </>
  )
}
