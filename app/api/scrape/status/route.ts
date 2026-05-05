import { NextRequest, NextResponse } from 'next/server'

const TOKEN = process.env.APIFY_TOKEN!

export async function GET(req: NextRequest) {
  const runId = req.nextUrl.searchParams.get('runId')
  if (!runId) return NextResponse.json({ error: 'Missing runId' }, { status: 400 })

  const st = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${TOKEN}`)
  if (!st.ok) return NextResponse.json({ error: 'Failed to check status' }, { status: 500 })

  const stJson = await st.json()
  const status: string = stJson?.data?.status || 'UNKNOWN'

  if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(status)) {
    return NextResponse.json({ status: 'failed', apifyStatus: status })
  }

  if (status !== 'SUCCEEDED') {
    return NextResponse.json({ status: 'running', apifyStatus: status })
  }

  const resData = await fetch(
    `https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${TOKEN}&limit=50`
  )
  const items = await resData.json()

  console.log(`[scrape/status] runId=${runId} items=${Array.isArray(items) ? items.length : 'not-array'}`)

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { status: 'failed', error: 'Δεν βρέθηκαν δεδομένα. Το προφίλ μπορεί να είναι private.' },
      { status: 404 }
    )
  }

  return NextResponse.json({ status: 'succeeded', items })
}
