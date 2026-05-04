import { NextRequest, NextResponse } from 'next/server'

const TOKEN = process.env.APIFY_TOKEN!
const ACTORS: Record<string, string> = {
  instagram: 'apify~instagram-scraper',
  tiktok: 'clockworks~tiktok-scraper',
}

export async function POST(req: NextRequest) {
  const { username, platform } = await req.json()
  if (!username || !platform) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }
  const actor = ACTORS[platform]
  if (!TOKEN) return NextResponse.json({ error: 'No token' }, { status: 500 })

  const input = platform === 'instagram'
    ? { directUrls: [`https://www.instagram.com/${username}/`], resultsType: 'posts', resultsLimit: 30, addParentData: true }
    : { profiles: [`https://www.tiktok.com/@${username}`], resultsType: 'posts', maxPostsPerProfile: 30, shouldDownloadVideos: false, shouldDownloadCovers: false }

  const runRes = await fetch(`https://api.apify.com/v2/acts/${actor}/runs?token=${TOKEN}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!runRes.ok) return NextResponse.json({ error: await runRes.text() }, { status: 500 })

  const runId = (await runRes.json())?.data?.id
  if (!runId) return NextResponse.json({ error: 'No run ID' }, { status: 500 })

  // Poll until done
  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, 5000))
    const st = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${TOKEN}`)
    const status = (await st.json())?.data?.status
    if (status === 'SUCCEEDED') break
    if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(status)) {
      return NextResponse.json({ error: `Run ${status}` }, { status: 500 })
    }
  }

  const items = await (await fetch(`https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${TOKEN}&limit=50`)).json()
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Δεν βρέθηκαν δεδομένα.' }, { status: 404 })
  }

  return NextResponse.json({ items })
}
