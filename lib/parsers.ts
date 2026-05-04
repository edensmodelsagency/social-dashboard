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

  const authorMeta = (items[0] as Record<string, unknown>)?.authorMeta as Record<string, unknown> || {}
  const followers = (authorMeta.fans as number) || (authorMeta.followers as number) || 0

  const posts: Post[] = items.map((item, idx) => {
    const i = item as Record<string, unknown>
    const likes = (i.diggCount as number) || 0
    const comments = (i.commentCount as number) || 0
    const views = (i.playCount as number) || 0
    const shares = (i.shareCount as number) || 0
    const saves = (i.collectCount as number) || 0
    const meta = (i.authorMeta as Record<string, unknown>) || {}

    let date = (i.createTimeISO as string) || ''
    if (!date && i.createTime) {
      date = new Date((i.createTime as number) * 1000).toISOString()
    }

    const covers = (i.covers as string[]) || []

    return {
      id: (i.id as string) || String(idx),
      type: 'Video',
      date,
      views,
      likes,
      saves,
      comments,
      shares,
      thumbnail: covers[0] || (i.coverUrl as string),
      url: `https://www.tiktok.com/@${meta.name || ''}/${i.id || ''}`,
      engagementRate: followers > 0 ? parseFloat(((likes + comments) / followers * 100).toFixed(2)) : 0,
    }
  })

  return {
    followers,
    following: (authorMeta.following as number) || 0,
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
