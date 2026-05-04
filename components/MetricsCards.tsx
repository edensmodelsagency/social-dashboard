'use client'

import { Users, UserCheck, Eye, Heart, TrendingUp } from 'lucide-react'
import { ProfileData } from '@/lib/types'
import { fmt } from '@/lib/parsers'

interface Props {
  data: ProfileData
  platform: 'instagram' | 'tiktok'
}

export function MetricsCards({ data, platform }: Props) {
  const { followers, following, totalViews, posts } = data

  const totalLikes = posts.reduce((s, p) => s + p.likes, 0)
  const avgEngRate =
    posts.length > 0
      ? (posts.reduce((s, p) => s + p.engagementRate, 0) / posts.length).toFixed(2)
      : '0'

  const platformColor = platform === 'instagram' ? 'var(--ig)' : 'var(--accent)'

  const metrics = [
    {
      label: 'Followers',
      value: fmt(followers),
      sub: `Eng. Rate: ${avgEngRate}%`,
      icon: <Users size={18} />,
      color: platformColor,
    },
    // Only include Following if we have real data
    ...(following > 0
      ? [
          {
            label: 'Following',
            value: fmt(following),
            sub: null,
            icon: <UserCheck size={18} />,
            color: '#38bdf8',
          },
        ]
      : []),
    {
      label: 'Συνολικές Προβολές',
      value: fmt(totalViews),
      sub: `από ${posts.length} posts`,
      icon: <Eye size={18} />,
      color: '#f59e0b',
    },
    {
      label: 'Συνολικά Likes',
      value: fmt(totalLikes),
      sub: null,
      icon: <Heart size={18} />,
      color: '#f0476c',
    },
    {
      label: 'Avg. Engagement',
      value: `${avgEngRate}%`,
      sub: 'ανά post',
      icon: <TrendingUp size={18} />,
      color: 'var(--green)',
    },
  ]

  // Always show 4 cards — if Following is hidden we have exactly 4
  const cols = metrics.length <= 4 ? metrics.length : 4
  const firstRow = metrics.slice(0, cols)
  const secondRow = metrics.slice(cols)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: 12,
        }}
      >
        {firstRow.map((m) => (
          <MetricCard key={m.label} {...m} />
        ))}
      </div>
      {secondRow.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${secondRow.length}, 1fr)`,
            gap: 12,
          }}
        >
          {secondRow.map((m) => (
            <MetricCard key={m.label} {...m} />
          ))}
        </div>
      )}
    </div>
  )
}

function MetricCard({
  label,
  value,
  sub,
  icon,
  color,
}: {
  label: string
  value: string
  sub: string | null
  icon: React.ReactNode
  color: string
}) {
  return (
    <div
      className="card"
      style={{
        padding: '18px 20px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle glow strip */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: color,
          opacity: 0.6,
          borderRadius: '12px 12px 0 0',
        }}
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}
      >
        <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>{label}</span>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: color + '22',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color,
          }}
        >
          {icon}
        </div>
      </div>

      <div
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: 'var(--text)',
          letterSpacing: -0.5,
          lineHeight: 1,
          marginBottom: sub ? 6 : 0,
        }}
      >
        {value}
      </div>

      {sub && (
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>{sub}</div>
      )}
    </div>
  )
}
