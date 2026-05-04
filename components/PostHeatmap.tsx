'use client'

import { useMemo, useState } from 'react'
import { Post } from '@/lib/types'
import { fmt } from '@/lib/parsers'
import { format, subDays, startOfDay } from 'date-fns'
import { el } from 'date-fns/locale'

interface Props {
  posts: Post[]
}

interface CellData {
  views: number
  post?: Post
}

export function PostHeatmap({ posts }: Props) {
  const [tooltip, setTooltip] = useState<{ post: Post; x: number; y: number } | null>(null)

  const { grid, days, maxViews } = useMemo(() => {
    const today = startOfDay(new Date())
    const days: Date[] = []
    for (let d = 9; d >= 0; d--) {
      days.push(subDays(today, d))
    }

    const grid: CellData[][] = Array.from({ length: 24 }, () =>
      Array.from({ length: 10 }, () => ({ views: 0 }))
    )

    let max = 0

    for (const post of posts) {
      if (!post.date) continue
      const postDate = new Date(post.date)
      const postDay = startOfDay(postDate)
      const dayIdx = days.findIndex((d) => d.getTime() === postDay.getTime())
      if (dayIdx === -1) continue

      const hour = postDate.getHours()
      const cell = grid[hour][dayIdx]
      if (!cell.post || post.views > cell.views) {
        cell.post = post
        cell.views = post.views
      }
      if (post.views > max) max = post.views
    }

    return { grid, days, maxViews: max || 1 }
  }, [posts])

  function getColor(views: number): string {
    if (views === 0) return 'var(--bg-subtle)'
    const intensity = Math.min(views / maxViews, 1)
    if (intensity < 0.2) return '#312e81'
    if (intensity < 0.4) return '#4338ca'
    if (intensity < 0.6) return '#4f46e5'
    if (intensity < 0.8) return '#6366f1'
    return '#818cf8'
  }

  const cellSize = 28
  const hourLabels = ['00', '03', '06', '09', '12', '15', '18', '21']

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
          Δραστηριότητα Δημοσίευσης
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
          Τελευταίες 10 ημέρες · Εντάσεις χρώματος = προβολές
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {/* Hour labels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <div style={{ height: 28 }} />
            {Array.from({ length: 24 }, (_, h) => (
              <div
                key={h}
                style={{
                  height: cellSize,
                  width: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  paddingRight: 6,
                  fontSize: 10,
                  color: hourLabels.includes(String(h).padStart(2, '0'))
                    ? 'var(--text-2)'
                    : 'transparent',
                }}
              >
                {String(h).padStart(2, '0')}
              </div>
            ))}
          </div>

          {/* Grid columns (days) */}
          {days.map((day, dayIdx) => (
            <div key={dayIdx} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {/* Day label */}
              <div
                style={{
                  height: 28,
                  width: cellSize,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  color: 'var(--text-2)',
                  textAlign: 'center',
                }}
              >
                {format(day, 'dd/MM', { locale: el })}
              </div>

              {/* Hour cells */}
              {Array.from({ length: 24 }, (_, hour) => {
                const cell = grid[hour][dayIdx]
                const hasPost = cell.post != null

                return (
                  <div
                    key={hour}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      background: getColor(cell.views),
                      borderRadius: 4,
                      cursor: hasPost ? 'pointer' : 'default',
                      border: hasPost ? '1px solid rgba(129,140,248,0.4)' : '1px solid transparent',
                      transition: 'transform 0.1s',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => {
                      if (cell.post) {
                        const rect = (e.target as HTMLElement).getBoundingClientRect()
                        setTooltip({ post: cell.post, x: rect.left, y: rect.bottom + 6 })
                      }
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginTop: 12,
          fontSize: 11,
          color: 'var(--text-3)',
        }}
      >
        <span>Λίγες</span>
        {['#312e81', '#4338ca', '#4f46e5', '#6366f1', '#818cf8'].map((c) => (
          <div
            key={c}
            style={{ width: 14, height: 14, background: c, borderRadius: 3 }}
          />
        ))}
        <span>Πολλές</span>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          style={{
            position: 'fixed',
            left: tooltip.x,
            top: tooltip.y,
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: 12,
            zIndex: 9999,
            pointerEvents: 'none',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            minWidth: 180,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>
            {tooltip.post.type} · {format(new Date(tooltip.post.date), 'dd/MM HH:mm')}
          </div>
          <div style={{ color: 'var(--text-2)', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span>👁 {fmt(tooltip.post.views)} προβολές</span>
            <span>❤️ {fmt(tooltip.post.likes)} likes</span>
            <span>💬 {fmt(tooltip.post.comments)} σχόλια</span>
          </div>
        </div>
      )}
    </div>
  )
}
