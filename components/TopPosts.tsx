'use client'

import { Post } from '@/lib/types'
import { fmt } from '@/lib/parsers'
import { format } from 'date-fns'
import { el } from 'date-fns/locale'
import { Eye, Heart, Bookmark, MessageCircle, TrendingUp } from 'lucide-react'
import Image from 'next/image'

interface Props {
  posts: Post[]
  platform: 'instagram' | 'tiktok'
}

const typeBadge: Record<string, { bg: string; color: string; label: string }> = {
  Reel: { bg: '#e1306c22', color: '#e1306c', label: 'Reel' },
  Video: { bg: '#ffffff15', color: '#ffffff', label: 'Video' },
  Photo: { bg: '#0ea5e922', color: '#0ea5e9', label: 'Photo' },
  Carousel: { bg: '#f59e0b22', color: '#f59e0b', label: 'Carousel' },
}

export function TopPosts({ posts, platform }: Props) {
  const top4 = [...posts].sort((a, b) => b.views - a.views).slice(0, 4)

  if (top4.length === 0) {
    return (
      <div
        className="card"
        style={{
          padding: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 160,
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {top4.map((post, idx) => {
          const badge = typeBadge[post.type] || typeBadge.Photo
          return (
            <div
              key={post.id}
              className="card-sm"
              style={{ padding: 14, position: 'relative', overflow: 'hidden' }}
            >
              {/* Rank badge */}
              <div
                style={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: idx === 0 ? '#f59e0b' : idx === 1 ? '#9ca3af' : idx === 2 ? '#cd7c3a' : 'var(--bg-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  color: idx < 3 ? 'white' : 'var(--text-3)',
                }}
              >
                {idx + 1}
              </div>

              {/* Thumbnail */}
              <div
                style={{
                  width: '100%',
                  height: 110,
                  borderRadius: 6,
                  overflow: 'hidden',
                  background: 'var(--bg-subtle)',
                  marginBottom: 10,
                }}
              >
                {post.thumbnail ? (
                  <Image
                    src={post.thumbnail}
                    alt=""
                    width={300}
                    height={110}
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
                      fontSize: 32,
                    }}
                  >
                    {post.type === 'Reel' || post.type === 'Video' ? '🎬' : '🖼'}
                  </div>
                )}
              </div>

              {/* Type + date */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <span
                  style={{
                    padding: '2px 7px',
                    borderRadius: 99,
                    fontSize: 10,
                    fontWeight: 600,
                    background: badge.bg,
                    color: badge.color,
                  }}
                >
                  {badge.label}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
                  {post.date ? format(new Date(post.date), 'dd MMM yy', { locale: el }) : ''}
                </span>
              </div>

              {/* Stats grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <Stat icon={<Eye size={12} />} label="Προβολές" value={fmt(post.views)} color="#818cf8" />
                <Stat icon={<Heart size={12} />} label="Likes" value={fmt(post.likes)} color="#e1306c" />
                <Stat icon={<Bookmark size={12} />} label="Αποθ." value={fmt(post.saves) === '0' ? '—' : fmt(post.saves)} color="#f59e0b" />
                <Stat icon={<MessageCircle size={12} />} label="Σχόλια" value={fmt(post.comments)} color="#22c55e" />
              </div>

              {/* Eng rate */}
              <div
                style={{
                  marginTop: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 11,
                  color: post.engagementRate >= 3 ? 'var(--green)' : 'var(--text-3)',
                  fontWeight: 500,
                }}
              >
                <TrendingUp size={11} />
                Eng. Rate: {post.engagementRate.toFixed(2)}%
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Stat({
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
        borderRadius: 6,
        padding: '6px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color, opacity: 0.8 }}>
        {icon}
        <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{label}</span>
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{value}</div>
    </div>
  )
}
