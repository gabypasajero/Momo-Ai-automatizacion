'use server'

import { revalidatePath } from 'next/cache'
import { EDITORS, MANAGERS, attempt, checked, describeError, fail, money, ok, optionalMoney, optionalText, requireRole, text, uuid, type ActionState } from '@/lib/actions'
import { describeAiError } from '@/lib/ai/runtime'
import type { ProductPhoto } from '@/lib/ai/catalog'
import { testReply, trainReply } from '@/lib/ai/sales-agent'
import type { Session } from '@/lib/session'

const refresh = () => {
  revalidatePath('/conocimiento')
  revalidatePath('/hoy')
}

async function assistantId(session: Session) {
  const { data } = await session.db.from('ai_assistants').select('id').eq('organization_id', session.org.id).eq('active', true).order('created_at').limit(1).maybeSingle()
  return (data?.id as string | undefined) ?? null
}

// ---------------------------------------------------------------------------
// Políticas
// ---------------------------------------------------------------------------

export async function savePolicy(_prev: ActionState, form: FormData): Promise<ActionState> {
  return attempt(async () => {
    const session = await requireRole(EDITORS)
    const id = optionalText(form, 'id', 40)
    const title = text(form, 'title', 120)
    const content = text(form, 'content', 4000)
    if (title.length < 3) return fail('Escribe un título corto, por ejemplo "Despacho a regiones".')
    if (content.length < 10) return fail('Escribe la política completa, como se la explicarías a un cliente.')
    const { db, org } = session
    const { error } = id
      ? await db.from('knowledge_entries').update({ title, content }).eq('organization_id', org.id).eq('id', id)
      : await db.from('knowledge_entries').insert({ organization_id: org.id, assistant_id: await assistantId(session), title, content })
    if (error) throw error
    refresh()
    return ok(id ? 'Política actualizada.' : 'Política agregada. Momo ya la usa al responder.')
  })
}

export async function deletePolicy(_prev: ActionState, form: FormData): Promise<ActionState> {
  return attempt(async () => {
    const session = await requireRole(MANAGERS)
    const { error } = await session.db.from('knowledge_entries').delete().eq('organization_id', session.org.id).eq('id', uuid(form, 'id'))
    if (error) throw error
    refresh()
    return ok('Política eliminada.')
  })
}

// ---------------------------------------------------------------------------
// Dudas que Momo no supo responder
// ---------------------------------------------------------------------------

/** Enseñarle a Momo: la respuesta se guarda como política y la duda queda resuelta. */
export async function answerGap(_prev: ActionState, form: FormData): Promise<ActionState> {
  return attempt(async () => {
    const session = await requireRole(EDITORS)
    const { db, org } = session
    const id = uuid(form, 'gap_id')
    const title = text(form, 'title', 120)
    const content = text(form, 'content', 4000)
    if (title.length < 3) return fail('Escribe un título para la política.')
    if (content.length < 5) return fail('Escribe la respuesta que debe dar Momo.')
    const { data: entry, error } = await db.from('knowledge_entries')
      .insert({ organization_id: org.id, assistant_id: await assistantId(session), title, content }).select('id').single()
    if (error) throw error
    const { error: gapError } = await db.from('knowledge_gaps').update({ status: 'resuelta', knowledge_entry_id: entry.id, snoozed_until: null })
      .eq('organization_id', org.id).eq('id', id)
    if (gapError) throw gapError
    refresh()
    return ok('¡Gracias! Momo ya sabe responder esto.')
  })
}

export async function snoozeGap(form: FormData) {
  const session = await requireRole(EDITORS)
  const until = new Date(Date.now() + 86_400_000).toISOString()
  const { error } = await session.db.from('knowledge_gaps').update({ snoozed_until: until }).eq('organization_id', session.org.id).eq('id', uuid(form, 'gap_id'))
  if (error) throw error
  refresh()
}

export async function dismissGap(_prev: ActionState, form: FormData): Promise<ActionState> {
  return attempt(async () => {
    const session = await requireRole(EDITORS)
    const { error } = await session.db.from('knowledge_gaps').update({ status: 'descartada' }).eq('organization_id', session.org.id).eq('id', uuid(form, 'gap_id'))
    if (error) throw error
    refresh()
    return ok('Duda descartada.')
  })
}

/** Anotar a mano una pregunta frecuente que Momo aún no sabe responder. */
export async function addGap(_prev: ActionState, form: FormData): Promise<ActionState> {
  return attempt(async () => {
    const session = await requireRole(EDITORS)
    const question = text(form, 'question', 300)
    if (question.length < 5) return fail('Escribe la pregunta del cliente.')
    const { error } = await session.db.from('knowledge_gaps').insert({ organization_id: session.org.id, question })
    if (error) throw error
    refresh()
    return ok('Duda anotada.')
  })
}

// ---------------------------------------------------------------------------
// Productos
// ---------------------------------------------------------------------------

export async function saveProduct(_prev: ActionState, form: FormData): Promise<ActionState> {
  return attempt(async () => {
    const session = await requireRole(EDITORS)
    const id = optionalText(form, 'id', 40)
    const name = text(form, 'name', 160)
    if (name.length < 2) return fail('Escribe el nombre del producto.')
    const price = money(form, 'price_clp')
    if (price <= 0) return fail('Escribe el precio.')
    const sale = optionalMoney(form, 'sale_price_clp')
    if (sale !== null && sale >= price) return fail('El precio de oferta debe ser menor al precio normal.')
    const values = {
      name,
      category: optionalText(form, 'category', 80),
      price_clp: price,
      sale_price_clp: sale,
      dimensions: optionalText(form, 'dimensions', 120),
      description: optionalText(form, 'description', 2000),
      customizable: checked(form, 'customizable'),
      active: checked(form, 'active'),
    }
    const { db, org } = session
    const { error } = id
      ? await db.from('products').update(values).eq('organization_id', org.id).eq('id', id)
      : await db.from('products').insert({ organization_id: org.id, source: 'manual', ...values })
    if (error) throw error
    refresh()
    return ok(id ? 'Producto actualizado.' : 'Producto agregado al catálogo.')
  })
}

export async function setProductActive(form: FormData) {
  const session = await requireRole(EDITORS)
  const { error } = await session.db.from('products').update({ active: checked(form, 'active') }).eq('organization_id', session.org.id).eq('id', uuid(form, 'id'))
  if (error) throw error
  refresh()
}

// ---------------------------------------------------------------------------
// Personalidad de Momo
// ---------------------------------------------------------------------------

export async function savePersonality(_prev: ActionState, form: FormData): Promise<ActionState> {
  return attempt(async () => {
    const session = await requireRole(MANAGERS)
    const id = uuid(form, 'assistant_id')
    const name = text(form, 'name', 60)
    const prompt = text(form, 'system_prompt', 8000)
    if (name.length < 2) return fail('Ponle un nombre al asistente.')
    if (prompt.length < 40) return fail('Las instrucciones son muy cortas: explica cómo debe atender Momo.')
    const { error } = await session.db.from('ai_assistants').update({ name, system_prompt: prompt })
      .eq('organization_id', session.org.id).eq('id', id)
    if (error) throw error
    refresh()
    return ok('Instrucciones guardadas. Momo las usa desde su próxima respuesta.')
  })
}

export type TestResult = { text: string; error?: undefined } | { error: string; text?: undefined }

/** "Probar a Momo": cómo respondería a una pregunta (no se guarda nada). */
export async function testMomo(question: string): Promise<TestResult> {
  let session
  try {
    session = await requireRole(EDITORS)
  } catch (error) {
    return { error: describeError(error) }
  }
  const clean = question.trim().slice(0, 1000)
  if (clean.length < 3) return { error: 'Escribe una pregunta como la haría un cliente.' }
  try {
    const result = await testReply(session, clean)
    return result.text ? { text: result.text } : { error: result.error ?? 'Momo no encontró qué responder.' }
  } catch (error) {
    return { error: describeAiError(error) }
  }
}

export type TrainResult = { text?: string; error?: string; gaps?: string[]; photos?: ProductPhoto[] }

/** Un turno del entrenamiento: Momo responde a la conversación de práctica completa. */
const IMAGE_URL = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/

export async function trainMomo(messages: { author: 'client' | 'ai'; body: string; image?: string }[]): Promise<TrainResult> {
  let session
  try {
    session = await requireRole(EDITORS)
  } catch (error) {
    return { error: describeError(error) }
  }
  const recent = messages.slice(-30)
  // Solo las 3 fotos más recientes viajan a la IA (las anteriores quedan como "[envió una foto]").
  const images = recent.flatMap((m) => {
    const match = m.author === 'client' && typeof m.image === 'string' && m.image.length < 2_800_000 ? IMAGE_URL.exec(m.image) : null
    return match ? [{ mediaType: match[1] as 'image/jpeg' | 'image/png' | 'image/webp', data: match[2]! }] : []
  }).slice(-3)
  const clean = recent.map((m) => ({
    author: m.author === 'ai' ? 'ai' as const : 'client' as const,
    body: String(m.body ?? '').trim().slice(0, 1000),
    photo: m.author === 'client' && Boolean(m.image),
  })).filter((m) => m.body || m.photo)
  if (clean.at(-1)?.author !== 'client') return { error: 'Escribe un mensaje como lo haría un cliente.' }
  try {
    const result = await trainReply(session, clean, images)
    if (result.gaps?.length) refresh()
    return result.text ? { text: result.text, gaps: result.gaps, photos: result.photos } : { error: result.error ?? 'Momo no encontró qué responder.', gaps: result.gaps }
  } catch (error) {
    return { error: describeAiError(error) }
  }
}

/** Corrección durante el entrenamiento: queda como conocimiento para las próximas respuestas. */
export async function teachMomo(question: string, answer: string): Promise<{ ok?: boolean; error?: string }> {
  try {
    const session = await requireRole(EDITORS)
    const q = question.trim().slice(0, 500)
    const a = answer.trim().slice(0, 2000)
    if (a.length < 3) return { error: 'Escribe cómo debió responder Momo.' }
    const title = `Respuesta enseñada: ${q.length > 60 ? q.slice(0, 57) + '…' : q || 'conversación de práctica'}`
    const content = q ? `Cuando un cliente pregunte algo como «${q}», responde así: ${a}` : a
    const { error } = await session.db.from('knowledge_entries').insert({ organization_id: session.org.id, assistant_id: await assistantId(session), title, content })
    if (error) throw error
    refresh()
    return { ok: true }
  } catch (error) {
    return { error: describeError(error) }
  }
}
