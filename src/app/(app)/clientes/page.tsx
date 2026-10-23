import { Download, Plus } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ActionForm, Avatar, ButtonLink, buttonClass, CancelButton, EmptyState, Modal, PageTitle, SearchForm, SubmitButton, Tabs } from '@/components/ui'
import { CHANNELS } from '@/config/sales'
import { createContact } from '@/features/clientes/actions'
import { ContactFields } from '@/features/clientes/ContactForm'
import { PAGE_SIZE, listContacts, type ClientFilter } from '@/features/clientes/queries'
import { cn } from '@/lib/cn'
import { formatClp, formatNumber, timeAgo } from '@/lib/format'
import { canEdit, getSession } from '@/lib/session'

export const metadata: Metadata = { title: 'Clientes' }

export default async function ClientesPage({ searchParams }: { searchParams: Promise<{ q?: string; f?: string; p?: string }> }) {
  const params = await searchParams
  const session = await getSession()
  const filter: ClientFilter = params.f === 'compraron' ? 'compraron' : 'todos'
  const page = Math.max(1, Number(params.p) || 1)
  const q = params.q?.trim() || undefined
  const { rows, total } = await listContacts(session, { q, filter, page })
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const href = (extra: Record<string, string | undefined>) => {
    const sp = new URLSearchParams()
    for (const [k, v] of Object.entries({ q, f: filter === 'todos' ? undefined : filter, ...extra })) if (v) sp.set(k, v)
    const s = sp.toString()
    return s ? `/clientes?${s}` : '/clientes'
  }

  return (
    <div className="space-y-5">
      <PageTitle title="Clientes" description={`${formatNumber(total)} ${total === 1 ? 'cliente' : 'clientes'} de todos tus canales`}
        actions={<>
          <a href="/clientes/exportar" download className={buttonClass('secondary')}><Download className="h-4 w-4" aria-hidden />Exportar a Excel</a>
          {canEdit(session.role) && (
            <Modal trigger={<><Plus className="h-4 w-4" aria-hidden />Nuevo cliente</>} triggerVariant="primary" title="Nuevo cliente" size="lg">
              <ActionForm action={createContact} className="space-y-4">
                <ContactFields />
                <div className="flex justify-end gap-2"><CancelButton /><SubmitButton>Guardar cliente</SubmitButton></div>
              </ActionForm>
            </Modal>
          )}
        </>} />

      <div className="flex flex-wrap items-center gap-3">
        <Tabs label="Filtrar clientes" active={filter} items={[
          { id: 'todos', label: 'Todos', href: href({ f: undefined, p: undefined }) },
          { id: 'compraron', label: 'Compraron', href: href({ f: 'compraron', p: undefined }) },
        ]} />
        <SearchForm action="/clientes" defaultValue={q} placeholder="Buscar por nombre, teléfono, correo o comuna" keep={{ f: filter === 'todos' ? undefined : filter }} className="min-w-0 flex-[1_1_320px]" />
      </div>

      {rows.length === 0 ? (
        <EmptyState title={q ? 'Sin resultados' : 'Aún no hay clientes'}
          description={q ? `No encontramos clientes con "${q}".` : 'Los clientes se crean solos al registrar una conversación, o puedes agregarlos con "Nuevo cliente".'} />
      ) : (
        <div className="overflow-hidden rounded-3xl border border-line bg-white">
          <ul className="divide-y divide-line">
            {rows.map((c) => (
              <li key={c.id}>
                <Link href={`/clientes/${c.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4 transition hover:bg-brand-50/60">
                  <Avatar name={c.name} />
                  <span className="min-w-0 flex-[1_1_200px]">
                    <span className="block truncate font-extrabold">{c.name}</span>
                    <span className="block truncate text-sm text-muted">{[c.phone, c.comuna].filter(Boolean).join(' · ') || 'Sin datos de contacto'}</span>
                  </span>
                  <span className="flex flex-wrap items-center gap-2 text-sm">
                    {c.lastChannel && <span className="inline-flex items-center gap-1 text-muted"><span className={cn('h-2 w-2 rounded-full', CHANNELS[c.lastChannel].dot)} aria-hidden />{CHANNELS[c.lastChannel].label}</span>}
                    {c.tags.map((t) => <span key={t} className="rounded-full bg-surface px-2 py-0.5 text-xs font-bold text-muted ring-1 ring-line">{t}</span>)}
                  </span>
                  <span className="ml-auto text-right text-sm">
                    <span className="block font-extrabold">{c.purchases > 0 ? formatClp(c.spent) : 'Sin compras'}</span>
                    <span className="block text-muted">{c.purchases > 0 ? `${c.purchases} ${c.purchases === 1 ? 'compra' : 'compras'}` : c.lastActivity ? timeAgo(c.lastActivity) : 'Nuevo'}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {pages > 1 && (
        <nav aria-label="Páginas" className="flex items-center justify-center gap-2">
          {page > 1 && <ButtonLink href={href({ p: String(page - 1) })} variant="secondary" size="sm">Anterior</ButtonLink>}
          <span className="text-sm font-bold text-muted">Página {page} de {pages}</span>
          {page < pages && <ButtonLink href={href({ p: String(page + 1) })} variant="secondary" size="sm">Siguiente</ButtonLink>}
        </nav>
      )}
    </div>
  )
}
