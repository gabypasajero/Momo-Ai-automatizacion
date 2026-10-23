import 'server-only'
import type { Channel } from '@/config/sales'
import type { Session } from '@/lib/session'

export const PERIODS = [7, 30, 90] as const
export type Period = (typeof PERIODS)[number]

const DAY = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santiago' }) // AAAA-MM-DD

export interface Results {
  sold: number
  salesCount: number
  average: number
  lost: number
  lostReasons: { reason: string; count: number }[]
  newConversations: number
  conversion: number | null
  momoShare: number | null
  momoReplies: number
  byChannel: { channel: Channel; count: number }[]
  byDay: { day: string; total: number }[]
  topProducts: { name: string; count: number; total: number }[]
  aiCostUsd: number | null
}

export async function getResults(session: Session, days: Period, withCost: boolean): Promise<Results> {
  const { db, org } = session
  const since = new Date(Date.now() - days * 86_400_000).toISOString()
  const [won, lost, created, conversations, replies, cost] = await Promise.all([
    db.from('tickets').select('title, value_clp, delivery_clp, closed_at').eq('organization_id', org.id).eq('status', 'won').gte('closed_at', since).limit(5000),
    db.from('tickets').select('lost_reason').eq('organization_id', org.id).eq('status', 'lost').gte('closed_at', since).limit(5000),
    db.from('tickets').select('id', { count: 'exact', head: true }).eq('organization_id', org.id).gte('created_at', since),
    db.from('conversations').select('channel').eq('organization_id', org.id).gte('created_at', since).limit(10000),
    db.from('messages').select('author').eq('organization_id', org.id).in('author', ['ai', 'human']).gte('sent_at', since).limit(20000),
    withCost ? db.from('ai_usage').select('cost_usd').eq('organization_id', org.id).gte('created_at', since).limit(20000) : Promise.resolve({ data: null, error: null }),
  ])
  for (const r of [won, lost, created, conversations, replies, cost]) if (r.error) throw r.error

  const wonRows = won.data ?? []
  const sold = wonRows.reduce((s, t) => s + t.value_clp + t.delivery_clp, 0)

  const days_: { day: string; total: number }[] = []
  const totals = new Map<string, number>()
  for (const t of wonRows) {
    const key = DAY.format(new Date(t.closed_at as string))
    totals.set(key, (totals.get(key) ?? 0) + t.value_clp + t.delivery_clp)
  }
  for (let i = days - 1; i >= 0; i--) {
    const key = DAY.format(new Date(Date.now() - i * 86_400_000))
    days_.push({ day: key, total: totals.get(key) ?? 0 })
  }

  const products = new Map<string, { count: number; total: number }>()
  for (const t of wonRows) {
    const name = (t.title as string | null)?.trim() || 'Sin producto'
    const p = products.get(name) ?? { count: 0, total: 0 }
    products.set(name, { count: p.count + 1, total: p.total + t.value_clp + t.delivery_clp })
  }

  const reasons = new Map<string, number>()
  for (const t of lost.data ?? []) {
    const reason = (t.lost_reason as string | null)?.trim() || 'Sin motivo anotado'
    reasons.set(reason, (reasons.get(reason) ?? 0) + 1)
  }

  const channels = new Map<Channel, number>()
  for (const c of conversations.data ?? []) channels.set(c.channel as Channel, (channels.get(c.channel as Channel) ?? 0) + 1)

  const ai = (replies.data ?? []).filter((m) => m.author === 'ai').length
  const totalReplies = replies.data?.length ?? 0
  const createdCount = created.count ?? 0

  return {
    sold,
    salesCount: wonRows.length,
    average: wonRows.length ? sold / wonRows.length : 0,
    lost: lost.data?.length ?? 0,
    lostReasons: [...reasons.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([reason, count]) => ({ reason, count })),
    newConversations: conversations.data?.length ?? 0,
    conversion: createdCount > 0 ? (wonRows.length / createdCount) * 100 : null,
    momoShare: totalReplies > 0 ? (ai / totalReplies) * 100 : null,
    momoReplies: ai,
    byChannel: [...channels.entries()].sort((a, b) => b[1] - a[1]).map(([channel, count]) => ({ channel, count })),
    byDay: days_,
    topProducts: [...products.entries()].sort((a, b) => b[1].total - a[1].total).slice(0, 6).map(([name, v]) => ({ name, ...v })),
    aiCostUsd: withCost ? (cost.data ?? []).reduce((s, r) => s + Number(r.cost_usd), 0) : null,
  }
}
