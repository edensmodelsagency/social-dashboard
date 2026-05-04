import { NextRequest, NextResponse } from 'next/server'

const TOKEN = process.env.APIFY_TOKEN!

const ACTORS: Record<string, string> = {
  instagram: 'apify~instagram-scraper',
  tiktok: 'clockworks~free-tiktok-scraper',
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

  const input =
    platform === 'instagram'
      ? {
          directUrls: [`https://www.instagram.com/${username}/`],
          resultsType: 'posts',
          resultsLimit: 30,
          addParentData: true,
        }
      : {
          postURLs: [],
          profileURLs: [`https://www.tiktok.com/@${username}`],
          maxPostsPerProfile: 30,
          shouldDownloadVideos: false,
          shouldDownloadCovers: false,
          proxyCountryCode: 'None',
        }

  const runRes = await fetch(`https://api.apify.com/v2/acts/${actor}/runs?token=${TOKEN}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!runRes.ok) {
    const txt = await runRes.text()
    return NextResponse.json({ error: `Apify error: ${txt}` }, { status: 500 })
  }

  const runJson = await runRes.json()
  const runId = runJson?.data?.id
  if (!runId) return NextResponse.json({ error: 'No run ID returned' }, { status: 500 })

  return NextResponse.json({ runId })
}
