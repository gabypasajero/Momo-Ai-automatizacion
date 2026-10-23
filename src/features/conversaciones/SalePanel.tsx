import { Ban, Check, PencilRuler, Phone, RotateCcw, Trash2, Undo2 } from 'lucide-react'
import Link from 'next/link'
import { ActionForm, Badge, CancelButton, ConfirmAction, Modal, SubmitButton, TextArea, buttonClass } from '@/components/ui'
import { STEPS, saleLabel } from '@/config/sales'
import { cn } from '@/lib/cn'
import { formatClp, formatDateTime, phoneDigits } from '@/lib/format'
import type { HandoffContact } from '@/lib/session'
import { deleteConversation, markLost, reopenSale, setDesign, setStep, updateSale } from './actions'
import { SaleFields } from './ProductPicker'
import type { ConversationDetail } from './queries'

/** "Esta venta": pasos, producto, total, Área de Diseño, notas y cierre. */
export function SalePanel({ conversation, handoff, editable, canDelete }: {
  conversation: ConversationDetail
  handoff: HandoffContact[]
  editable: boolean
  canDelete: boolean
}) {
  const sale = conversation.sale
  if (!sale) return null
  const stepIndex = STEPS.findIndex((s) => s.id === sale.step)
  const label = saleLabel(sale)
  const lost = sale.status === 'lost'

  return (
    <aside aria-label="Esta venta" className="space-y-4 rounded-3xl border border-line bg-white p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-xl font-bold">Esta venta</h2>
        <Badge tone={label.tone}>{label.label}</Badge>
      </div>

      <ol className="space-y-1.5" aria-label="Pasos de la venta">
        {STEPS.map((step, i) => {
          const done = !lost && i <= stepIndex
          const current = i === stepIndex
          return (
            <li key={step.id}>
              <form action={setStep}>
                <input type="hidden" name="sale_id" value={sale.id} />
                <input type="hidden" name="step" value={step.id} />
                <button type="submit" disabled={!editable || current} aria-current={current ? 'step' : undefined}
                  className={cn('flex w-full min-h-10 items-center gap-3 rounded-2xl px-2 text-left transition enabled:hover:bg-brand-50 disabled:cursor-default')}>
                  <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-extrabold',
                    done ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-700')}>
                    {done && i < stepIndex ? <Check className="h-4 w-4" aria-hidden /> : i + 1}
                  </span>
                  <span className={cn(current ? 'font-extrabold' : 'font-semibold', done ? 'text-ink' : 'text-muted')}>{step.label}</span>
                  {editable && !current && <span className="ml-auto text-xs font-semibold text-muted">Marcar</span>}
                </button>
              </form>
            </li>
          )
        })}
      </ol>

      {lost && (
        <div className="rounded-2xl bg-danger-soft p-3 text-sm text-danger">
          <p className="font-extrabold">Venta perdida{sale.closed_at ? ` · ${formatDateTime(sale.closed_at)}` : ''}</p>
          {sale.lost_reason && <p className="mt-0.5">{sale.lost_reason}</p>}
          {editable && (
            <form action={reopenSale} className="mt-2">
              <input type="hidden" name="sale_id" value={sale.id} />
              <button type="submit" className={buttonClass('secondary', 'sm')}><RotateCcw className="h-4 w-4" aria-hidden />Reabrir venta</button>
            </form>
          )}
        </div>
      )}

      {editable ? (
        <ActionForm action={updateSale} className="space-y-3">
          <input type="hidden" name="sale_id" value={sale.id} />
          <SaleFields productId={sale.product_id} title={sale.title ?? ''} value={sale.value_clp} delivery={sale.delivery_clp} />
          <TextArea label="Notas" name="notes" defaultValue={sale.notes ?? ''} rows={2} maxLength={2000} placeholder="Prefiere entrega en la tarde" />
          <SubmitButton variant="secondary" className="w-full">Guardar venta</SubmitButton>
        </ActionForm>
      ) : (
        <div className="space-y-1 rounded-2xl bg-surface p-4 text-sm">
          <p className="font-extrabold">{sale.title ?? 'Sin producto'}</p>
          <p className="flex justify-between"><span>Producto</span><span>{formatClp(sale.value_clp)}</span></p>
          <p className="flex justify-between"><span>Despacho</span><span>{formatClp(sale.delivery_clp)}</span></p>
          <p className="flex justify-between font-extrabold"><span>Total</span><span>{formatClp(sale.value_clp + sale.delivery_clp)}</span></p>
          {sale.notes && <p className="pt-2 text-muted">Notas: {sale.notes}</p>}
        </div>
      )}

      {editable && !lost && (
        <div className="space-y-2">
          {stepIndex < 2 && (
            <form action={setStep}>
              <input type="hidden" name="sale_id" value={sale.id} />
              <input type="hidden" name="step" value="pagado" />
              <button type="submit" className={buttonClass('success', 'md', 'w-full')}><Check className="h-4 w-4" aria-hidden />Marcar como pagada</button>
            </form>
          )}
          {sale.step === 'pagado' && (
            <form action={setStep}>
              <input type="hidden" name="sale_id" value={sale.id} />
              <input type="hidden" name="step" value="despachado" />
              <button type="submit" className={buttonClass('success', 'md', 'w-full')}><Check className="h-4 w-4" aria-hidden />Marcar como despachada</button>
            </form>
          )}
          <form action={setDesign}>
            <input type="hidden" name="sale_id" value={sale.id} />
            <input type="hidden" name="conversation_id" value={conversation.id} />
            <input type="hidden" name="design" value={sale.design ? 'false' : 'true'} />
            <button type="submit" className={buttonClass(sale.design ? 'secondary' : 'accent', 'md', 'w-full')}>
              {sale.design ? <><Undo2 className="h-4 w-4" aria-hidden />Quitar del Área de Diseño</> : <><PencilRuler className="h-4 w-4" aria-hidden />Pasar al Área de Diseño</>}
            </button>
          </form>
          {stepIndex < 2 && (
            <Modal trigger={<><Ban className="h-4 w-4" aria-hidden />Venta perdida</>} triggerVariant="ghost" triggerClassName="w-full" title="Marcar venta como perdida"
              description="Anotar el motivo ayuda a Momo a mejorar y a ti a ver qué falta.">
              <ActionForm action={markLost} closeOnSuccess className="space-y-4">
                <input type="hidden" name="sale_id" value={sale.id} />
                <TextArea label="¿Por qué se perdió?" hint="opcional" name="reason" rows={3} maxLength={300} placeholder="Encontró más barato, no respondió, despacho muy caro…" />
                <div className="flex justify-end gap-2"><CancelButton /><SubmitButton>Marcar como perdida</SubmitButton></div>
              </ActionForm>
            </Modal>
          )}
        </div>
      )}

      {sale.design && handoff.length > 0 && (
        <div className="rounded-2xl bg-accent-soft p-3 text-sm text-accent-strong">
          <p className="font-extrabold">Derivar a</p>
          <ul className="mt-1 space-y-1">
            {handoff.map((c) => (
              <li key={c.phone} className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{c.label}</span>
                <a href={`tel:${c.phone}`} className="inline-flex items-center gap-1 underline"><Phone className="h-3.5 w-3.5" aria-hidden />{c.phone}</a>
                <a href={`https://wa.me/${phoneDigits(c.phone)}`} className="underline">WhatsApp</a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-1 border-t border-line pt-3 text-sm">
        <p className="font-extrabold">{conversation.contact.name}</p>
        {conversation.contact.phone && <p><a href={`tel:${conversation.contact.phone}`} className="text-brand-700 underline">{conversation.contact.phone}</a></p>}
        {conversation.contact.comuna && <p className="text-muted">{conversation.contact.comuna}</p>}
        <Link href={`/clientes/${conversation.contact.id}`} className="inline-block pt-1 font-bold text-brand-700 hover:underline">Ver ficha del cliente</Link>
      </div>

      {canDelete && (
        <ConfirmAction action={deleteConversation} fields={{ conversation_id: conversation.id }}
          trigger={<><Trash2 className="h-4 w-4" aria-hidden />Eliminar conversación</>} triggerVariant="ghost" triggerSize="sm" triggerClassName="w-full text-danger"
          title="¿Eliminar esta conversación?" description="Se borran los mensajes y la venta asociada. El cliente queda en Clientes. No se puede deshacer."
          confirmLabel="Eliminar" confirmVariant="primary" />
      )}
    </aside>
  )
}
