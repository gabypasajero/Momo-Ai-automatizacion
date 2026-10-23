import type { Metadata } from 'next'
import { KnowledgeView } from '@/features/knowledge/KnowledgeView'
import { getRepository } from '@/lib/data'

export const metadata: Metadata = { title: 'Conocimiento' }

export default async function ConocimientoPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = '' } = await searchParams
  const repo = await getRepository()
  const [entries, { items, total }] = await Promise.all([repo.getKnowledge(), repo.getProducts(q)])
  return <KnowledgeView entries={entries} products={items} totalProducts={total} query={q} />
}
