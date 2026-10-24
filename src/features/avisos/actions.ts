'use server'

import { getSession } from '@/lib/session'

interface Sub { endpoint: string; p256dh: string; auth: string }

/** Guarda la "dirección" de este teléfono para recibir avisos. */
export async function savePushSubscription(sub: Sub) {
  const { db, user } = await getSession()
  await db.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
  const { error } = await db.from('push_subscriptions').insert({ user_id: user.id, ...sub })
  return { ok: !error }
}

export async function deletePushSubscription(endpoint: string) {
  const { db } = await getSession()
  await db.from('push_subscriptions').delete().eq('endpoint', endpoint)
  return { ok: true }
}
