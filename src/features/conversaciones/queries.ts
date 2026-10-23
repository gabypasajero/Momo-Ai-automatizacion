import 'server-only'
import type { Channel, SaleStatus, Step } from '@/config/sales'
import { searchTerm } from '@/lib/actions'
import type { Session } from '@/lib/session'

export const FILTERS = [
  { id: 'esperan', label: 'Te esperan' },
  { id: 'momo', label: 'Momo atiende' },
  { id: 'vendidas', label: 'Vendidas' },
  { id: 'todas', label: 'Todas' },
  { id: 'archivadas', label: 'Archivadas' },
] as const

export type Filter = (typeof FILTERS)[number]['id']
export const isFilter = (v: unknown): v is Filter => FILTERS.some((f) => f.id === v)

export interface SaleRow {
  id: string
  step: Step
  status: SaleStatus
  design: boolean
  title: string | null
  value_clp: number
  delivery_clp: number
  product_id: string | null
  notes: string | null
  lost_reason: string | null
  closed_at: string | null
}

export interface ConversationListItem {
  id: string
  channel: Channel
  ai_enabled: boolean
  status: 'open' | 'closed'
  unread_count: number
  last_message_at: string | null
  last_message_preview: string | null
  last_message_author: 'client' | 'ai' | 'human' | 'system' | null
  contact: { id: string; name: string; phone: string | null; comuna: string | null }
  sale: SaleRow | null
}

const SALE_FIELDS = 'id, step, status, design, title, value_clp, delivery_clp, product_id, notes, lost_reason, closed_at'
const LIST_FIELDS = `id, channel, ai_enabled, status, unread_count, last_message_at, last_message_preview, last_message_author,
  contact:contacts!inner(id, name, phone, comuna)`

type Row = Omit<ConversationListItem, 'sale'> & { tickets: SaleRow[] | SaleRow | null }

function toItem(row: Row): ConversationListItem {
  const { tickets, ...rest } = row
  const sale = Array.isArray(tickets) ? tickets[0] ?? null : tickets
  return { ...rest, sale }
}

// El builder de Supabase cambia de tipo con cada filtro: aquí basta con encadenar .eq().
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Query = any

/** "Te esperan": abiertas, atendidas por una persona y con el último mensaje del cliente. */
function applyFilter(query: Query, filter: Filter): Query {
  switch (filter) {
    case 'esperan': return query.eq('status', 'open').eq('ai_enabled', false).eq('last_message_author', 'client')
    case 'momo': return query.eq('status', 'open').eq('ai_enabled', true)
    case 'vendidas': return query.eq('tickets.status', 'won')
    case 'todas': return query.eq('status', 'open')
    case 'archivadas': return query.eq('status', 'closed')
  }
}

export async function listConversations(session: Session, { filter, q, limit = 60 }: { filter: Filter; q?: string; limit?: number }) {
  const { db, org } = session
  const sale = filter === 'vendidas' ? `tickets!inner(${SALE_FIELDS})` : `tickets(${SALE_FIELDS})`
  let query = db.from('conversations').select(`${LIST_FIELDS}, ${sale}`).eq('organization_id', org.id)
  query = applyFilter(query, filter)
  const term = searchTerm(q)
  if (term) query = query.ilike('contact.name', `%${term}%`)
  const { data, error } = await query.order('last_message_at', { ascending: false, nullsFirst: false }).limit(limit)
  if (error) throw error
  return (data as unknown as Row[]).map(toItem)
}

export async function countByFilter(session: Session) {
  const { db, org } = session
  const count = async (filter: Filter) => {
    const select = filter === 'vendidas' ? 'id, tickets!inner(status)' : 'id'
    const { count, error } = await applyFilter(db.from('conversations').select(select, { count: 'exact', head: true }).eq('organization_id', org.id), filter)
    if (error) throw error
    return count ?? 0
  }
  const [esperan, momo, vendidas, todas, archivadas] = await Promise.all(FILTERS.map((f) => count(f.id)))
  return { esperan, momo, vendidas, todas, archivadas } as Record<Filter, number>
}

export async function countWaiting(session: Session) {
  const { count, error } = await applyFilter(
    session.db.from('conversations').select('id', { count: 'exact', head: true }).eq('organization_id', session.org.id),
    'esperan',
  )
  if (error) throw error
  return count ?? 0
}

export interface MessageRow {
  id: string
  author: 'client' | 'ai' | 'human' | 'system'
  body: string | null
  sent_at: string
}

export interface ConversationDetail extends ConversationListItem {
  created_at: string
  contact: ConversationListItem['contact'] & { email: string | null; notes: string | null }
  messages: MessageRow[]
  product: { id: string; name: string; price_clp: number; sale_price_clp: number | null } | null
}

export async function getConversation(session: Session, id: string): Promise<ConversationDetail | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  const { db, org } = session
  const { data, error } = await db
    .from('conversations')
    .select(`id, channel, ai_enabled, status, unread_count, last_message_at, last_message_preview, last_message_author, created_at,
      contact:contacts(id, name, phone, comuna, email, notes), tickets(${SALE_FIELDS})`)
    .eq('organization_id', org.id)
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  if (!data) return null

  const item = toItem(data as unknown as Row) as ConversationDetail
  const [messages, product] = await Promise.all([
    db.from('messages').select('id, author, body, sent_at').eq('conversation_id', id).order('sent_at').limit(300),
    item.sale?.product_id
      ? db.from('products').select('id, name, price_clp, sale_price_clp').eq('id', item.sale.product_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ])
  if (messages.error) throw messages.error
  return { ...item, created_at: (data as { created_at: string }).created_at, messages: messages.data ?? [], product: product.data ?? null }
}
