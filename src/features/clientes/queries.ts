import 'server-only'
import type { Channel, SaleStatus, Step } from '@/config/sales'
import { searchTerm } from '@/lib/actions'
import type { Session } from '@/lib/session'

export const PAGE_SIZE = 40

export interface ContactRow {
  id: string
  name: string
  phone: string | null
  email: string | null
  comuna: string | null
  tags: string[]
  created_at: string
  purchases: number
  spent: number
  lastChannel: Channel | null
  lastActivity: string | null
}

type Raw = Omit<ContactRow, 'purchases' | 'spent' | 'lastChannel' | 'lastActivity'> & {
  tickets: { status: SaleStatus; value_clp: number; delivery_clp: number }[]
  conversations: { channel: Channel; last_message_at: string | null }[]
}

function toRow(raw: Raw): ContactRow {
  const won = raw.tickets.filter((t) => t.status === 'won')
  const last = [...raw.conversations].sort((a, b) => (b.last_message_at ?? '').localeCompare(a.last_message_at ?? ''))[0]
  return {
    id: raw.id, name: raw.name, phone: raw.phone, email: raw.email, comuna: raw.comuna, tags: raw.tags ?? [], created_at: raw.created_at,
    purchases: won.length,
    spent: won.reduce((s, t) => s + t.value_clp + t.delivery_clp, 0),
    lastChannel: last?.channel ?? null,
    lastActivity: last?.last_message_at ?? null,
  }
}

export type ClientFilter = 'todos' | 'compraron'

export async function listContacts(session: Session, { q, filter, page }: { q?: string; filter: ClientFilter; page: number }) {
  const { db, org } = session
  const tickets = filter === 'compraron' ? 'tickets!inner(status, value_clp, delivery_clp)' : 'tickets(status, value_clp, delivery_clp)'
  let query = db.from('contacts')
    .select(`id, name, phone, email, comuna, tags, created_at, ${tickets}, conversations(channel, last_message_at)`, { count: 'exact' })
    .eq('organization_id', org.id)
  if (filter === 'compraron') query = query.eq('tickets.status', 'won')
  const term = searchTerm(q)
  if (term) query = query.or(`name.ilike.%${term}%,phone.ilike.%${term}%,email.ilike.%${term}%,comuna.ilike.%${term}%`)
  const from = (page - 1) * PAGE_SIZE
  const { data, error, count } = await query.order('created_at', { ascending: false }).range(from, from + PAGE_SIZE - 1)
  if (error) throw error
  return { rows: (data as unknown as Raw[]).map(toRow), total: count ?? 0 }
}

export interface ContactDetail extends ContactRow {
  notes: string | null
  conversations: { id: string; channel: Channel; status: 'open' | 'closed'; last_message_at: string | null; last_message_preview: string | null }[]
  sales: { id: string; conversation_id: string | null; title: string | null; step: Step; status: SaleStatus; design: boolean; value_clp: number; delivery_clp: number; created_at: string; closed_at: string | null }[]
}

export async function getContact(session: Session, id: string): Promise<ContactDetail | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  const { db, org } = session
  const { data, error } = await db.from('contacts')
    .select('id, name, phone, email, comuna, tags, notes, created_at, tickets(id, conversation_id, title, step, status, design, value_clp, delivery_clp, created_at, closed_at), conversations(id, channel, status, last_message_at, last_message_preview)')
    .eq('organization_id', org.id).eq('id', id).maybeSingle()
  if (error) throw error
  if (!data) return null
  const raw = data as unknown as Raw & { notes: string | null; tickets: ContactDetail['sales']; conversations: ContactDetail['conversations'] }
  return {
    ...toRow(raw),
    notes: raw.notes,
    conversations: [...raw.conversations].sort((a, b) => (b.last_message_at ?? '').localeCompare(a.last_message_at ?? '')),
    sales: [...raw.tickets].sort((a, b) => b.created_at.localeCompare(a.created_at)),
  }
}
