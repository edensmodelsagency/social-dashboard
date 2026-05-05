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

  // Sort ALL posts first, then take up to 10
  const sorted = [...posts]
    .sort((a, b) => {
      if (sortKey === 'date') {
        return sortDir === 'desc'
          ? new Date(b.date).getTime() - new Date(a.date).getTime()
          : new Date(a.date).getTime() - new Date(b.date).getTime()
      }
      const av = a[sortKey] as number
      const bv = b[sortKey] as number
      return sortDir === 'desc' ? bv - av : av - bv
    })
    .slice(0, 10)

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ChevronDown size={12} style={{ opacity: 0.25 }} />
    return sortDir === 'desc' ? (
      <ChevronDown size={12} style={{ color: 'var(--accent)' }} />
    ) : (
      <ChevronUp size={12} style={{ color: 'var(--accent)' }} />
    )
  }

  function Th({ label, k, right }: { label: string; k?: SortKey; right?: boolean }) {
    return (
      <th
        onClick={k ? () => toggleSort(k) : undefined}
        style={{
          padding: '10px 12px',
          fontSize: 11,
          fontWeight: 600,
          color: k && sortKey === k ? 'var(--text)' : 'var(--text-2)',
          textAlign: right ? 'right' : 'left',
          cursor: k ? 'pointer' : 'default',
          whiteSpace: 'nowrap',
          userSelect: 'none',
          background: 'var(--bg-subtle)',
          borderBottom: '1px solid var(--border)',
          letterSpacing: 0.3,
          textTransform: 'uppercase',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          {label}
          {k && <SortIcon k={k} />}
        </span>
      </th>
    )
  }

  const typeBadgeStyle: Record<string, { bg: string; color: string }> = {
    Reel:     { bg: 'rgba(240,71,108,0.18)', color: '#f0476c' },
    Video:    { bg: 'rgba(129,140,248,0.18)', color: '#818cf8' },
    Photo:    { bg: 'rgba(14,165,233,0.18)', color: '#38bdf8' },
    Carousel: { bg: 'rgba(245,158,11,0.18)', color: '#fbbf24' },
  }

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
          Τελευταία 10 Posts
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
          {sorted.length} από {posts.length}
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <Th label="Post" />
              <Th label="Ημ/νία" k="date" />
              <Th label="Τύπος" />
              <Th label="Προβολές" k="views" right />
              <Th label="Likes" k="likes" right />
              <Th label="Αποθ." k="saves" right />
              <Th label="Σχόλια" k="comments" right />
              {platform === 'tiktok' && <Th label="Κοιν." k="shares" right />}
              <Th label="Eng.%" k="engagementRate" right />
            </tr>
          </thead>
          <tbody>
            {sorted.map((post, i) => {
              const badge = typeBadgeStyle[post.type] || typeBadgeStyle.Photo
              return (
                <tr
                  key={post.id}
                  style={{
                    borderBottom: i < sorted.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLElement).style.background = 'var(--bg-subtle)'
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                  }}
                >
                  {/* Thumbnail */}
                  <td style={{ padding: '8px 12px', width: 56 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 6,
                        overflow: 'hidden',
                        background: 'var(--bg-subtle)',
                        border: '1px solid var(--border)',
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
                  <td
                    style={{
                      padding: '8px 12px',
                      fontSize: 12,
                      color: 'var(--text-2)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {post.date
                      ? format(new Date(post.date), 'dd MMM yy', { locale: el })
                      : '—'}
                  </td>

                  {/* Type badge */}
                  <td style={{ padding: '8px 12px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '3px 9px',
                        borderRadius: 99,
                        fontSize: 11,
                        fontWeight: 600,
                        background: badge.bg,
                        color: badge.color,
                      }}
                    >
                      {post.type}
                    </span>
                  </td>

                  {/* Views */}
                  <td
                    style={{
                      padding: '8px 12px',
                      fontSize: 13,
                      fontWeight: 600,
                      textAlign: 'right',
                      color: 'var(--text)',
                    }}
                  >
                    {/* Reels/Videos always have a view count — only Photos may lack one */}
                    {post.views > 0
                      ? fmt(post.views)
                      : post.type === 'Photo' || post.type === 'Carousel'
                      ? '—'
                      : '0'}
                  </td>

                  {/* Likes */}
                  <td
                    style={{
                      padding: '8px 12px',
                      fontSize: 13,
                      textAlign: 'right',
                      color: 'var(--text-2)',
                    }}
                  >
                    {fmt(post.likes)}
                  </td>

                  {/* Saves */}
                  <td
                    style={{
                      padding: '8px 12px',
                      fontSize: 13,
                      textAlign: 'right',
                      color: 'var(--text-2)',
                    }}
                  >
                    {post.saves > 0 ? fmt(post.saves) : '—'}
                  </td>

                  {/* Comments */}
                  <td
                    style={{
                      padding: '8px 12px',
                      fontSize: 13,
                      textAlign: 'right',
                      color: 'var(--text-2)',
                    }}
                  >
                    {fmt(post.comments)}
                  </td>

                  {/* Shares (TikTok only) */}
                  {platform === 'tiktok' && (
                    <td
                      style={{
                        padding: '8px 12px',
                        fontSize: 13,
                        textAlign: 'right',
                        color: 'var(--text-2)',
                      }}
                    >
                      {fmt(post.shares)}
                    </td>
                  )}

                  {/* Engagement rate */}
                  <td
                    style={{
                      padding: '8px 12px',
                      fontSize: 12,
                      textAlign: 'right',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span
                      style={{
                        color:
                          post.engagementRate >= 3
                            ? 'var(--green)'
                            : post.engagementRate >= 1
                            ? 'var(--text-2)'
                            : 'var(--text-3)',
                        fontWeight: post.engagementRate >= 3 ? 600 : 400,
                      }}
                    >
                      {post.engagementRate.toFixed(2)}%
                    </span>
                  </td>
                </tr>
              )
            })}

            {sorted.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  style={{
                    padding: 32,
                    textAlign: 'center',
                    color: 'var(--text-3)',
                    fontSize: 13,
                  }}
                >
                  Δεν βρέθηκαν posts
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
