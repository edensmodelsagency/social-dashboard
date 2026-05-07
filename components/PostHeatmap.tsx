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

// Hours displayed bottom-to-top reading order: 10 at bottom → 02 at top
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

const CROSSHAIR_COLOR = 'rgba(236, 72, 153, 0.28)'
const CROSSHAIR_HOVERED = 'rgba(236, 72, 153, 0.55)'
const GRID_LINE = '1px dashed rgba(255,255,255,0.08)'
const CELL = 22
const GAP = 3

export function PostHeatmap({ posts }: Props) {
  const [tooltip, setTooltip] = useState<{
    post: Post
    x: number
    y: number
  } | null>(null)

  const [hovered, setHovered] = useState<{ hIdx: number; dIdx: number } | null>(null)

  const { grid, days, maxViews } = useMemo(() => {
    const today = startOfDay(new Date())
    const days: Date[] = []
    for (let d = 29; d >= 0; d--) {
      days.push(subDays(today, d))
    }

    // grid[hour][dayIdx] — indexed by real clock hour (0-23)
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

  function handleCellEnter(
    e: React.MouseEvent<HTMLDivElement>,
    hIdx: number,
    dIdx: number,
    cell: CellData
  ) {
    setHovered({ hIdx, dIdx })
    if (cell.post) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      setTooltip({
        post: cell.post,
        x: Math.min(rect.left + 28, window.innerWidth - 230),
        y: rect.bottom + 8,
      })
    } else {
      setTooltip(null)
    }
  }

  function handleGridLeave() {
    setHovered(null)
    setTooltip(null)
  }

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

      <div style={{ overflowX: 'auto', paddingBottom: 4 }} onMouseLeave={handleGridLeave}>
        <div style={{ display: 'flex', gap: GAP, minWidth: 'max-content' }}>

          {/* Hour label column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: GAP, flexShrink: 0 }}>
            {DISPLAY_HOURS.map((h, hIdx) => (
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
                  color: hovered?.hIdx === hIdx ? '#ec4899' : 'var(--text-2)',
                  fontWeight: hovered?.hIdx === hIdx ? 700 : 400,
                  userSelect: 'none',
                  transition: 'color 0.1s',
                }}
              >
                {String(h).padStart(2, '0')}:00
              </div>
            ))}
            {/* Spacer matching date label row */}
            <div style={{ height: 24 }} />
          </div>

          {/* Day columns */}
          {days.map((day, dIdx) => (
            <div
              key={dIdx}
              style={{ display: 'flex', flexDirection: 'column', gap: GAP, flexShrink: 0 }}
            >
              {DISPLAY_HOURS.map((hour, hIdx) => {
                const cell = grid[hour][dIdx]
                const hasPost = cell.post != null
                const bg = getColor(cell.views, maxViews)

                const isHoveredCell = hovered?.hIdx === hIdx && hovered?.dIdx === dIdx
                const inCrosshair = hovered != null && (hovered.hIdx === hIdx || hovered.dIdx === dIdx)

                return (
                  <div
                    key={hour}
                    onMouseEnter={(e) => handleCellEnter(e, hIdx, dIdx, cell)}
                    style={{
                      position: 'relative',
                      width: CELL,
                      height: CELL,
                      borderRadius: 5,
                      background: bg,
                      cursor: hasPost ? 'pointer' : 'default',
                      border: GRID_LINE,
                      boxSizing: 'border-box',
                      transition: 'transform 0.08s',
                      transform: isHoveredCell ? 'scale(1.3)' : 'none',
                      zIndex: isHoveredCell ? 10 : 1,
                      boxShadow: isHoveredCell && hasPost
                        ? `0 0 10px 3px ${bg}cc`
                        : 'none',
                      filter: isHoveredCell && hasPost ? 'brightness(1.4) saturate(1.5)' : 'none',
                    }}
                  >
                    {/* Crosshair overlay */}
                    {inCrosshair && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          borderRadius: 4,
                          background: isHoveredCell ? CROSSHAIR_HOVERED : CROSSHAIR_COLOR,
                          pointerEvents: 'none',
                        }}
                      />
                    )}
                  </div>
                )
              })}

              {/* Date label at bottom */}
              <div
                style={{
                  height: 24,
                  width: CELL,
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  paddingBottom: 2,
                  fontSize: 9,
                  color: showDayLabel(dIdx)
                    ? hovered?.dIdx === dIdx ? '#ec4899' : 'var(--text-2)'
                    : 'transparent',
                  fontWeight: hovered?.dIdx === dIdx ? 700 : 400,
                  userSelect: 'none',
                  whiteSpace: 'nowrap',
                  transform: 'rotate(-45deg)',
                  transformOrigin: 'top center',
                  transition: 'color 0.1s',
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
              border: GRID_LINE,
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
            minWidth: 200,
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, color: 'var(--text-2)' }}>
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
