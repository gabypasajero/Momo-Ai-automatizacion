import 'server-only'
import type { Session } from '@/lib/session'

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString()

export interface DaySummary {
  conversations: number
  momoReplies: number
  sales: number
  salesTotal: number
}

/** Lo que pasó en las últimas 24 horas (para la frase de Momo). */
export async function lastDay(session: Session): Promise<DaySummary> {
  const { db, org } = session
  const since = daysAgo(1)
  const [conversations, momo, won] = await Promise.all([
    db.from('conversations').select('id', { count: 'exact', head: true }).eq('organization_id', org.id).gte('last_message_at', since),
    db.from('messages').select('id', { count: 'exact', head: true }).eq('organization_id', org.id).eq('author', 'ai').gte('sent_at', since),
    db.from('tickets').select('value_clp, delivery_clp').eq('organization_id', org.id).eq('status', 'won').gte('closed_at', since),
  ])
  for (const r of [conversations, momo, won]) if (r.error) throw r.error
  return {
    conversations: conversations.count ?? 0,
    momoReplies: momo.count ?? 0,
    sales: won.data?.length ?? 0,
    salesTotal: (won.data ?? []).reduce((s, t) => s + t.value_clp + t.delivery_clp, 0),
  }
}

export interface WeekSummary {
  sold: number
  inProgress: number
  momoShare: number | null
  top: { name: string; count: number }[]
}

export async function week(session: Session): Promise<WeekSummary> {
  const { db, org } = session
  const [won, open, replies, interests] = await Promise.all([
    db.from('tickets').select('value_clp, delivery_clp').eq('organization_id', org.id).eq('status', 'won').gte('closed_at', daysAgo(7)),
    db.from('tickets').select('id', { count: 'exact', head: true }).eq('organization_id', org.id).eq('status', 'open').neq('step', 'pregunta'),
    db.from('messages').select('author').eq('organization_id', org.id).in('author', ['ai', 'human']).gte('sent_at', daysAgo(7)).limit(5000),
    db.from('tickets').select('title').eq('organization_id', org.id).not('title', 'is', null).gte('created_at', daysAgo(30)).limit(2000),
  ])
  for (const r of [won, open, replies, interests]) if (r.error) throw r.error

  const ai = (replies.data ?? []).filter((m) => m.author === 'ai').length
  const total = replies.data?.length ?? 0
  const counts = new Map<string, number>()
  for (const t of interests.data ?? []) {
    const key = String(t.title).trim()
    if (key) counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return {
    sold: (won.data ?? []).reduce((s, t) => s + t.value_clp + t.delivery_clp, 0),
    inProgress: open.count ?? 0,
    momoShare: total > 0 ? (ai / total) * 100 : null,
    top: [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([name, count]) => ({ name, count })),
  }
}

export interface Gap {
  id: string
  question: string
  conversation_id: string | null
  created_at: string
}

/** La duda más antigua que Momo no supo responder (y que no se dejó para más tarde). */
export async function nextGap(session: Session) {
  const { db, org } = session
  const now = new Date().toISOString()
  const [first, pending] = await Promise.all([
    db.from('knowledge_gaps').select('id, question, conversation_id, created_at').eq('organization_id', org.id).eq('status', 'pendiente')
      .or(`snoozed_until.is.null,snoozed_until.lt."${now}"`).order('created_at').limit(1).maybeSingle(),
    db.from('knowledge_gaps').select('id', { count: 'exact', head: true }).eq('organization_id', org.id).eq('status', 'pendiente'),
  ])
  if (first.error) throw first.error
  return { gap: (first.data as Gap | null) ?? null, pending: pending.count ?? 0 }
}
