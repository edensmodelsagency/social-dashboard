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

  // All succeeded — merge and deduplicate by id
  const allItems = results.flatMap((r) =>
    r.status === 'succeeded' ? r.items : []
  )

  const seen = new Set<string>()
  const unique = allItems.filter((item) => {
    const id = (item.id as string) || (item.shortCode as string) || JSON.stringify(item).slice(0, 40)
    if (seen.has(id)) return false
    seen.add(id)
    return true
  })

  console.log(
    `[scrape/status] runIds=${runIds.join(',')} total=${allItems.length} unique=${unique.length}`
  )

  if (unique.length === 0) {
    return NextResponse.json(
      { status: 'failed', error: 'Δεν βρέθηκαν δεδομένα. Το προφίλ μπορεί να είναι private.' },
      { status: 404 }
    )
  }

  return NextResponse.json({ status: 'succeeded', items: unique })
}
