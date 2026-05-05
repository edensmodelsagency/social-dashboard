import { Post, ProfileData } from './types'

// Safe numeric conversion — handles string numbers, null, undefined
function n(v: unknown): number {
  if (v == null) return 0
  const num = Number(v)
  return isNaN(num) ? 0 : num
}

export function parseInstagram(items: Record<string, unknown>[]): ProfileData {
  if (!items.length) return { followers: 0, following: 0, totalViews: 0, posts: [] }

  // Filter actual post/reel items — be as inclusive as possible.
  // Reels from /reels/ endpoint may have productType:'clips' but no likesCount.
  const postItems = items.filter(
    (i) =>
      i.id != null ||
      i.shortCode != null ||
      i.likesCount != null ||
      i.likeCount != null ||
      i.type != null ||
      i.productType != null ||
      i.videoViewCount != null
  )

  console.log('[parseInstagram] total items received:', items.length, '| passed filter:', postItems.length)

  // Profile data is embedded in each item via addParentData:true
  const profileItem = (
    postItems.find((i) => n(i.followersCount) > 0) ||
    postItems[0] ||
    items[0]
  ) as Record<string, unknown>

  const followers = n(profileItem.followersCount)
  const following = n(profileItem.followingCount) || n(profileItem.followsCount)

  const posts: Post[] = postItems.map((item, idx) => {
    const i = item as Record<string, unknown>
    const likes    = n(i.likesCount)    || n(i.likeCount)
    const comments = n(i.commentsCount) || n(i.commentCount)
    const saves    = n(i.saves)         || n(i.savesCount)
    // videoViewCount / videoPlayCount / playCount — all possible field names for reels
    const views =
      n(i.videoViewCount) ||
      n(i.videoPlayCount) ||
      n(i.playCount)      ||
      n(i.viewCount)

    let type: Post['type'] = 'Photo'
    if (i.productType === 'clips' || i.type === 'video') type = 'Reel'
    else if (i.type === 'sidecar') type = 'Carousel'

    return {
      id: (i.id as string) || String(idx),
      type,
      date: (i.timestamp as string) || (i.takenAtTimestamp ? new Date((i.takenAtTimestamp as number) * 1000).toISOString() : ''),
      views,
      likes,
      saves,
      comments,
      shares: 0,
      thumbnail:
        (i.displayUrl as string) ||
        (i.imageUrl as string) ||
        (i.thumbnailUrl as string),
      url:
        (i.url as string) ||
        (i.shortCode ? `https://www.instagram.com/p/${i.shortCode}/` : undefined),
      engagementRate:
        followers > 0
          ? parseFloat(((likes + comments) / followers * 100).toFixed(2))
          : 0,
    }
  })

  return {
    followers,
    following,
    totalViews: posts.reduce((sum, p) => sum + p.views, 0),
    posts,
  }
}

export function parseTikTok(items: Record<string, unknown>[]): ProfileData {
  if (!items.length) return { followers: 0, following: 0, totalViews: 0, posts: [] }

  // Filter actual post items
  const postItems = items.filter(
    (i) => i.diggCount != null || i.playCount != null
  )

  const authorMeta =
    (postItems[0]?.authorMeta as Record<string, unknown>) ||
    (items[0]?.authorMeta as Record<string, unknown>) ||
    {}

  const followers = n(authorMeta.fans)
  const following = n(authorMeta.following)

  const posts: Post[] = postItems.map((item, idx) => {
    const i = item as Record<string, unknown>
    const meta = (i.authorMeta as Record<string, unknown>) || {}

    const likes    = n(i.diggCount)
    const comments = n(i.commentCount)
    const views    = n(i.playCount)
    const shares   = n(i.shareCount)
    const saves    = n(i.collectCount)

    let date = (i.createTimeISO as string) || ''
    if (!date && i.createTime) {
      date = new Date((i.createTime as number) * 1000).toISOString()
    }

    const covers = (i.covers as string[]) || []
    const thumbnail = covers[0] || (i.coverUrl as string)
    const authorName = (meta.name as string) || ''

    return {
      id: (i.id as string) || String(idx),
      type: 'Video',
      date,
      views,
      likes,
      saves,
      comments,
      shares,
      thumbnail,
      url: `https://www.tiktok.com/@${authorName}/${i.id || ''}`,
      engagementRate:
        followers > 0
          ? parseFloat(((likes + comments) / followers * 100).toFixed(2))
          : 0,
    }
  })

  return {
    followers,
    following,
    totalViews: posts.reduce((sum, p) => sum + p.views, 0),
    posts,
  }
}

export function fmt(n: number | undefined | null): string {
  if (n == null) return '—'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return n.toLocaleString()
}
