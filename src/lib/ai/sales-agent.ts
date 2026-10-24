import 'server-only'
import { z } from 'zod'
import { CHANNELS, type Channel } from '@/config/sales'
import { formatClp } from '@/lib/format'
import type { Session } from '@/lib/session'
import { describeHits, searchCatalog } from './catalog'
import { defineTool, runAgent } from './engine'
import { modelFor } from './runtime'

/**
 * Momo vendedor: escribe la próxima respuesta para el cliente final con el catálogo y las
 * políticas reales de la empresa. En las conversaciones con "Momo atiende" responde solo
 * (autoReply); en el resto sugiere y una persona decide.
 * Lo que no sabe lo registra como "duda" para que el equipo se lo enseñe.
 */

interface Transcript {
  author: 'client' | 'ai' | 'human' | 'system'
  body: string | null
}

interface Context {
  channel: Channel
  customer: string
  comuna: string | null
  sale: { title: string | null; value_clp: number; delivery_clp: number } | null
  messages: Transcript[]
  conversationId: string | null
}

async function businessPrompt(session: Session) {
  const { db, org } = session
  const [assistant, knowledge] = await Promise.all([
    db.from('ai_assistants').select('name, system_prompt, model').eq('organization_id', org.id).eq('active', true).order('created_at').limit(1).maybeSingle(),
    db.from('knowledge_entries').select('title, content').eq('organization_id', org.id).order('created_at').limit(80),
  ])
  if (assistant.error) throw assistant.error
  if (knowledge.error) throw knowledge.error

  const policies = (knowledge.data ?? []).map((k) => `### ${k.title}\n${k.content}`).join('\n\n') || 'Aún no hay políticas cargadas.'
  const handoff = org.handoffContacts.map((c) => `${c.label} (${c.phone})`).join(' o ') || 'una persona del equipo'

  const system = `${assistant.data?.system_prompt || `Eres Momo, el asistente de ventas de ${org.name}.`}

## Cómo trabajas en Momo
- Escribes la próxima respuesta para el cliente y se le envía tal cual: eres tú quien atiende.
- Responde SOLO con el texto del mensaje para el cliente: sin comillas, sin explicaciones, sin notas internas.
- Español de Chile, cálido y breve (1 a 4 frases). Pocos emojis.
- Para precios, medidas y productos usa buscar_productos. Nunca inventes precios, medidas, plazos, stock ni políticas.
- Si el cliente pregunta algo que no está en las políticas ni en el catálogo, usa registrar_duda con la pregunta y responde que lo confirmas en breve.
- Si pide algo a medida o fuera de catálogo (por ejemplo cocinas a medida), ofrece derivarlo con ${handoff}.
- Avanza la venta: confirma lo que falta (modelo, color, medidas, comuna), entrega el total si lo conoces y explica cómo pagar.

## Políticas del negocio
${policies}`

  return { system, model: modelFor(assistant.data?.model), assistantName: assistant.data?.name ?? 'Momo' }
}

function transcriptText(ctx: Context) {
  const who = { client: 'Cliente', ai: 'Momo', human: 'Equipo', system: 'Sistema' } as const
  const lines = ctx.messages.filter((m) => m.body).slice(-30).map((m) => `${who[m.author]}: ${m.body}`)
  const sale = ctx.sale?.title
    ? `\nInterés registrado: ${ctx.sale.title}${ctx.sale.value_clp ? ` · ${formatClp(ctx.sale.value_clp)}` : ''}${ctx.sale.delivery_clp ? ` + despacho ${formatClp(ctx.sale.delivery_clp)}` : ''}`
    : ''
  return `Conversación por ${CHANNELS[ctx.channel].label} con ${ctx.customer}${ctx.comuna ? ` (${ctx.comuna})` : ''}.${sale}

${lines.join('\n') || '(sin mensajes todavía)'}

Escribe la próxima respuesta para el cliente.`
}

export type ReplyResult = ({ text: string; error?: undefined } | { error: string; text?: undefined }) & { gaps?: string[] }

async function reply(session: Session, ctx: Context, { allowGaps }: { allowGaps: boolean }): Promise<ReplyResult> {
  const { system, model } = await businessPrompt(session)
  const gaps: string[] = []

  const buscarProductos = defineTool({
    name: 'buscar_productos',
    description: 'Busca productos del catálogo por texto (nombre, categoría, medidas, diseño). Devuelve hasta 8 con precio y oferta.',
    schema: z.object({ consulta: z.string().min(1).max(120) }),
    run: async ({ consulta }) => describeHits(consulta, await searchCatalog(session, consulta)),
  })

  const registrarDuda = defineTool({
    name: 'registrar_duda',
    description: 'Anota una pregunta del cliente que no puedes responder con el catálogo ni las políticas, para que el equipo te la enseñe.',
    schema: z.object({ pregunta: z.string().min(5).max(300).describe('La pregunta, escrita de forma general (sin datos personales)') }),
    run: async ({ pregunta }) => {
      const { db, org } = session
      const { data: existing } = await db.from('knowledge_gaps').select('id').eq('organization_id', org.id).eq('status', 'pendiente').ilike('question', pregunta.replace(/[%_]/g, ' ')).limit(1)
      if (!existing?.length) {
        await db.from('knowledge_gaps').insert({ organization_id: org.id, question: pregunta, conversation_id: ctx.conversationId })
      }
      gaps.push(pregunta)
      return 'Duda anotada. Responde al cliente que lo confirmas en breve.'
    },
  })

  const result = await runAgent(session, {
    feature: 'vendedor', system, claudeModel: model, effort: 'medium',
    tools: allowGaps ? [buscarProductos, registrarDuda] : [buscarProductos],
    messages: [{ role: 'user', text: transcriptText(ctx) }],
  })
  if (result.refused) return { error: 'Momo no puede responder este mensaje. Respóndelo tú.' }
  const text = result.text
  return text ? { text, gaps } : { error: 'Momo no encontró qué responder. Intenta de nuevo.', gaps }
}

/** Sugerencia de respuesta para una conversación registrada. */
export async function suggestReply(session: Session, conversationId: string): Promise<ReplyResult> {
  const { db, org } = session
  const { data: conversation, error } = await db.from('conversations')
    .select('id, channel, contact:contacts(name, comuna), tickets(title, value_clp, delivery_clp)')
    .eq('organization_id', org.id).eq('id', conversationId).maybeSingle()
  if (error) throw error
  if (!conversation) return { error: 'Esa conversación ya no existe.' }
  const { data: messages, error: msgError } = await db.from('messages').select('author, body').eq('conversation_id', conversationId).order('sent_at').limit(300)
  if (msgError) throw msgError

  const contact = conversation.contact as unknown as { name: string; comuna: string | null } | null
  const tickets = conversation.tickets as unknown as Context['sale'][] | null
  return reply(session, {
    channel: conversation.channel as Channel,
    customer: contact?.name ?? 'el cliente',
    comuna: contact?.comuna ?? null,
    sale: tickets?.[0] ?? null,
    messages: (messages ?? []) as Transcript[],
    conversationId,
  }, { allowGaps: true })
}

/**
 * Entrenar a Momo: conversación de práctica completa (no se guarda). Lo que Momo no sabe
 * queda anotado en "Dudas" para que el equipo se lo enseñe.
 */
export async function trainReply(session: Session, messages: { author: 'client' | 'ai'; body: string }[]) {
  return reply(session, {
    channel: 'marketplace', customer: 'un cliente de práctica', comuna: null, sale: null,
    messages, conversationId: null,
  }, { allowGaps: true })
}

/** "Probar a Momo": cómo respondería a una pregunta de prueba (no anota dudas). */
export async function testReply(session: Session, question: string) {
  return reply(session, {
    channel: 'marketplace', customer: 'un cliente de prueba', comuna: null, sale: null,
    messages: [{ author: 'client', body: question }], conversationId: null,
  }, { allowGaps: false })
}

/**
 * Modo automático: si la conversación tiene "Momo atiende", Momo escribe y guarda su respuesta
 * apenas llega un mensaje del cliente. Nunca lanza error: si falla, la conversación queda en
 * "Te esperan" para que responda una persona.
 */
export async function autoReply(session: Session, conversationId: string) {
  try {
    const { data } = await session.db.from('conversations').select('ai_enabled, status').eq('organization_id', session.org.id).eq('id', conversationId).maybeSingle()
    if (!data?.ai_enabled || data.status === 'closed') return
    const result = await suggestReply(session, conversationId)
    if (!result.text) return
    await session.db.from('messages').insert({ organization_id: session.org.id, conversation_id: conversationId, author: 'ai', body: result.text })
  } catch (error) {
    console.error('Momo automático: no pudo responder', error)
  }
}
