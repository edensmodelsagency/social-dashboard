'use client'

import { useState } from 'react'
import { Post } from '@/lib/types'
import { fmt } from '@/lib/parsers'
import { format } from 'date-fns'
import { el } from 'date-fns/locale'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { ThumbnailCell, TYPE_BADGE, PostModal } from './PostModal'

interface Props {
  posts: Post[]
  platform: 'instagram' | 'tiktok'
}

type SortKey = 'date' | 'views' | 'likes' | 'saves' | 'comments' | 'shares' | 'engagementRate'

export function PostsTable({ posts, platform }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)

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

  return (
    <>
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
                const badge = TYPE_BADGE[post.type] || TYPE_BADGE.Photo
                return (
                  <tr
                    key={post.id}
                    onClick={() => setSelectedPost(post)}
                    style={{
                      borderBottom: i < sorted.length - 1 ? '1px solid var(--border)' : 'none',
                      cursor: 'pointer',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) => {
                      ;(e.currentTarget as HTMLElement).style.background = 'var(--bg-subtle)'
                    }}
                    onMouseLeave={(e) => {
                      ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                    }}
                  >
                    <td style={{ padding: '8px 12px', width: 56 }}>
                      <ThumbnailCell post={post} />
                    </td>

                    <td style={{ padding: '8px 12px', fontSize: 12, color: 'var(--text-2)', whiteSpace: 'nowrap' }}>
                      {post.date ? format(new Date(post.date), 'dd MMM yy', { locale: el }) : '—'}
                    </td>

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

                    <td style={{ padding: '8px 12px', fontSize: 13, fontWeight: 600, textAlign: 'right', color: 'var(--text)' }}>
                      {post.views > 0
                        ? fmt(post.views)
                        : post.type === 'Photo' || post.type === 'Carousel'
                        ? '—'
                        : '0'}
                    </td>

                    <td style={{ padding: '8px 12px', fontSize: 13, textAlign: 'right', color: 'var(--text-2)' }}>
                      {fmt(post.likes)}
                    </td>

                    <td style={{ padding: '8px 12px', fontSize: 13, textAlign: 'right', color: 'var(--text-2)' }}>
                      {post.saves > 0 ? fmt(post.saves) : '—'}
                    </td>

                    <td style={{ padding: '8px 12px', fontSize: 13, textAlign: 'right', color: 'var(--text-2)' }}>
                      {fmt(post.comments)}
                    </td>

                    {platform === 'tiktok' && (
                      <td style={{ padding: '8px 12px', fontSize: 13, textAlign: 'right', color: 'var(--text-2)' }}>
                        {fmt(post.shares)}
                      </td>
                    )}

                    <td style={{ padding: '8px 12px', fontSize: 12, textAlign: 'right', whiteSpace: 'nowrap' }}>
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
                  <td colSpan={9} style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                    Δεν βρέθηκαν posts
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedPost && (
        <PostModal
          post={selectedPost}
          platform={platform}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </>
  )
}
