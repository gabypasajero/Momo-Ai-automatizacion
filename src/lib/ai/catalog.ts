import 'server-only'
import { formatClp } from '@/lib/format'
import type { Session } from '@/lib/session'

export interface CatalogHit {
  name: string
  category: string | null
  price_clp: number
  sale_price_clp: number | null
  dimensions: string | null
  description: string | null
  customizable: boolean
}

/** Búsqueda en el catálogo: primero texto completo en español, luego por nombre. */
export async function searchCatalog(session: Session, query: string, limit = 8) {
  const { db, org } = session
  const fields = 'name, category, price_clp, sale_price_clp, dimensions, description, customizable'
  const full = await db.from('products').select(fields).eq('organization_id', org.id).eq('active', true)
    .textSearch('search', query, { type: 'websearch', config: 'spanish' }).limit(limit)
  if (full.error) throw full.error
  if (full.data && full.data.length > 0) return full.data as CatalogHit[]
  const term = query.replace(/[%_,()\\]/g, ' ').trim().split(/\s+/)[0] ?? ''
  if (!term) return []
  const byName = await db.from('products').select(fields).eq('organization_id', org.id).eq('active', true).ilike('name', `%${term}%`).limit(limit)
  if (byName.error) throw byName.error
  return (byName.data ?? []) as CatalogHit[]
}

export function describeHits(query: string, hits: CatalogHit[]) {
  if (hits.length === 0) return `Sin resultados en el catálogo para "${query}".`
  return hits.map((p) => {
    const price = p.sale_price_clp ? `${formatClp(p.sale_price_clp)} (oferta, antes ${formatClp(p.price_clp)})` : formatClp(p.price_clp)
    const extra = [p.category, p.dimensions, p.customizable ? 'personalizable' : null].filter(Boolean).join(' · ')
    const desc = p.description ? ` — ${p.description.slice(0, 220)}` : ''
    return `- ${p.name}: ${price}${extra ? ` · ${extra}` : ''}${desc}`
  }).join('\n')
}
