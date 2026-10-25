import 'server-only'
import { searchTerm } from '@/lib/actions'
import type { Session } from '@/lib/session'
import type { GapView } from './GapCard'

export const PRODUCTS_PAGE = 30

export interface Policy {
  id: string
  title: string
  content: string
  updated_at: string
}

export async function listPolicies(session: Session, q?: string) {
  const { db, org } = session
  let query = db.from('knowledge_entries').select('id, title, content, updated_at').eq('organization_id', org.id)
  const term = searchTerm(q)
  if (term) query = query.or(`title.ilike.%${term}%,content.ilike.%${term}%`)
  const { data, error } = await query.order('title').limit(300)
  if (error) throw error
  return (data ?? []) as Policy[]
}

export interface ProductRow {
  id: string
  name: string
  category: string | null
  price_clp: number
  sale_price_clp: number | null
  dimensions: string | null
  description: string | null
  customizable: boolean
  active: boolean
  source: string
  source_url: string | null
}

export async function listProducts(session: Session, { q, page, inactive }: { q?: string; page: number; inactive: boolean }) {
  const { db, org } = session
  let query = db.from('products')
    .select('id, name, category, price_clp, sale_price_clp, dimensions, description, customizable, active, source, source_url', { count: 'exact' })
    .eq('organization_id', org.id).eq('active', !inactive)
  const term = searchTerm(q)
  if (term) query = query.or(`name.ilike.%${term}%,category.ilike.%${term}%,description.ilike.%${term}%`)
  const from = (page - 1) * PRODUCTS_PAGE
  const { data, error, count } = await query.order('category', { nullsFirst: false }).order('name').range(from, from + PRODUCTS_PAGE - 1)
  if (error) throw error
  return { rows: (data ?? []) as ProductRow[], total: count ?? 0 }
}

export async function listGaps(session: Session) {
  const { db, org } = session
  const { data, error } = await db.from('knowledge_gaps').select('id, question, conversation_id, created_at, status')
    .eq('organization_id', org.id).eq('status', 'pendiente').order('created_at').limit(200)
  if (error) throw error
  return (data ?? []) as GapView[]
}

export async function getAssistant(session: Session) {
  const { db, org } = session
  const { data, error } = await db.from('ai_assistants').select('id, name, system_prompt, model, updated_at')
    .eq('organization_id', org.id).eq('active', true).order('created_at').limit(1).maybeSingle()
  if (error) throw error
  return data as { id: string; name: string; system_prompt: string; model: string; updated_at: string } | null
}

export async function knowledgeCounts(session: Session) {
  const { db, org } = session
  const [policies, products, gaps, memory] = await Promise.all([
    db.from('knowledge_entries').select('id', { count: 'exact', head: true }).eq('organization_id', org.id),
    db.from('products').select('id', { count: 'exact', head: true }).eq('organization_id', org.id).eq('active', true),
    db.from('knowledge_gaps').select('id', { count: 'exact', head: true }).eq('organization_id', org.id).eq('status', 'pendiente'),
    db.from('momo_memory').select('id', { count: 'exact', head: true }).eq('organization_id', org.id),
  ])
  return { politicas: policies.count ?? 0, productos: products.count ?? 0, dudas: gaps.count ?? 0, memoria: memory.count ?? 0 }
}

export interface MemoryRow { id: string; kind: 'aprobada' | 'corregida'; question: string; answer: string; source: string; created_at: string }

/** Memoria de Momo: respuestas aprobadas o corregidas por el equipo (las más nuevas primero). */
export async function listMemory(session: Session) {
  const { db, org } = session
  const { data, error } = await db.from('momo_memory').select('id, kind, question, answer, source, created_at')
    .eq('organization_id', org.id).order('created_at', { ascending: false }).limit(100)
  if (error) throw error
  return (data ?? []) as MemoryRow[]
}

export interface TrainingSessionRow { id: string; turns: number; updated_at: string; messages: { author: string; body: string }[] }

export async function listTrainingSessions(session: Session) {
  const { db, org } = session
  const { data, error } = await db.from('training_sessions').select('id, turns, updated_at, messages')
    .eq('organization_id', org.id).order('updated_at', { ascending: false }).limit(15)
  if (error) throw error
  return (data ?? []) as TrainingSessionRow[]
}
