import { NextRequest, NextResponse } from 'next/server';

const TOKEN = process.env.APIFY_TOKEN!;
const ACTORS: Record<string, string> = {
  instagram: 'apify~instagram-scraper',
  tiktok: 'clockworks~tiktok-scraper',
};

export async function POST(req: NextRequest) {
  const { username, platform } = await req.json();
  if (!username || !platform) {
    return NextResponse.json({ error: 'Missing username or platform' }, { status: 400 });
  }

  const actor = ACTORS[platform];
  if (!actor) return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });

  const input =
    platform === 'instagram'
      ? {
          directUrls: [`https://www.instagram.com/${username}/`],
          resultsType: 'posts',
          resultsLimit: 12,
          addParentData: true,
        }
      : {
          profiles: [`https://www.tiktok.com/@${username}`],
          resultsType: 'posts',
          maxPostsPerProfile: 12,
        };

  // Start run
  const runRes = await fetch(
    `https://api.apify.com/v2/acts/${actor}/runs?token=${TOKEN}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }
  );

  if (!runRes.ok) {
    const txt = await runRes.text();
    return NextResponse.json({ error: `Apify error: ${txt}` }, { status: 500 });
  }

  const runJson = await runRes.json();
  const runId = runJson?.data?.id;
  if (!runId) return NextResponse.json({ error: 'No run ID returned' }, { status: 500 });

  // Poll for completion (max 2 min)
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 4000));
    const st = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}?token=${TOKEN}`
    );
    const stJson = await st.json();
    const status = stJson?.data?.status;
    if (status === 'SUCCEEDED') break;
    if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(status)) {
      return NextResponse.json({ error: `Run failed with status: ${status}` }, { status: 500 });
    }
  }

  // Fetch results
  const resData = await fetch(
    `https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${TOKEN}&limit=50`
  );
  const items = await resData.json();

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { error: 'Δεν βρέθηκαν δεδομένα. Το προφίλ μπορεί να είναι private.' },
      { status: 404 }
    );
  }

  return NextResponse.json({ items });
}
