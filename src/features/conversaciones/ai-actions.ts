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
