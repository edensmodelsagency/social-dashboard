'use client'

import { useState } from 'react'
import { Post } from '@/lib/types'
import { fmt } from '@/lib/parsers'
import { format } from 'date-fns'
import { el } from 'date-fns/locale'
import { ChevronUp, ChevronDown } from 'lucide-react'
import Image from 'next/image'

interface Props {
  posts: Post[]
  platform: 'instagram' | 'tiktok'
}

type SortKey = 'date' | 'views' | 'likes' | 'saves' | 'comments' | 'shares' | 'engagementRate'

export function PostsTable({ posts, platform }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const sorted = [...posts].slice(0, 10).sort((a, b) => {
    const av = a[sortKey] as number
    const bv = b[sortKey] as number
    if (sortKey === 'date') {
      return sortDir === 'desc'
        ? new Date(b.date).getTime() - new Date(a.date).getTime()
        : new Date(a.date).getTime() - new Date(b.date).getTime()
    }
    return sortDir === 'desc' ? bv - av : av - bv
  })

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ChevronDown size={12} style={{ opacity: 0.3 }} />
    return sortDir === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />
  }

  function Th({
    label,
    k,
    right,
  }: {
    label: string
    k?: SortKey
    right?: boolean
  }) {
    return (
      <th
        onClick={k ? () => toggleSort(k) : undefined}
        style={{
          padding: '10px 12px',
          fontSize: 12,
          fontWeight: 500,
          color: 'var(--text-2)',
          textAlign: right ? 'right' : 'left',
          cursor: k ? 'pointer' : 'default',
          whiteSpace: 'nowrap',
          userSelect: 'none',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            color: k && sortKey === k ? 'var(--text)' : undefined,
          }}
        >
          {label}
          {k && <SortIcon k={k} />}
        </span>
      </th>
    )
  }

  const typeBadgeColor: Record<string, string> = {
    Reel: '#e1306c',
    Video: '#000000',
    Photo: '#0ea5e9',
    Carousel: '#f59e0b',
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px 0', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>
          Τελευταία 10 Posts
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <Th label="Post" />
              <Th label="Ημ/νία" k="date" />
              <Th label="Τύπος" />
              {(platform === 'instagram' || platform === 'tiktok') && (
                <Th label="Προβολές" k="views" right />
              )}
              <Th label="Likes" k="likes" right />
              <Th label="Αποθ." k="saves" right />
              <Th label="Σχόλια" k="comments" right />
              {platform === 'tiktok' && <Th label="Κοιν." k="shares" right />}
              <Th label="Eng.%" k="engagementRate" right />
            </tr>
          </thead>
          <tbody>
            {sorted.map((post, i) => (
              <tr
                key={post.id}
                style={{
                  borderBottom: i < sorted.length - 1 ? '1px solid var(--border)' : 'none',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLElement).style.background = 'var(--bg-subtle)'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                }}
              >
                {/* Thumbnail */}
                <td style={{ padding: '10px 12px' }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 6,
                      overflow: 'hidden',
                      background: 'var(--bg-subtle)',
                      flexShrink: 0,
                    }}
                  >
                    {post.thumbnail ? (
                      <Image
                        src={post.thumbnail}
                        alt=""
                        width={44}
                        height={44}
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
                          fontSize: 18,
                        }}
                      >
                        {post.type === 'Reel' || post.type === 'Video' ? '🎬' : '🖼'}
                      </div>
                    )}
                  </div>
                </td>

                {/* Date */}
                <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-2)', whiteSpace: 'nowrap' }}>
                  {post.date ? format(new Date(post.date), 'dd MMM yy', { locale: el }) : '—'}
                </td>

                {/* Type badge */}
                <td style={{ padding: '10px 12px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: 99,
                      fontSize: 11,
                      fontWeight: 600,
                      background: (typeBadgeColor[post.type] || '#6366f1') + '22',
                      color: typeBadgeColor[post.type] || '#6366f1',
                    }}
                  >
                    {post.type}
                  </span>
                </td>

                {/* Views */}
                <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 500, textAlign: 'right', color: 'var(--text)' }}>
                  {fmt(post.views)}
                </td>

                {/* Likes */}
                <td style={{ padding: '10px 12px', fontSize: 13, textAlign: 'right', color: 'var(--text-2)' }}>
                  {fmt(post.likes)}
                </td>

                {/* Saves */}
                <td style={{ padding: '10px 12px', fontSize: 13, textAlign: 'right', color: 'var(--text-2)' }}>
                  {fmt(post.saves) === '0' ? '—' : fmt(post.saves)}
                </td>

                {/* Comments */}
                <td style={{ padding: '10px 12px', fontSize: 13, textAlign: 'right', color: 'var(--text-2)' }}>
                  {fmt(post.comments)}
                </td>

                {/* Shares (TikTok only) */}
                {platform === 'tiktok' && (
                  <td style={{ padding: '10px 12px', fontSize: 13, textAlign: 'right', color: 'var(--text-2)' }}>
                    {fmt(post.shares)}
                  </td>
                )}

                {/* Engagement rate */}
                <td style={{ padding: '10px 12px', fontSize: 12, textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <span
                    style={{
                      color: post.engagementRate >= 3 ? 'var(--green)' : 'var(--text-2)',
                      fontWeight: post.engagementRate >= 3 ? 600 : 400,
                    }}
                  >
                    {post.engagementRate.toFixed(2)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
