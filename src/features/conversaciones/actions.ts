'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { isChannel, isStep, WON_STEPS } from '@/config/sales'
import {
  EDITORS, MANAGERS, UserError, attempt, checked, fail, money, ok, optionalText, optionalUuid, requireRole, searchTerm, text, uuid,
  type ActionState,
} from '@/lib/actions'
import { autoReply } from '@/lib/ai/sales-agent'
import type { Session } from '@/lib/session'

const refresh = () => {
  revalidatePath('/conversaciones')
  revalidatePath('/hoy')
}

async function ensureConversation(session: Session, id: string) {
  const { data, error } = await session.db.from('conversations').select('id, contact_id').eq('organization_id', session.org.id).eq('id', id).maybeSingle()
  if (error) throw error
  if (!data) throw new UserError('Esa conversación ya no existe.')
  return data as { id: string; contact_id: string }
}

/** Nueva conversación registrada a mano (modo copiloto: chats de Marketplace sin API). */
export async function createConversation(_prev: ActionState, form: FormData): Promise<ActionState> {
  let conversationId = ''
  const result = await attempt(async () => {
    const session = await requireRole(EDITORS)
    const { db, org } = session
    const channel = text(form, 'channel', 20)
    if (!isChannel(channel)) return fail('Elige el canal por donde escribió.')

    let contactId = optionalUuid(form, 'contact_id')
    if (!contactId) {
      const name = text(form, 'name', 120)
      if (name.length < 2) return fail('Escribe el nombre del cliente.')
      const { data, error } = await db.from('contacts')
        .insert({ organization_id: org.id, name, phone: optionalText(form, 'phone', 40), comuna: optionalText(form, 'comuna', 80) })
        .select('id').single()
      if (error) throw error
      contactId = data.id as string
    }

    const { data: conversation, error } = await db.from('conversations')
      // Parte en "Respondes tú": Momo responde solo únicamente si alguien activa "Momo atiende".
      .insert({ organization_id: org.id, contact_id: contactId, channel, ai_enabled: false, assigned_user_id: session.user.id })
      .select('id').single()
    if (error) throw error
    conversationId = conversation.id as string

    const { error: saleError } = await db.from('tickets').insert({
      organization_id: org.id, contact_id: contactId, conversation_id: conversationId, step: 'pregunta',
      title: optionalText(form, 'interest', 160), ai_handled: false,
    })
    if (saleError) throw saleError

    const message = text(form, 'message', 4000)
    if (message) {
      const { error: msgError } = await db.from('messages').insert({ organization_id: org.id, conversation_id: conversationId, author: 'client', body: message })
      if (msgError) throw msgError
      await autoReply(session, conversationId)
    }
    return ok()
  })
  if (!result.ok) return result
  refresh()
  revalidatePath('/clientes')
  redirect(`/conversaciones?c=${conversationId}`)
}

/** Registra un mensaje: lo que escribió el cliente, tu respuesta o la de Momo. */
export async function addMessage(_prev: ActionState, form: FormData): Promise<ActionState> {
  return attempt(async () => {
    const session = await requireRole(EDITORS)
    const conversationId = uuid(form, 'conversation_id')
    const author = text(form, 'author', 10)
    if (!['client', 'human', 'ai'].includes(author)) return fail('Elige quién escribió el mensaje.')
    const body = text(form, 'body', 4000)
    if (!body) return fail(author === 'client' ? 'Pega el mensaje del cliente.' : 'Escribe la respuesta.')
    await ensureConversation(session, conversationId)
    const { error } = await session.db.from('messages').insert({
      organization_id: session.org.id, conversation_id: conversationId, author, body,
      sent_by_user_id: author === 'client' ? null : session.user.id,
    })
    if (error) throw error
    if (author === 'client') await autoReply(session, conversationId)
    refresh()
    return ok(author === 'client' ? 'Mensaje del cliente agregado.' : 'Respuesta guardada.')
  })
}

export async function setAiEnabled(form: FormData) {
  const session = await requireRole(EDITORS)
  const id = uuid(form, 'conversation_id')
  const { error } = await session.db.from('conversations').update({ ai_enabled: checked(form, 'enabled') }).eq('organization_id', session.org.id).eq('id', id)
  if (error) throw error
  refresh()
}

export async function setArchived(_prev: ActionState, form: FormData): Promise<ActionState> {
  return attempt(async () => {
    const session = await requireRole(EDITORS)
    const id = uuid(form, 'conversation_id')
    const archived = checked(form, 'archived')
    const { error } = await session.db.from('conversations').update({ status: archived ? 'closed' : 'open' }).eq('organization_id', session.org.id).eq('id', id)
    if (error) throw error
    refresh()
    return ok(archived ? 'Conversación archivada.' : 'Conversación reabierta.')
  })
}

export async function markRead(conversationId: string) {
  const session = await requireRole(EDITORS).catch(() => null)
  if (!session || !/^[0-9a-f-]{36}$/i.test(conversationId)) return
  await session.db.from('conversations').update({ unread_count: 0 }).eq('organization_id', session.org.id).eq('id', conversationId).gt('unread_count', 0)
}

export async function deleteConversation(_prev: ActionState, form: FormData): Promise<ActionState> {
  const result = await attempt(async () => {
    const session = await requireRole(MANAGERS)
    const id = uuid(form, 'conversation_id')
    await session.db.from('tickets').delete().eq('organization_id', session.org.id).eq('conversation_id', id)
    const { error } = await session.db.from('conversations').delete().eq('organization_id', session.org.id).eq('id', id)
    if (error) throw error
    return ok()
  })
  if (!result.ok) return result
  refresh()
  redirect('/conversaciones')
}

// ---------------------------------------------------------------------------
// Esta venta
// ---------------------------------------------------------------------------

export async function updateSale(_prev: ActionState, form: FormData): Promise<ActionState> {
  return attempt(async () => {
    const session = await requireRole(EDITORS)
    const id = uuid(form, 'sale_id')
    const { error } = await session.db.from('tickets').update({
      product_id: optionalUuid(form, 'product_id'),
      title: optionalText(form, 'title', 160),
      value_clp: money(form, 'value_clp'),
      delivery_clp: money(form, 'delivery_clp'),
      notes: optionalText(form, 'notes', 2000),
    }).eq('organization_id', session.org.id).eq('id', id)
    if (error) throw error
    refresh()
    revalidatePath('/resultados')
    return ok('Venta guardada.')
  })
}

/** Pagado y despachado cuentan como venta ganada; volver atrás la reabre. */
export async function setStep(form: FormData) {
  const session = await requireRole(EDITORS)
  const id = uuid(form, 'sale_id')
  const step = text(form, 'step', 20)
  if (!isStep(step)) throw new UserError('Paso no válido')
  const won = WON_STEPS.includes(step)
  const { data: current } = await session.db.from('tickets').select('closed_at, status').eq('organization_id', session.org.id).eq('id', id).maybeSingle()
  const { error } = await session.db.from('tickets').update({
    step,
    status: won ? 'won' : 'open',
    closed_at: won ? (current?.status === 'won' && current.closed_at ? current.closed_at : new Date().toISOString()) : null,
    lost_reason: null,
  }).eq('organization_id', session.org.id).eq('id', id)
  if (error) throw error
  refresh()
  revalidatePath('/resultados')
}

export async function markLost(_prev: ActionState, form: FormData): Promise<ActionState> {
  return attempt(async () => {
    const session = await requireRole(EDITORS)
    const id = uuid(form, 'sale_id')
    const { error } = await session.db.from('tickets').update({
      status: 'lost', closed_at: new Date().toISOString(), lost_reason: optionalText(form, 'reason', 300),
    }).eq('organization_id', session.org.id).eq('id', id)
    if (error) throw error
    refresh()
    revalidatePath('/resultados')
    return ok('Venta marcada como perdida.')
  })
}

export async function reopenSale(form: FormData) {
  const session = await requireRole(EDITORS)
  const id = uuid(form, 'sale_id')
  const { data } = await session.db.from('tickets').select('step').eq('organization_id', session.org.id).eq('id', id).maybeSingle()
  const won = data && WON_STEPS.includes(data.step)
  const { error } = await session.db.from('tickets').update({
    status: won ? 'won' : 'open', lost_reason: null, closed_at: won ? new Date().toISOString() : null,
  }).eq('organization_id', session.org.id).eq('id', id)
  if (error) throw error
  refresh()
  revalidatePath('/resultados')
}

/** Cocinas a medida y proyectos fuera de catálogo: pasan al Área de Diseño y Momo deja de responder. */
export async function setDesign(form: FormData) {
  const session = await requireRole(EDITORS)
  const saleId = uuid(form, 'sale_id')
  const conversationId = uuid(form, 'conversation_id')
  const design = checked(form, 'design')
  const { error } = await session.db.from('tickets').update({ design }).eq('organization_id', session.org.id).eq('id', saleId)
  if (error) throw error
  if (design) {
    await session.db.from('conversations').update({ ai_enabled: false }).eq('organization_id', session.org.id).eq('id', conversationId)
  }
  refresh()
}

export interface ProductOption {
  id: string
  name: string
  category: string | null
  price: number
  dimensions: string | null
}

/** Buscador de productos para "Esta venta" (máximo 8 resultados). */
export async function searchProducts(query: string): Promise<ProductOption[]> {
  const session = await requireRole(EDITORS)
  const term = searchTerm(query)
  if (term.length < 2) return []
  const { data, error } = await session.db.from('products')
    .select('id, name, category, price_clp, sale_price_clp, dimensions')
    .eq('organization_id', session.org.id).eq('active', true)
    .ilike('name', `%${term}%`).order('name').limit(8)
  if (error) throw error
  return (data ?? []).map((p) => ({ id: p.id, name: p.name, category: p.category, price: p.sale_price_clp ?? p.price_clp, dimensions: p.dimensions }))
}

export interface ContactOption {
  id: string
  name: string
  phone: string | null
}

/** Buscador de clientes existentes al registrar una conversación. */
export async function searchContacts(query: string): Promise<ContactOption[]> {
  const session = await requireRole(EDITORS)
  const term = searchTerm(query)
  if (term.length < 2) return []
  const { data, error } = await session.db.from('contacts').select('id, name, phone')
    .eq('organization_id', session.org.id).or(`name.ilike.%${term}%,phone.ilike.%${term}%`).order('name').limit(6)
  if (error) throw error
  return data ?? []
}
