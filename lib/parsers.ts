import { Post, ProfileData } from './types'

export function parseInstagram(items: Record<string, unknown>[]): ProfileData {
  if (!items.length) return { followers: 0, following: 0, totalViews: 0, posts: [] }

  const profileItem = (items.find((i) => i.followersCount != null) || items[0]) as Record<string, unknown>
  const followers = (profileItem.followersCount as number) || 0

  const posts: Post[] = items.map((item, idx) => {
    const i = item as Record<string, unknown>
    const likes = (i.likesCount as number) || (i.likeCount as number) || 0
    const comments = (i.commentsCount as number) || (i.commentCount as number) || 0
    const views = (i.videoViewCount as number) || (i.videoPlayCount as number) || 0
    const type = i.type === 'video' ? 'Reel' : i.type === 'sidecar' ? 'Carousel' : 'Photo'

    return {
      id: (i.id as string) || String(idx),
      type: type as Post['type'],
      date: (i.timestamp as string) || '',
      views,
      likes,
      saves: (i.saves as number) || 0,
      comments,
      shares: 0,
      thumbnail: (i.displayUrl as string) || (i.imageUrl as string) || (i.thumbnailUrl as string),
      url: (i.url as string) || (i.shortCode ? `https://www.instagram.com/p/${i.shortCode}/` : undefined),
      engagementRate: followers > 0 ? parseFloat(((likes + comments) / followers * 100).toFixed(2)) : 0,
    }
  })

  return {
    followers,
    following: (profileItem.followingCount as number) || 0,
    totalViews: posts.reduce((sum, p) => sum + p.views, 0),
    posts,
  }
}

export function parseTikTok(items: Record<string, unknown>[]): ProfileData {
  if (!items.length) return { followers: 0, following: 0, totalViews: 0, posts: [] }

  // authorMeta can be nested or at top level depending on the actor version
  const first = items[0] as Record<string, unknown>
  const authorMeta =
    (first.authorMeta as Record<string, unknown>) ||
    (first.author as Record<string, unknown>) ||
    {}

  // fans / followers field varies between actor versions
  const followers =
    (authorMeta.fans as number) ||
    (authorMeta.followers as number) ||
    (authorMeta.followerCount as number) ||
    0

  const posts: Post[] = items.map((item, idx) => {
    const i = item as Record<string, unknown>
    const meta =
      (i.authorMeta as Record<string, unknown>) ||
      (i.author as Record<string, unknown>) ||
      {}

    const likes =
      (i.diggCount as number) ||
      (i.likeCount as number) ||
      (i.heartCount as number) ||
      0
    const comments = (i.commentCount as number) || (i.comments as number) || 0
    const views = (i.playCount as number) || (i.viewCount as number) || 0
    const shares = (i.shareCount as number) || 0
    const saves = (i.collectCount as number) || (i.savedCount as number) || 0

    let date = (i.createTimeISO as string) || ''
    if (!date && i.createTime) {
      date = new Date((i.createTime as number) * 1000).toISOString()
    }

    // covers can be an array or a single URL string
    const covers = (i.covers as string[]) || []
    const thumbnail =
      covers[0] ||
      (i.coverUrl as string) ||
      (i.thumbnail as string) ||
      (i.cover as string)

    const authorName =
      (meta.name as string) ||
      (meta.uniqueId as string) ||
      (meta.id as string) ||
      ''

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
    following: (authorMeta.following as number) || (authorMeta.followingCount as number) || 0,
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
