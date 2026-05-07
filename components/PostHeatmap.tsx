'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
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

const GRID_LINE = '1px dashed rgba(255,255,255,0.08)'
const GAP = 4
const Y_AXIS_W = 48  // width of the hour-label column
const NUM_DAYS = 10
const CELL_H = 36   // row height

export function PostHeatmap({ posts }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  // Measure container; recompute on resize
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width)
    })
    ro.observe(el)
    setContainerWidth(el.getBoundingClientRect().width)
    return () => ro.disconnect()
  }, [])

  // Cell width fills available space across exactly 10 columns
  // Total = Y_AXIS_W + GAP + 10*CELL_W + 9*GAP  →  CELL_W = (avail - 9*GAP) / 10
  const CELL_W = containerWidth > 0
    ? Math.max(Math.floor((containerWidth - Y_AXIS_W - GAP - NUM_DAYS * GAP) / NUM_DAYS), 28)
    : 40

  const [tooltip, setTooltip] = useState<{ post: Post; x: number; y: number } | null>(null)
  const [hoveredCell, setHoveredCell] = useState<string | null>(null) // "hIdx-dIdx"

  const { grid, days, maxViews } = useMemo(() => {
    const today = startOfDay(new Date())
    const days: Date[] = []
    for (let d = 9; d >= 0; d--) days.push(subDays(today, d))

    const grid: CellData[][] = Array.from({ length: 24 }, () =>
      Array.from({ length: NUM_DAYS }, () => ({ views: 0, engagement: 0 }))
    )
    let max = 0

    for (const post of posts) {
      if (!post.date) continue
      const postDate = new Date(post.date)
      const postDay = startOfDay(postDate)
      const dIdx = days.findIndex((d) => d.getTime() === postDay.getTime())
      if (dIdx === -1) continue
      const hour = postDate.getHours()
      const cell = grid[hour][dIdx]
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

  function handleCellEnter(
    e: React.MouseEvent<HTMLDivElement>,
    hIdx: number,
    dIdx: number,
    cell: CellData
  ) {
    setHoveredCell(`${hIdx}-${dIdx}`)
    if (cell.post) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      setTooltip({
        post: cell.post,
        x: Math.min(rect.left + CELL_W + 6, window.innerWidth - 230),
        y: rect.top,
      })
    } else {
      setTooltip(null)
    }
  }

  return (
    <div className="card" style={{ padding: 20, width: '100%', boxSizing: 'border-box' }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
          Δραστηριότητα Δημοσίευσης
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
          Τελευταίες 10 ημέρες · ώρα × ημέρα · χρώμα = προβολές
        </div>
      </div>

      {/* Grid — ref used for width measurement */}
      <div
        ref={containerRef}
        style={{ width: '100%' }}
        onMouseLeave={() => { setHoveredCell(null); setTooltip(null) }}
      >
        <div style={{ display: 'flex', gap: GAP, width: '100%' }}>

          {/* Y-axis hour labels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: GAP, width: Y_AXIS_W, flexShrink: 0 }}>
            {DISPLAY_HOURS.map((h, hIdx) => (
              <div
                key={h}
                style={{
                  height: CELL_H,
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: 11,
                  color: 'var(--text-2)',
                  userSelect: 'none',
                  paddingRight: 8,
                  justifyContent: 'flex-end',
                  whiteSpace: 'nowrap',
                }}
              >
                {String(h).padStart(2, '0')}:00
              </div>
            ))}
            {/* Spacer for date label row */}
            <div style={{ height: 28 }} />
          </div>

          {/* Day columns — flex-1 so they share remaining width equally */}
          {days.map((day, dIdx) => (
            <div
              key={dIdx}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: GAP,
                minWidth: 0,
              }}
            >
              {DISPLAY_HOURS.map((hour, hIdx) => {
                const cell = grid[hour][dIdx]
                const hasPost = cell.post != null
                const bg = getColor(cell.views, maxViews)
                const isHoveredCell = hoveredCell === `${hIdx}-${dIdx}`

                return (
                  <div
                    key={hour}
                    onMouseEnter={(e) => handleCellEnter(e, hIdx, dIdx, cell)}
                    style={{
                      width: '100%',
                      height: CELL_H,
                      borderRadius: 6,
                      background: bg,
                      cursor: hasPost ? 'pointer' : 'default',
                      border: isHoveredCell && hasPost
                        ? '1px solid rgba(255,255,255,0.5)'
                        : GRID_LINE,
                      boxSizing: 'border-box',
                      transition: 'filter 0.1s, border-color 0.1s',
                      filter: isHoveredCell && hasPost ? 'brightness(1.4) saturate(1.3)' : 'none',
                    }}
                  />
                )
              })}

              {/* Date label at bottom */}
              <div
                style={{
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  color: 'var(--text-2)',
                  userSelect: 'none',
                  whiteSpace: 'nowrap',
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
          marginTop: 8,
          fontSize: 11,
          color: 'var(--text-3)',
        }}
      >
        <span>Χαμηλές</span>
        {HEAT_COLORS.map((c, i) => (
          <div
            key={i}
            style={{ width: 14, height: 14, background: c, borderRadius: 4, border: GRID_LINE }}
          />
        ))}
        <span>Υψηλές</span>
        <span style={{ marginLeft: 8 }}>προβολές</span>
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
          <div style={{ fontWeight: 700, marginBottom: 8, color: 'var(--text)', fontSize: 13 }}>
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
