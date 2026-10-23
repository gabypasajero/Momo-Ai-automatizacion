import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { EmptyState, PageTitle, SearchForm, Tabs } from '@/components/ui'
import { ConversationRow } from '@/features/conversaciones/ConversationList'
import { ConversationView } from '@/features/conversaciones/ConversationView'
import { NewConversation } from '@/features/conversaciones/NewConversation'
import { SalePanel } from '@/features/conversaciones/SalePanel'
import { FILTERS, countByFilter, getConversation, isFilter, listConversations, type Filter } from '@/features/conversaciones/queries'
import { cn } from '@/lib/cn'
import { isAiConfigured } from '@/lib/env'
import { canEdit, canManage, getSession } from '@/lib/session'

export const metadata: Metadata = { title: 'Conversaciones' }

type Search = { f?: string; q?: string; c?: string }

const EMPTY: Record<Filter, { title: string; description: string }> = {
  esperan: { title: 'Nadie te espera', description: 'Cuando un cliente escriba y le toque responder a una persona, aparecerá aquí.' },
  momo: { title: 'Momo no atiende chats ahora', description: 'Activa "Momo atiende" en una conversación para dejarla en manos de Momo.' },
  vendidas: { title: 'Aún no hay ventas cerradas', description: 'Marca una venta como pagada y aparecerá aquí.' },
  todas: { title: 'Aún no hay conversaciones', description: 'Registra la primera: pega lo que te escribió un cliente en Marketplace y Momo te ayuda a responder.' },
  archivadas: { title: 'No hay conversaciones archivadas', description: 'Archiva las conversaciones terminadas para mantener la bandeja limpia.' },
}

export default async function ConversacionesPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams
  const session = await getSession()
  const counts = await countByFilter(session)
  const filter: Filter = isFilter(params.f) ? params.f : counts.esperan > 0 ? 'esperan' : 'todas'
  const q = params.q?.trim() || undefined

  const [items, selected] = await Promise.all([
    listConversations(session, { filter, q }),
    params.c ? getConversation(session, params.c) : Promise.resolve(null),
  ])
  if (params.c && !selected) notFound()

  const editable = canEdit(session.role)
  const link = (extra: Record<string, string | undefined>) => {
    const sp = new URLSearchParams()
    const merged = { f: filter, q, ...extra }
    for (const [k, v] of Object.entries(merged)) if (v) sp.set(k, v)
    return `/conversaciones?${sp.toString()}`
  }

  return (
    <div className="space-y-5">
      {/* En celular, con un chat abierto, solo se ve el chat; el título queda para lectores de pantalla. */}
      {selected && <h1 className="sr-only lg:hidden">Conversación con {selected.contact.name}</h1>}
      <div className={cn(selected && 'hidden lg:block')}>
        <PageTitle title="Conversaciones" description="Cada chat con su venta al lado. Momo sugiere, tú decides."
          actions={editable && <NewConversation key={params.c ?? 'nueva'} />} />
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)_300px]">
        <section aria-label="Lista de conversaciones" className={cn('min-w-0 space-y-3', selected && 'hidden lg:block')}>
          <Tabs label="Filtrar conversaciones" active={filter}
            items={FILTERS.map((f) => ({ id: f.id, label: f.label, count: counts[f.id], href: link({ f: f.id, c: undefined }) }))} />
          <SearchForm action="/conversaciones" defaultValue={q} placeholder="Buscar por nombre del cliente" keep={{ f: filter }} />
          {items.length === 0 ? (
            <EmptyState title={q ? 'Sin resultados' : EMPTY[filter].title}
              description={q ? `No hay conversaciones de clientes que se llamen "${q}".` : EMPTY[filter].description} />
          ) : (
            <ul className="space-y-1">
              {items.map((item) => (
                <li key={item.id}><ConversationRow item={item} href={link({ c: item.id })} active={item.id === selected?.id} /></li>
              ))}
            </ul>
          )}
        </section>

        {selected ? (
          <>
            <ConversationView conversation={selected} backHref={link({ c: undefined })} aiReady={isAiConfigured()} editable={editable} />
            <div className="min-w-0 lg:col-start-2 xl:col-start-auto">
              <SalePanel conversation={selected} handoff={session.org.handoffContacts} editable={editable} canDelete={canManage(session.role)} />
            </div>
          </>
        ) : (
          <div className="hidden lg:block xl:col-span-2">
            <EmptyState title="Elige una conversación" description="Ábrela para ver los mensajes, pedirle una respuesta a Momo y avanzar la venta." />
          </div>
        )}
      </div>
    </div>
  )
}
