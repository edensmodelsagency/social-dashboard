import { NextRequest, NextResponse } from 'next/server'

// Server-side image proxy — bypasses CORS on Instagram/TikTok CDN URLs
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('url')
  if (!raw) return new NextResponse('Missing url param', { status: 400 })

  let url: string
  try {
    url = decodeURIComponent(raw)
    new URL(url) // validate
  } catch {
    return new NextResponse('Invalid url', { status: 400 })
  }

  try {
    const upstream = await fetch(url, {
      headers: {
        // Mimic a browser so CDNs don't block the request
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        Referer: 'https://www.instagram.com/',
      },
      // Respect redirects (CDNs often redirect to the actual asset)
      redirect: 'follow',
    })

    if (!upstream.ok) {
      return new NextResponse(`Upstream error ${upstream.status}`, {
        status: upstream.status,
      })
    }

    const contentType = upstream.headers.get('content-type') || 'image/jpeg'
    const buffer = await upstream.arrayBuffer()

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        // Cache for 1 hour in browser, 6 hours on CDN edge
        'Cache-Control': 'public, max-age=3600, s-maxage=21600',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (err) {
    console.error('[thumbnail proxy] fetch error:', err)
    return new NextResponse('Failed to fetch image', { status: 502 })
  }
}
