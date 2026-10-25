'use server'

import { EDITORS, describeError, requireRole } from '@/lib/actions'
import { describeAiError } from '@/lib/ai/runtime'
import type { ProductPhoto } from '@/lib/ai/catalog'
import { suggestReply } from '@/lib/ai/sales-agent'

export type SuggestionResult = ({ text: string; error?: undefined } | { error: string; text?: undefined }) & { photos?: ProductPhoto[] }

/** Pide a Momo la próxima respuesta para el cliente (no envía nada: la persona la revisa). */
export async function suggestReplyAction(conversationId: string): Promise<SuggestionResult> {
  let session
  try {
    session = await requireRole(EDITORS)
  } catch (error) {
    return { error: describeError(error) }
  }
  if (!/^[0-9a-f-]{36}$/i.test(conversationId)) return { error: 'Conversación no válida.' }
  try {
    const result = await suggestReply(session, conversationId)
    return result.text ? { text: result.text, photos: result.photos } : { error: result.error ?? 'Momo no encontró qué responder.' }
  } catch (error) {
    return { error: describeAiError(error) }
  }
}

/** "Responde así la próxima vez": guarda en la memoria de Momo la respuesta que el equipo corrigió. */
export async function learnFromEdit(conversationId: string, answer: string): Promise<{ ok?: boolean; error?: string }> {
  try {
    const session = await requireRole(EDITORS)
    if (!/^[0-9a-f-]{36}$/i.test(conversationId)) return { error: 'Conversación no válida.' }
    const clean = answer.trim().slice(0, 3000)
    if (clean.length < 3) return { error: 'La respuesta está vacía.' }
    const { data: last, error } = await session.db.from('messages').select('body').eq('organization_id', session.org.id)
      .eq('conversation_id', conversationId).eq('author', 'client').order('sent_at', { ascending: false }).limit(1).maybeSingle()
    if (error) throw error
    if (!last?.body) return { error: 'No encontré el mensaje del cliente para asociarlo.' }
    const { error: insertError } = await session.db.from('momo_memory').insert({
      organization_id: session.org.id, kind: 'corregida', source: 'conversacion', question: String(last.body).slice(0, 1000), answer: clean,
    })
    if (insertError) throw insertError
    return { ok: true }
  } catch (error) {
    return { error: describeError(error) }
  }
}
