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
  engagement: number
  post?: Post
}

// Hours to display: 02:00 at top → 10:00 at bottom (bottom-to-top reading: 10→02)
const DISPLAY_HOURS = [2, 1, 0, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10]

const HEAT_COLORS = [
  '#1e2130', // empty
  '#3b1f4e', // very low
  '#6b21a8', // low
  '#9333ea', // medium
  '#c026d3', // high
  '#e1306c', // very high
]

function getColor(views: number, max: number): string {
  if (views === 0 || max === 0) return HEAT_COLORS[0]
  const ratio = views / max
  if (ratio < 0.05) return HEAT_COLORS[1]
  if (ratio < 0.2) return HEAT_COLORS[2]
  if (ratio < 0.4) return HEAT_COLORS[3]
  if (ratio < 0.7) return HEAT_COLORS[4]
  return HEAT_COLORS[5]
}

export function PostHeatmap({ posts }: Props) {
  const [tooltip, setTooltip] = useState<{
    post: Post
    x: number
    y: number
  } | null>(null)

  const { grid, days, maxViews } = useMemo(() => {
    const today = startOfDay(new Date())
    const days: Date[] = []
    for (let d = 29; d >= 0; d--) {
      days.push(subDays(today, d))
    }

    // grid[hour][dayIdx] — indexed by real hour (0-23)
    const grid: CellData[][] = Array.from({ length: 24 }, () =>
      Array.from({ length: 30 }, () => ({ views: 0, engagement: 0 }))
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
      const score = post.views || post.likes || 0
      if (!cell.post || score > cell.views) {
        cell.post = post
        cell.views = score
        cell.engagement = post.engagementRate
      }
      if (score > max) max = score
    }

    return { grid, days, maxViews: max || 1 }
  }, [posts])

  const showDayLabel = (i: number) => i % 5 === 0 || i === 29

  const CELL = 22
  const GAP = 3

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
          Δραστηριότητα Δημοσίευσης
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
          Τελευταίες 30 ημέρες · ώρα × ημέρα · χρώμα = προβολές
        </div>
      </div>

      <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
        <div style={{ display: 'flex', gap: GAP, minWidth: 'max-content' }}>

          {/* Hour label column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: GAP, flexShrink: 0 }}>
            {DISPLAY_HOURS.map((h) => (
              <div
                key={h}
                style={{
                  height: CELL,
                  width: 34,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  paddingRight: 6,
                  fontSize: 10,
                  color: 'var(--text-2)',
                  userSelect: 'none',
                }}
              >
                {String(h).padStart(2, '0')}:00
              </div>
            ))}
            {/* Spacer matching the date label row at bottom */}
            <div style={{ height: 24 }} />
          </div>

          {/* Day columns */}
          {days.map((day, dayIdx) => (
            <div
              key={dayIdx}
              style={{ display: 'flex', flexDirection: 'column', gap: GAP, flexShrink: 0 }}
            >
              {/* Hour cells — only DISPLAY_HOURS */}
              {DISPLAY_HOURS.map((hour) => {
                const cell = grid[hour][dayIdx]
                const hasPost = cell.post != null
                const bg = getColor(cell.views, maxViews)

                return (
                  <div
                    key={hour}
                    onMouseEnter={(e) => {
                      if (hasPost && cell.post) {
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                        setTooltip({
                          post: cell.post,
                          x: Math.min(rect.left, window.innerWidth - 220),
                          y: rect.bottom + 8,
                        })
                      }
                    }}
                    onMouseLeave={() => setTooltip(null)}
                    onMouseOver={(e) => {
                      if (hasPost) {
                        ;(e.currentTarget as HTMLElement).style.transform = 'scale(1.25)'
                        ;(e.currentTarget as HTMLElement).style.opacity = '0.9'
                      }
                    }}
                    style={{
                      width: CELL,
                      height: CELL,
                      borderRadius: 5,
                      background: bg,
                      cursor: hasPost ? 'pointer' : 'default',
                      border: hasPost
                        ? `1px solid ${bg === HEAT_COLORS[5] ? '#f0476c88' : '#9333ea55'}`
                        : '1px solid transparent',
                      transition: 'transform 0.08s, opacity 0.08s',
                    }}
                  />
                )
              })}

              {/* Date label at BOTTOM */}
              <div
                style={{
                  height: 24,
                  width: CELL,
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  paddingBottom: 2,
                  fontSize: 9,
                  color: showDayLabel(dayIdx) ? 'var(--text-2)' : 'transparent',
                  userSelect: 'none',
                  whiteSpace: 'nowrap',
                  transform: 'rotate(-45deg)',
                  transformOrigin: 'top center',
                }}
              >
                {format(day, 'dd/MM', { locale: el })}
              </div>
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
          marginTop: 16,
          fontSize: 11,
          color: 'var(--text-3)',
        }}
      >
        <span>Χαμηλές</span>
        {HEAT_COLORS.map((c, i) => (
          <div
            key={i}
            style={{
              width: 14,
              height: 14,
              background: c,
              borderRadius: 4,
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          />
        ))}
        <span>Υψηλές</span>
        <span style={{ marginLeft: 8, color: 'var(--text-3)' }}>προβολές</span>
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
            borderRadius: 10,
            padding: '12px 16px',
            fontSize: 12,
            zIndex: 9999,
            pointerEvents: 'none',
            boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
            minWidth: 190,
          }}
        >
          <div
            style={{
              fontWeight: 700,
              marginBottom: 8,
              color: 'var(--text)',
              fontSize: 13,
            }}
          >
            {tooltip.post.type} ·{' '}
            {format(new Date(tooltip.post.date), 'dd MMM, HH:mm', { locale: el })}
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              color: 'var(--text-2)',
            }}
          >
            <span>👁 {fmt(tooltip.post.views)} προβολές</span>
            <span>❤️ {fmt(tooltip.post.likes)} likes</span>
            <span>💬 {fmt(tooltip.post.comments)} σχόλια</span>
            {tooltip.post.shares > 0 && (
              <span>🔁 {fmt(tooltip.post.shares)} κοινοποιήσεις</span>
            )}
            <span style={{ color: 'var(--accent)', fontWeight: 600, marginTop: 2 }}>
              Eng. {tooltip.post.engagementRate.toFixed(2)}%
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
