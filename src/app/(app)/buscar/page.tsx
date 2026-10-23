import { Package, ScrollText } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Avatar, Card, CardTitle, EmptyState, PageTitle, SearchForm } from '@/components/ui'
import { searchTerm } from '@/lib/actions'
import { formatClp } from '@/lib/format'
import { getSession } from '@/lib/session'

export const metadata: Metadata = { title: 'Buscar' }

/** Búsqueda general desde "Hoy": clientes, productos y políticas. */
export default async function BuscarPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams
  const session = await getSession()
  const term = searchTerm(q)
  const { db, org } = session

  const [contacts, products, policies, sales] = term.length >= 2 ? await Promise.all([
    db.from('contacts').select('id, name, phone, comuna').eq('organization_id', org.id).or(`name.ilike.%${term}%,phone.ilike.%${term}%,email.ilike.%${term}%`).limit(8),
    db.from('products').select('id, name, category, price_clp, sale_price_clp').eq('organization_id', org.id).eq('active', true).or(`name.ilike.%${term}%,category.ilike.%${term}%`).limit(8),
    db.from('knowledge_entries').select('id, title, content').eq('organization_id', org.id).or(`title.ilike.%${term}%,content.ilike.%${term}%`).limit(6),
    db.from('tickets').select('id, title, conversation_id, value_clp, contact:contacts(name)').eq('organization_id', org.id).ilike('title', `%${term}%`).not('conversation_id', 'is', null).limit(8),
  ]) : [null, null, null, null]
  const total = (contacts?.data?.length ?? 0) + (products?.data?.length ?? 0) + (policies?.data?.length ?? 0) + (sales?.data?.length ?? 0)

  return (
    <div className="space-y-5">
      <PageTitle title="Buscar" description={term ? `Resultados para "${term}"` : 'Clientes, pedidos, productos y políticas'} />
      <SearchForm action="/buscar" defaultValue={q} placeholder="Busca un cliente, producto o pedido" />
      {term.length < 2 ? (
        <EmptyState title="¿Qué buscas?" description="Escribe al menos 2 letras: un nombre, un teléfono, un producto o una palabra de tus políticas." />
      ) : total === 0 ? (
        <EmptyState title="Sin resultados" description={`No encontramos nada con "${term}".`} />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {!!contacts?.data?.length && (
            <Card className="space-y-2 p-5"><CardTitle>Clientes</CardTitle>
              <ul className="divide-y divide-line">{contacts.data.map((c) => (
                <li key={c.id}><Link href={`/clientes/${c.id}`} className="flex items-center gap-3 py-2.5 hover:bg-brand-50/50">
                  <Avatar name={c.name} size="sm" /><span className="min-w-0"><span className="block font-bold">{c.name}</span><span className="block text-sm text-muted">{[c.phone, c.comuna].filter(Boolean).join(' · ')}</span></span>
                </Link></li>))}</ul>
            </Card>
          )}
          {!!sales?.data?.length && (
            <Card className="space-y-2 p-5"><CardTitle>Pedidos</CardTitle>
              <ul className="divide-y divide-line">{sales.data.map((s) => (
                <li key={s.id}><Link href={`/conversaciones?c=${s.conversation_id}`} className="flex items-center justify-between gap-3 py-2.5 hover:bg-brand-50/50">
                  <span className="min-w-0"><span className="block truncate font-bold">{s.title}</span><span className="block text-sm text-muted">{(s.contact as unknown as { name: string } | null)?.name}</span></span>
                  <span className="font-bold">{formatClp(s.value_clp)}</span>
                </Link></li>))}</ul>
            </Card>
          )}
          {!!products?.data?.length && (
            <Card className="space-y-2 p-5"><CardTitle>Productos</CardTitle>
              <ul className="divide-y divide-line">{products.data.map((p) => (
                <li key={p.id}><Link href={`/conocimiento?t=productos&q=${encodeURIComponent(p.name)}`} className="flex items-center gap-3 py-2.5 hover:bg-brand-50/50">
                  <Package className="h-4 w-4 shrink-0 text-muted" aria-hidden /><span className="min-w-0 flex-1 truncate font-semibold">{p.name}</span>
                  <span className="font-bold">{formatClp(p.sale_price_clp ?? p.price_clp)}</span>
                </Link></li>))}</ul>
            </Card>
          )}
          {!!policies?.data?.length && (
            <Card className="space-y-2 p-5"><CardTitle>Políticas</CardTitle>
              <ul className="divide-y divide-line">{policies.data.map((p) => (
                <li key={p.id}><Link href={`/conocimiento?q=${encodeURIComponent(p.title)}`} className="flex gap-3 py-2.5 hover:bg-brand-50/50">
                  <ScrollText className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden /><span className="min-w-0"><span className="block font-bold">{p.title}</span><span className="line-clamp-2 text-sm text-muted">{p.content}</span></span>
                </Link></li>))}</ul>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
