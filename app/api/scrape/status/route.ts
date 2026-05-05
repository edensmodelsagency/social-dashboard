import { NextRequest, NextResponse } from 'next/server'

const TOKEN = process.env.APIFY_TOKEN!

async function checkRun(runId: string): Promise<
  | { status: 'running' }
  | { status: 'failed'; error?: string }
  | { status: 'succeeded'; items: Record<string, unknown>[] }
> {
  const st = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${TOKEN}`)
  if (!st.ok) return { status: 'failed', error: 'Failed to check run status' }

  const apifyStatus: string = (await st.json())?.data?.status || 'UNKNOWN'

  if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(apifyStatus)) {
    return { status: 'failed', error: `Run ${apifyStatus}` }
  }

  if (apifyStatus !== 'SUCCEEDED') {
    return { status: 'running' }
  }

  const res = await fetch(
    `https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${TOKEN}&limit=100`
  )
  const items = await res.json()
  return {
    status: 'succeeded',
    items: Array.isArray(items) ? items : [],
  }
}

export async function GET(req: NextRequest) {
  const param = req.nextUrl.searchParams.get('runIds')
  if (!param) return NextResponse.json({ error: 'Missing runIds' }, { status: 400 })

  const runIds = param.split(',').filter(Boolean)
  if (runIds.length === 0) return NextResponse.json({ error: 'No valid runIds' }, { status: 400 })

  const results = await Promise.all(runIds.map(checkRun))

  // Any failed → report failure
  const failed = results.find((r) => r.status === 'failed')
  if (failed) return NextResponse.json(failed)

  // Any still running → report running
  if (results.some((r) => r.status === 'running')) {
    return NextResponse.json({ status: 'running' })
  }

  // All succeeded — log per-run counts before merging
  const succeededResults = results.filter((r) => r.status === 'succeeded') as {
    status: 'succeeded'
    items: Record<string, unknown>[]
  }[]

  // Log each run's item count and first item id separately
  succeededResults.forEach((r, idx) => {
    console.log(
      `[scrape/status] run[${idx}] items=${r.items.length} firstId=${r.items[0]?.id ?? 'none'} firstShortCode=${r.items[0]?.shortCode ?? 'none'}`
    )
  })

  // If exactly 2 runs (Instagram posts + reels), log them by name
  if (succeededResults.length === 2) {
    const postsItems = succeededResults[0].items
    const reelsItems = succeededResults[1].items
    console.log(
      `[scrape/status] posts items: ${postsItems.length} reels items: ${reelsItems.length}`
    )
    console.log('[scrape/status] first post item id:', postsItems[0]?.id)
    console.log('[scrape/status] first reel item id:', reelsItems[0]?.id)
    // Log first reel item keys to see what the actor actually returns for reels
    if (reelsItems[0]) {
      console.log('[scrape/status] first reel item keys:', Object.keys(reelsItems[0]).join(', '))
    }
  }

  const allItems = succeededResults.flatMap((r) => r.items)

  const seen = new Set<string>()
  const unique = allItems.filter((item) => {
    const id = (item.id as string) || (item.shortCode as string) || JSON.stringify(item).slice(0, 40)
    const isDup = seen.has(id)
    if (!isDup) seen.add(id)
    // Log if a reel-type item is being dropped as duplicate
    if (isDup && (item.type === 'video' || item.productType === 'clips')) {
      console.log('[scrape/status] DUPLICATE reel dropped, id:', id)
    }
    return !isDup
  })

  console.log(
    `[scrape/status] runIds=${runIds.join(',')} total=${allItems.length} unique=${unique.length} (merged: ${unique.length})`
  )

  // Log view-count fields on first video item to diagnose reel parsing
  const firstVideo = unique.find((i) => i.type === 'video' || i.productType === 'clips')
  if (firstVideo) {
    console.log('[scrape/status] first reel fields:', JSON.stringify({
      type: firstVideo.type,
      productType: firstVideo.productType,
      videoViewCount: firstVideo.videoViewCount,
      videoPlayCount: firstVideo.videoPlayCount,
      playCount: firstVideo.playCount,
      viewCount: firstVideo.viewCount,
    }))
  }

  if (unique.length === 0) {
    return NextResponse.json(
      { status: 'failed', error: 'Δεν βρέθηκαν δεδομένα. Το προφίλ μπορεί να είναι private.' },
      { status: 404 }
    )
  }

  return NextResponse.json({ status: 'succeeded', items: unique })
}
