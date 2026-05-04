'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Post } from '@/lib/types'
import { fmt } from '@/lib/parsers'
import { format } from 'date-fns'
import { el } from 'date-fns/locale'
import { useMemo } from 'react'

interface Props {
  posts: Post[]
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '8px 14px',
        fontSize: 12,
        boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
      }}
    >
      <div style={{ color: 'var(--text-2)', marginBottom: 4 }}>{label}</div>
      <div style={{ color: 'var(--accent)', fontWeight: 600 }}>
        {fmt(payload[0].value)} προβολές
      </div>
    </div>
  )
}

export function GrowthChart({ posts }: Props) {
  const data = useMemo(() => {
    const sorted = [...posts]
      .filter((p) => p.date)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return sorted.map((p) => ({
      date: format(new Date(p.date), 'dd MMM', { locale: el }),
      views: p.views,
      type: p.type,
    }))
  }, [posts])

  if (data.length === 0) {
    return (
      <div
        className="card"
        style={{
          padding: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 200,
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
          Ιστορικό Προβολών
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
          Προβολές ανά δημοσίευση · χρονολογική σειρά
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fill: 'var(--text-3)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: 'var(--text-3)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => fmt(v)}
            width={50}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="views"
            stroke="var(--accent)"
            strokeWidth={2}
            dot={{ fill: 'var(--accent)', r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: 'var(--accent)' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
