import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import webpush from 'web-push'
import { VAPID_PUBLIC_KEY } from '@/config/push'
import { DB_SCHEMA, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '@/lib/env'

interface Payload {
  title: string
  body: string
  url: string
  tag?: string
  subscriptions: { endpoint: string; p256dh: string; auth: string }[]
}

/** Lo llama la base de datos (momo.avisar_mensaje_cliente) cuando escribe un cliente. */
export async function POST(request: Request) {
  const secret = process.env.MOMO_AVISOS_SECRET
  const privateKey = process.env.VAPID_PRIVATE_KEY
  if (!secret || !privateKey) return NextResponse.json({ error: 'avisos sin configurar' }, { status: 503 })
  if (request.headers.get('x-momo-secret') !== secret) return NextResponse.json({ error: 'no autorizado' }, { status: 401 })

  const data = (await request.json()) as Payload
  webpush.setVapidDetails('https://momo-ai-automatizacion-de-todito.vercel.app', VAPID_PUBLIC_KEY, privateKey)
  const message = JSON.stringify({ title: data.title, body: data.body, url: data.url, tag: data.tag })

  const gone: string[] = []
  await Promise.all((data.subscriptions ?? []).map(async (s) => {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, message, { TTL: 3600, urgency: 'high' })
    } catch (error) {
      const status = (error as { statusCode?: number }).statusCode
      if (status === 404 || status === 410) gone.push(s.endpoint)
    }
  }))

  if (gone.length) {
    const db = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { db: { schema: DB_SCHEMA }, auth: { persistSession: false } })
    await db.rpc('avisos_borrar', { p_secret: secret, p_endpoints: gone })
  }
  return NextResponse.json({ sent: (data.subscriptions?.length ?? 0) - gone.length, removed: gone.length })
}
