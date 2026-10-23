import { ArrowLeft, Mail, MessageCircle, Phone, Trash2 } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ActionForm, Avatar, Badge, Card, CardTitle, ConfirmAction, SubmitButton } from '@/components/ui'
import { CHANNELS, saleLabel } from '@/config/sales'
import { deleteContact, updateContact } from '@/features/clientes/actions'
import { ContactFields } from '@/features/clientes/ContactForm'
import { getContact } from '@/features/clientes/queries'
import { NewConversation } from '@/features/conversaciones/NewConversation'
import { cn } from '@/lib/cn'
import { formatClp, formatShortDate, phoneDigits, timeAgo } from '@/lib/format'
import { canEdit, canManage, getSession } from '@/lib/session'

export const metadata: Metadata = { title: 'Cliente' }

export default async function ClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  const contact = await getContact(session, id)
  if (!contact) notFound()
  const editable = canEdit(session.role)

  return (
    <div className="space-y-5">
      <Link href="/clientes" className="inline-flex min-h-10 items-center gap-2 font-bold text-brand-700 hover:underline"><ArrowLeft className="h-4 w-4" aria-hidden />Clientes</Link>
      <header className="flex flex-wrap items-center gap-4">
        <Avatar name={contact.name} size="lg" />
        <div className="min-w-0 flex-[1_1_260px]">
          <h1 className="font-display text-[28px] font-bold leading-tight">{contact.name}</h1>
          <p className="text-muted">{[contact.comuna, `cliente desde ${formatShortDate(contact.created_at)}`].filter(Boolean).join(' · ')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {contact.phone && <a href={`tel:${contact.phone}`} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-white px-4 font-bold"><Phone className="h-4 w-4" aria-hidden />Llamar</a>}
          {contact.phone && <a href={`https://wa.me/${phoneDigits(contact.phone)}`} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-white px-4 font-bold"><MessageCircle className="h-4 w-4" aria-hidden />WhatsApp</a>}
          {contact.email && <a href={`mailto:${contact.email}`} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-white px-4 font-bold"><Mail className="h-4 w-4" aria-hidden />Correo</a>}
          {editable && <NewConversation defaultContact={{ id: contact.id, name: contact.name, phone: contact.phone }} triggerLabel="Nueva conversación" />}
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4"><p className="text-sm font-bold text-muted">Total comprado</p><p className="mt-1 text-2xl font-extrabold">{formatClp(contact.spent)}</p></Card>
        <Card className="p-4"><p className="text-sm font-bold text-muted">Compras</p><p className="mt-1 text-2xl font-extrabold">{contact.purchases}</p></Card>
        <Card className="p-4"><p className="text-sm font-bold text-muted">Conversaciones</p><p className="mt-1 text-2xl font-extrabold">{contact.conversations.length}</p></Card>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5">
          <Card className="space-y-3 p-5">
            <CardTitle>Ventas</CardTitle>
            {contact.sales.length === 0 ? <p className="text-sm text-muted">Aún no hay ventas registradas.</p> : (
              <ul className="divide-y divide-line">
                {contact.sales.map((s) => {
                  const label = saleLabel(s)
                  const body = (
                    <>
                      <span className="min-w-0 flex-1"><span className="block truncate font-bold">{s.title ?? 'Sin producto'}</span><span className="text-sm text-muted">{formatShortDate(s.created_at)}</span></span>
                      <Badge tone={label.tone}>{label.label}</Badge>
                      <span className="w-28 text-right font-extrabold">{formatClp(s.value_clp + s.delivery_clp)}</span>
                    </>
                  )
                  return (
                    <li key={s.id}>
                      {s.conversation_id
                        ? <Link href={`/conversaciones?c=${s.conversation_id}`} className="flex items-center gap-3 py-3 hover:bg-brand-50/50">{body}</Link>
                        : <div className="flex items-center gap-3 py-3">{body}</div>}
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>
          <Card className="space-y-3 p-5">
            <CardTitle>Conversaciones</CardTitle>
            {contact.conversations.length === 0 ? <p className="text-sm text-muted">Aún no hay conversaciones con este cliente.</p> : (
              <ul className="divide-y divide-line">
                {contact.conversations.map((c) => (
                  <li key={c.id}>
                    <Link href={`/conversaciones?c=${c.id}`} className="flex items-center gap-3 py-3 hover:bg-brand-50/50">
                      <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', CHANNELS[c.channel].dot)} aria-hidden />
                      <span className="min-w-0 flex-1"><span className="block font-bold">{CHANNELS[c.channel].label}{c.status === 'closed' && ' · archivada'}</span>
                        <span className="block truncate text-sm text-muted">{c.last_message_preview ?? 'Sin mensajes'}</span></span>
                      <span className="shrink-0 text-sm text-muted">{timeAgo(c.last_message_at)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <Card className="space-y-4 p-5">
          <CardTitle>Datos del cliente</CardTitle>
          {editable ? (
            <ActionForm action={updateContact} className="space-y-4">
              <input type="hidden" name="id" value={contact.id} />
              <ContactFields contact={contact} />
              <SubmitButton className="w-full">Guardar cambios</SubmitButton>
            </ActionForm>
          ) : (
            <dl className="space-y-2 text-sm">
              {[['Teléfono', contact.phone], ['Correo', contact.email], ['Comuna', contact.comuna], ['Etiquetas', contact.tags.join(', ')], ['Notas', contact.notes]].map(([k, v]) => (
                <div key={k}><dt className="font-bold">{k}</dt><dd className="text-muted">{v || '—'}</dd></div>
              ))}
            </dl>
          )}
          {canManage(session.role) && (
            <ConfirmAction action={deleteContact} fields={{ id: contact.id }} trigger={<><Trash2 className="h-4 w-4" aria-hidden />Eliminar cliente</>}
              triggerVariant="ghost" triggerSize="sm" triggerClassName="w-full text-danger" title={`¿Eliminar a ${contact.name}?`}
              description="Se borran también sus conversaciones y ventas. No se puede deshacer." confirmLabel="Eliminar cliente" />
          )}
        </Card>
      </div>
    </div>
  )
}
