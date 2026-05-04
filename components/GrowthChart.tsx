'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { Post } from '@/lib/types'
import { fmt } from '@/lib/parsers'
import { format } from 'date-fns'
import { el } from 'date-fns/locale'
import { useMemo } from 'react'

interface Props {
  posts: Post[]
}

interface ChartPoint {
  date: string
  views: number
  likes: number
  type: string
  rawDate: string
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ value: number; payload: ChartPoint }>
  label?: string
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: '10px 14px',
        fontSize: 12,
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        minWidth: 160,
      }}
    >
      <div style={{ color: 'var(--text-2)', marginBottom: 6, fontWeight: 500 }}>
        {p.date} · {p.type}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {p.views > 0 && (
          <div style={{ color: '#818cf8', fontWeight: 700, fontSize: 14 }}>
            👁 {fmt(p.views)} προβολές
          </div>
        )}
        <div style={{ color: '#f0476c' }}>❤️ {fmt(p.likes)} likes</div>
      </div>
    </div>
  )
}

export function GrowthChart({ posts }: Props) {
  const { data, avgViews } = useMemo(() => {
    const sorted = [...posts]
      .filter((p) => p.date)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    const points: ChartPoint[] = sorted.map((p) => ({
      date: format(new Date(p.date), 'dd MMM', { locale: el }),
      rawDate: p.date,
      // Use likes as fallback metric when views = 0 (Instagram photos)
      views: p.views > 0 ? p.views : p.likes,
      likes: p.likes,
      type: p.type,
    }))

    const avg =
      points.length > 0
        ? Math.round(points.reduce((s, p) => s + p.views, 0) / points.length)
        : 0

    return { data: points, avgViews: avg }
  }, [posts])

  const hasViews = data.some((p) => p.views > 0)
  const metricLabel = posts.every((p) => p.views === 0) ? 'Likes' : 'Προβολές'

  if (data.length === 0) {
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
        Δεν υπάρχουν δεδομένα για το γράφημα
      </div>
    )
  }

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
          Ιστορικό {metricLabel}
        </div>
        <div
          style={{
            fontSize: 12,
            color: 'var(--text-2)',
            marginTop: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span>{data.length} posts · χρονολογική σειρά</span>
          {hasViews && (
            <span
              style={{
                padding: '1px 7px',
                borderRadius: 99,
                background: 'rgba(129,140,248,0.15)',
                color: 'var(--accent)',
                fontSize: 11,
              }}
            >
              Μ.Ο. {fmt(avgViews)}
            </span>
          )}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            vertical={false}
            opacity={0.6}
          />
          <XAxis
            dataKey="date"
            tick={{ fill: 'var(--text-3)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: 'var(--text-3)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => fmt(v)}
            width={52}
          />
          <Tooltip content={<CustomTooltip />} />
          {avgViews > 0 && (
            <ReferenceLine
              y={avgViews}
              stroke="var(--accent)"
              strokeDasharray="4 4"
              strokeOpacity={0.4}
            />
          )}
          <Line
            type="monotone"
            dataKey="views"
            stroke="var(--accent)"
            strokeWidth={2.5}
            dot={(props) => {
              const { cx, cy, payload } = props
              const isHigh = payload.views > avgViews
              return (
                <circle
                  key={`dot-${payload.rawDate}`}
                  cx={cx}
                  cy={cy}
                  r={isHigh ? 5 : 3}
                  fill={isHigh ? '#f0476c' : 'var(--accent)'}
                  stroke={isHigh ? '#f0476c44' : 'transparent'}
                  strokeWidth={isHigh ? 4 : 0}
                />
              )
            }}
            activeDot={{ r: 6, fill: '#f0476c', stroke: '#f0476c44', strokeWidth: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
