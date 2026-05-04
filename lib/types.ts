export type Platform = 'instagram' | 'tiktok'
export type ProfileStatus = 'idle' | 'loading' | 'done' | 'error'

export interface Post {
  id: string
  type: 'Reel' | 'Photo' | 'Carousel' | 'Video'
  date: string
  views: number
  likes: number
  saves: number
  comments: number
  shares: number
  thumbnail?: string
  url?: string
  engagementRate: number
}

export interface ProfileData {
  followers: number
  following: number
  totalViews: number
  posts: Post[]
}

export interface Profile {
  id: string
  username: string
  platform: Platform
  status: ProfileStatus
  data?: ProfileData
  error?: string
  last_scraped_at?: string
  created_at: string
}
