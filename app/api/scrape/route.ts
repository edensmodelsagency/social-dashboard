import { NextRequest, NextResponse } from 'next/server'

const TOKEN = process.env.APIFY_TOKEN!

const ACTORS: Record<string, string> = {
  instagram: 'apify~instagram-scraper',
  tiktok: 'clockworks~free-tiktok-scraper',
}

async function startRun(actor: string, input: Record<string, unknown>): Promise<string> {
  const res = await fetch(`https://api.apify.com/v2/acts/${actor}/runs?token=${TOKEN}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(`Apify error: ${await res.text()}`)
  const runId = (await res.json())?.data?.id
  if (!runId) throw new Error('No run ID returned')
  return runId
}

export async function POST(req: NextRequest) {
  const { username, platform } = await req.json()
  if (!username || !platform) {
    return NextResponse.json({ error: 'Missing username or platform' }, { status: 400 })
  }

  const actor = ACTORS[platform]
  if (!actor) return NextResponse.json({ error: 'Invalid platform' }, { status: 400 })

  if (!TOKEN) {
    return NextResponse.json({ error: 'APIFY_TOKEN not configured' }, { status: 500 })
  }

  try {
    if (platform === 'instagram') {
      // Run posts + reels scrapes in parallel
      // Second run uses resultsType:'reels' — the actor treats /reels/ URL differently
      const [postsRunId, reelsRunId] = await Promise.all([
        startRun(actor, {
          directUrls: [`https://www.instagram.com/${username}/`],
          resultsType: 'posts',
          resultsLimit: 50,
          addParentData: true,
          maxRequestRetries: 3,
        }),
        startRun(actor, {
          directUrls: [`https://www.instagram.com/${username}/reels/`],
          resultsType: 'reels',
          resultsLimit: 50,
          addParentData: true,
          maxRequestRetries: 3,
        }),
      ])
      return NextResponse.json({ runIds: [postsRunId, reelsRunId] })
    } else {
      const runId = await startRun(actor, {
        profiles: [`https://www.tiktok.com/@${username}`],
        resultsPerPage: 30,
        shouldDownloadVideos: false,
        shouldDownloadCovers: false,
        shouldDownloadSubtitles: false,
      })
      return NextResponse.json({ runIds: [runId] })
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
