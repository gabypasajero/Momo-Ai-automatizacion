'use server'

import webpush from 'web-push'
import { getSession } from '@/lib/session'

interface Sub { endpoint: string; p256dh: string; auth: string }

/** Clave pública de los avisos. La primera vez se crea el par de claves y se guarda en la bóveda de Supabase. */
export async function getPushPublicKey(): Promise<string | null> {
  const { db } = await getSession()
  const { data } = await db.rpc('avisos_clave_publica')
  if (data) return data as string
  const keys = webpush.generateVAPIDKeys()
  const { data: stored, error } = await db.rpc('avisos_iniciar_claves', { p_public: keys.publicKey, p_private: keys.privateKey })
  return error ? null : (stored as string)
}

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
