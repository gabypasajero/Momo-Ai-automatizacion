import { Lightbulb } from 'lucide-react'
import Link from 'next/link'
import { ActionForm, CancelButton, ConfirmAction, Input, Modal, SubmitButton, TextArea, buttonClass } from '@/components/ui'
import { cn } from '@/lib/cn'
import { timeAgo } from '@/lib/format'
import { answerGap, dismissGap, snoozeGap } from './actions'

export interface GapView {
  id: string
  question: string
  conversation_id: string | null
  created_at: string
}

/** "Enseñarle" a Momo: la respuesta queda como política. */
export function TeachButton({ gap, variant = 'accent' }: { gap: GapView; variant?: 'accent' | 'secondary' }) {
  return (
    <Modal trigger="Enseñarle" triggerVariant={variant} title="Enséñale a Momo"
      description={<>Pregunta del cliente: <strong className="text-ink">“{gap.question}”</strong></>}>
      <ActionForm action={answerGap} closeOnSuccess className="space-y-4">
        <input type="hidden" name="gap_id" value={gap.id} />
        <Input label="Título de la política" name="title" defaultValue={gap.question.slice(0, 80)} required maxLength={120} />
        <TextArea label="¿Qué debe responder Momo?" name="content" rows={5} required maxLength={4000}
          placeholder="Ejemplo: El despacho a Rancagua cuesta $25.000 y llega en 7 días hábiles." />
        <div className="flex justify-end gap-2"><CancelButton /><SubmitButton>Guardar y enseñar</SubmitButton></div>
      </ActionForm>
    </Modal>
  )
}

/** Tarjeta "Momo aprendió algo" (Hoy) o fila de la pestaña Dudas. */
export function GapCard({ gap, pending, compact = false, editable }: { gap: GapView; pending?: number; compact?: boolean; editable: boolean }) {
  return (
    <section aria-label="Duda de Momo" className={cn('flex flex-wrap items-center gap-4 rounded-3xl border border-dashed border-accent/60 bg-white p-5', compact && 'p-4')}>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent-strong">
        <Lightbulb className="h-5 w-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-[1_1_280px]">
        {!compact && <p className="font-extrabold">Momo aprendió algo{pending && pending > 1 ? ` · ${pending} dudas pendientes` : ''}</p>}
        <p className={cn(compact ? 'font-semibold' : 'text-muted')}>
          {compact ? gap.question : <>Un cliente preguntó: “{gap.question}” y no supe responder. ¿Me enseñas?</>}
        </p>
        <p className="mt-0.5 text-xs text-muted">
          {timeAgo(gap.created_at)}
          {gap.conversation_id && <> · <Link href={`/conversaciones?c=${gap.conversation_id}`} className="font-bold text-brand-700 hover:underline">Ver conversación</Link></>}
        </p>
      </div>
      {editable && (
        <div className="flex flex-wrap gap-2">
          <TeachButton gap={gap} />
          {compact ? (
            <ConfirmAction action={dismissGap} fields={{ gap_id: gap.id }} trigger="Descartar" triggerVariant="secondary"
              title="¿Descartar esta duda?" description="Momo seguirá sin saber responderla. Puedes volver a anotarla cuando quieras." confirmLabel="Descartar" />
          ) : (
            <form action={snoozeGap}>
              <input type="hidden" name="gap_id" value={gap.id} />
              <button type="submit" className={buttonClass('secondary')}>Más tarde</button>
            </form>
          )}
        </div>
      )}
    </section>
  )
}
