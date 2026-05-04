'use client'

import { Users, Eye, TrendingUp, Heart } from 'lucide-react'
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

  const metrics = [
    {
      label: 'Followers',
      value: fmt(followers),
      icon: <Users size={18} />,
      color: platform === 'instagram' ? 'var(--ig)' : 'var(--tt)',
    },
    {
      label: 'Following',
      value: fmt(following),
      icon: <TrendingUp size={18} />,
      color: 'var(--accent)',
    },
    {
      label: 'Συνολικές Προβολές',
      value: fmt(totalViews),
      icon: <Eye size={18} />,
      color: '#f59e0b',
    },
    {
      label: 'Συνολικά Likes',
      value: fmt(totalLikes),
      icon: <Heart size={18} />,
      color: '#ec4899',
    },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
      {metrics.map((m) => (
        <div key={m.label} className="card" style={{ padding: 20 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{m.label}</span>
            <span style={{ color: m.color, opacity: 0.8 }}>{m.icon}</span>
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', letterSpacing: -0.5 }}>
            {m.value}
          </div>
          {m.label === 'Followers' && (
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
              Eng. Rate: {avgEngRate}%
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
