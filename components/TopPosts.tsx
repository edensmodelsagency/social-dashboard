'use client'

import { Post } from '@/lib/types'
import { fmt } from '@/lib/parsers'
import { format } from 'date-fns'
import { el } from 'date-fns/locale'
import { Eye, Heart, Bookmark, MessageCircle, TrendingUp, Share2 } from 'lucide-react'
import Image from 'next/image'

interface Props {
  posts: Post[]
  platform: 'instagram' | 'tiktok'
}

const RANK_STYLE = [
  { border: '#f59e0b', glow: 'rgba(245,158,11,0.25)', badge: '#f59e0b', label: '🥇' },
  { border: '#9ca3af', glow: 'rgba(156,163,175,0.2)', badge: '#9ca3af', label: '🥈' },
  { border: '#cd7c3a', glow: 'rgba(205,124,58,0.2)', badge: '#cd7c3a', label: '🥉' },
  { border: '#2d3348',  glow: 'transparent',           badge: '#4e5568', label: '4' },
]

const TYPE_BADGE: Record<string, { bg: string; color: string }> = {
  Reel:     { bg: 'rgba(240,71,108,0.18)', color: '#f0476c' },
  Video:    { bg: 'rgba(129,140,248,0.18)', color: '#818cf8' },
  Photo:    { bg: 'rgba(14,165,233,0.18)',  color: '#38bdf8' },
  Carousel: { bg: 'rgba(245,158,11,0.18)', color: '#fbbf24' },
}

export function TopPosts({ posts, platform }: Props) {
  const top4 = [...posts]
    .sort((a, b) => {
      // Primary sort: views, fallback to likes if no views
      const aScore = a.views > 0 ? a.views : a.likes
      const bScore = b.views > 0 ? b.views : b.likes
      return bScore - aScore
    })
    .slice(0, 4)

  if (top4.length === 0) {
    return (
      <div
        className="card"
        style={{
          padding: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 260,
          color: 'var(--text-3)',
          fontSize: 13,
        }}
      >
        Δεν υπάρχουν posts
      </div>
    )
  }

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
          Top 4 Posts
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
          Ταξινόμηση βάσει προβολών
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 10,
        }}
      >
        {top4.map((post, idx) => {
          const rank = RANK_STYLE[idx]
          const badge = TYPE_BADGE[post.type] || TYPE_BADGE.Photo
          const primaryMetric = post.views > 0 ? post.views : post.likes
          const primaryLabel = post.views > 0 ? 'Προβολές' : 'Likes'

          return (
            <div
              key={post.id}
              style={{
                background: 'var(--bg-card)',
                border: `1px solid ${rank.border}`,
                boxShadow: `0 0 12px ${rank.glow}`,
                borderRadius: 10,
                padding: 12,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Rank label */}
              <div
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: rank.badge + '33',
                  border: `1px solid ${rank.badge}66`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: idx < 3 ? 14 : 11,
                  fontWeight: 700,
                  color: rank.badge,
                  zIndex: 2,
                }}
              >
                {rank.label}
              </div>

              {/* Thumbnail */}
              <div
                style={{
                  width: '100%',
                  height: 100,
                  borderRadius: 6,
                  overflow: 'hidden',
                  background: 'var(--bg-subtle)',
                  marginBottom: 10,
                  border: '1px solid var(--border)',
                }}
              >
                {post.thumbnail ? (
                  <Image
                    src={post.thumbnail}
                    alt=""
                    width={300}
                    height={100}
                    style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                    unoptimized
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 28,
                    }}
                  >
                    {post.type === 'Reel' || post.type === 'Video' ? '🎬' : '🖼'}
                  </div>
                )}
              </div>

              {/* Type + date */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 8,
                  flexWrap: 'wrap',
                }}
              >
                <span
                  style={{
                    padding: '2px 7px',
                    borderRadius: 99,
                    fontSize: 10,
                    fontWeight: 700,
                    background: badge.bg,
                    color: badge.color,
                  }}
                >
                  {post.type}
                </span>
                <span style={{ fontSize: 10, color: 'var(--text-3)' }}>
                  {post.date
                    ? format(new Date(post.date), 'dd MMM yy', { locale: el })
                    : ''}
                </span>
              </div>

              {/* Primary metric big */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 1 }}>
                  {primaryLabel}
                </div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: 'var(--text)',
                    letterSpacing: -0.5,
                  }}
                >
                  {fmt(primaryMetric)}
                </div>
              </div>

              {/* Stats mini grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                <MiniStat icon={<Heart size={10} />} label="Likes" value={fmt(post.likes)} color="#f0476c" />
                <MiniStat icon={<MessageCircle size={10} />} label="Σχόλια" value={fmt(post.comments)} color="#4ade80" />
                {post.saves > 0 && (
                  <MiniStat icon={<Bookmark size={10} />} label="Αποθ." value={fmt(post.saves)} color="#fbbf24" />
                )}
                {platform === 'tiktok' && post.shares > 0 && (
                  <MiniStat icon={<Share2 size={10} />} label="Κοιν." value={fmt(post.shares)} color="#38bdf8" />
                )}
              </div>

              {/* Eng rate */}
              <div
                style={{
                  marginTop: 8,
                  paddingTop: 8,
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 11,
                  color:
                    post.engagementRate >= 3
                      ? 'var(--green)'
                      : post.engagementRate >= 1
                      ? 'var(--text-2)'
                      : 'var(--text-3)',
                  fontWeight: post.engagementRate >= 3 ? 600 : 400,
                }}
              >
                <TrendingUp size={11} />
                Eng. {post.engagementRate.toFixed(2)}%
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MiniStat({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  color: string
}) {
  return (
    <div
      style={{
        background: 'var(--bg-subtle)',
        borderRadius: 5,
        padding: '5px 7px',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 3, color, opacity: 0.85 }}>
        {icon}
        <span style={{ fontSize: 9, color: 'var(--text-3)', textTransform: 'uppercase' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{value}</div>
    </div>
  )
}
