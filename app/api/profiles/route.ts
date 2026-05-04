import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  if (!supabase) return NextResponse.json([])

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest) {
  const { username, platform } = await req.json()
  if (!username || !platform) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  if (!supabase) {
    return NextResponse.json({
      id: crypto.randomUUID(),
      username,
      platform,
      status: 'idle',
      created_at: new Date().toISOString(),
    })
  }

  const { data, error } = await supabase
    .from('profiles')
    .upsert({ username, platform, status: 'idle' }, { onConflict: 'username,platform' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
