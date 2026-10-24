import { PLANS, findPlan, type PlanId } from '@/config/plans'
import type { CompanyRow } from './queries'

/** Tipo de cambio usado para mostrar en pesos el costo de IA (se cobra en dólares). */
export const USD_CLP = 950

export interface CompanyMoney {
  company: CompanyRow
  income: number
  aiCost: number
  profit: number
  margin: number | null
}

/** Cuentas del negocio: lo que entra por planes, lo que cuesta la IA y lo que queda. */
export function businessNumbers(companies: CompanyRow[]) {
  const active = companies.filter((c) => c.status === 'activa')
  const rows: CompanyMoney[] = companies.map((c) => {
    const income = c.status === 'activa' ? findPlan(c.plan).priceClp ?? 0 : 0
    const aiCost = c.ai_cost_usd_30d * USD_CLP
    return { company: c, income, aiCost, profit: income - aiCost, margin: income > 0 ? ((income - aiCost) / income) * 100 : null }
  })
  const income = rows.reduce((s, r) => s + r.income, 0)
  const aiCost = rows.reduce((s, r) => s + r.aiCost, 0)
  const profit = income - aiCost
  const byPlan = PLANS.map((p) => {
    const list = active.filter((c) => c.plan === p.id)
    return { id: p.id as PlanId, name: p.name, count: list.length, income: list.length * (p.priceClp ?? 0), price: p.priceClp }
  })
  return {
    rows,
    active: active.length,
    suspended: companies.length - active.length,
    income,
    aiCost,
    profit,
    margin: income > 0 ? (profit / income) * 100 : null,
    yearly: income * 12,
    perCompany: active.length ? income / active.length : 0,
    byPlan,
    conversations: companies.reduce((s, c) => s + c.conversations_30d, 0),
    messages: companies.reduce((s, c) => s + c.messages_30d, 0),
    aiMessages: companies.reduce((s, c) => s + c.ai_messages_30d, 0),
    clientSales: companies.reduce((s, c) => s + c.revenue_won_30d, 0),
    clientSalesCount: companies.reduce((s, c) => s + c.tickets_won_30d, 0),
    people: companies.reduce((s, c) => s + c.members, 0),
    pending: companies.reduce((s, c) => s + c.pending_requests, 0),
  }
}

/** Empresas nuevas por mes (últimos 6 meses), para ver el crecimiento. */
export function growthByMonth(companies: CompanyRow[], months = 6, now = new Date()) {
  const fmt = new Intl.DateTimeFormat('es-CL', { month: 'short' })
  return Array.from({ length: months }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1)
    const next = new Date(d.getFullYear(), d.getMonth() + 1, 1)
    const created = companies.filter((c) => { const t = new Date(c.created_at); return t >= d && t < next }).length
    const total = companies.filter((c) => new Date(c.created_at) < next).length
    return { label: fmt.format(d).replace('.', ''), created, total }
  })
}
