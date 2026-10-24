import type { Metadata } from 'next'
import { Mascot } from '@/components/brand'
import { InstallApp } from '@/components/pwa/InstallApp'
import { PhoneHome } from '@/features/telefono/PhoneHome'
import { ButtonLink, Card, CardTitle, EmptyState, SearchForm } from '@/components/ui'
import { GapCard } from '@/features/conocimiento/GapCard'
import { ConversationRow } from '@/features/conversaciones/ConversationList'
import { NewConversation } from '@/features/conversaciones/NewConversation'
import { countWaiting, listConversations } from '@/features/conversaciones/queries'
import { lastDay, nextGap, week } from '@/features/hoy/queries'
import { firstName, formatClp, formatNumber, formatPercent, formatToday, greeting } from '@/lib/format'
import { canEdit, getSession } from '@/lib/session'

export const metadata: Metadata = { title: 'Hoy' }

function momoSays(day: Awaited<ReturnType<typeof lastDay>>, waiting: number) {
  const parts: string[] = []
  if (day.conversations === 0) parts.push('En las últimas 24 horas no hubo conversaciones nuevas.')
  else {
    parts.push(`En las últimas 24 horas hubo ${day.conversations} ${day.conversations === 1 ? 'conversación' : 'conversaciones'}`)
    parts[0] += day.momoReplies > 0 ? ` y respondí ${day.momoReplies} ${day.momoReplies === 1 ? 'mensaje' : 'mensajes'}.` : '.'
  }
  if (day.sales > 0) parts.push(day.sales === 1 ? `Se cerró 1 venta por ${formatClp(day.salesTotal)}.` : `Se cerraron ${day.sales} ventas por ${formatClp(day.salesTotal)}.`)
  const detail = waiting > 0
    ? waiting === 1 ? '1 cliente necesita que le respondas tú. Te dejé todo listo abajo.' : `${waiting} clientes necesitan que les respondas tú. Te dejé todo listo abajo.`
    : 'Nadie te está esperando. ¡Buen trabajo!'
  return { headline: parts.join(' '), detail }
}

export default async function HoyPage() {
  const session = await getSession()
  const [day, waitingCount, waiting, summary, gaps] = await Promise.all([
    lastDay(session), countWaiting(session), listConversations(session, { filter: 'esperan', limit: 5 }), week(session), nextGap(session),
  ])
  const editable = canEdit(session.role)
  const say = momoSays(day, waitingCount)
  const maxTop = Math.max(1, ...summary.top.map((t) => t.count))

  return (
    <div className="space-y-6">
      <InstallApp variant="banner" />
      <PhoneHome name={session.user.name} waiting={waitingCount} sold={summary.sold} editable={editable} detail={say.detail} />
      <header className="hidden flex-wrap items-end gap-4 md:flex">
        <div className="min-w-0 flex-[1_1_320px]">
          <p className="font-semibold text-muted">{formatToday()}</p>
          <h1 className="font-display text-[28px] font-bold leading-tight md:text-[32px]">{greeting()}, {firstName(session.user.name)}</h1>
        </div>
        <SearchForm action="/buscar" placeholder="Busca un cliente, producto o pedido" className="flex-[0_1_380px]" />
      </header>

      <section aria-label="Resumen de Momo" className="hidden flex-wrap md:flex items-center gap-5 rounded-3xl bg-brand-600 p-6 text-white">
        <span className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full bg-brand-50"><Mascot className="h-16 w-16" title="" /></span>
        <div className="min-w-0 flex-[1_1_320px]">
          <p className="font-display text-xl font-bold">{say.headline}</p>
          <p className="mt-1 text-brand-50">{say.detail}</p>
        </div>
        {waitingCount > 0
          ? <ButtonLink href="/conversaciones?f=esperan" variant="light" size="lg">Responder ahora</ButtonLink>
          : editable && <NewConversation triggerVariant="secondary" triggerLabel="Registrar conversación" />}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-3 p-5">
          <div className="flex items-center justify-between gap-2">
            <CardTitle>Te esperan</CardTitle>
            {waitingCount > waiting.length && <ButtonLink href="/conversaciones?f=esperan" variant="ghost" size="sm">Ver las {waitingCount}</ButtonLink>}
          </div>
          {waiting.length === 0 ? (
            <EmptyState className="border-none p-4" title="Todo al día" description="Cuando un cliente necesite respuesta de una persona, aparecerá aquí con el motivo." />
          ) : (
            <ul className="space-y-1">
              {waiting.map((item) => <li key={item.id}><ConversationRow item={item} href={`/conversaciones?f=esperan&c=${item.id}`} /></li>)}
            </ul>
          )}
        </Card>

        <Card className="space-y-4 p-5">
          <CardTitle>Ventas de la semana</CardTitle>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-success-soft p-4"><p className="text-sm font-bold text-success">Vendido</p><p className="mt-1 text-xl font-extrabold text-success">{formatClp(summary.sold)}</p></div>
            <div className="rounded-2xl bg-brand-50 p-4"><p className="text-sm font-bold text-brand-700">En curso</p><p className="mt-1 text-xl font-extrabold text-brand-700">{formatNumber(summary.inProgress)} {summary.inProgress === 1 ? 'venta' : 'ventas'}</p></div>
            <div className="rounded-2xl bg-accent-soft p-4"><p className="text-sm font-bold text-accent-strong">Respondió Momo</p><p className="mt-1 text-xl font-extrabold text-accent-strong">{summary.momoShare === null ? '—' : formatPercent(summary.momoShare)}</p></div>
          </div>
          <div>
            <p className="font-bold">Lo más preguntado</p>
            {summary.top.length === 0 ? (
              <p className="mt-1 text-sm text-muted">Anota qué le interesa a cada cliente en “Esta venta” y verás aquí lo más pedido del mes.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {summary.top.map((t) => (
                  <li key={t.name} className="flex items-center gap-3 text-sm">
                    <span className="w-40 shrink-0 truncate">{t.name}</span>
                    <span className="h-2.5 flex-1 rounded-full bg-brand-50" aria-hidden><span className="block h-2.5 rounded-full bg-brand-600" style={{ width: `${(t.count / maxTop) * 100}%` }} /></span>
                    <span className="w-8 shrink-0 text-right font-bold">{t.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <ButtonLink href="/resultados" variant="secondary" size="sm">Ver resultados completos</ButtonLink>
        </Card>
      </div>

      {gaps.gap ? (
        <GapCard gap={gaps.gap} pending={gaps.pending} editable={editable} />
      ) : (
        <section className="flex flex-wrap items-center gap-4 rounded-3xl border border-dashed border-line bg-white p-5">
          <Mascot className="h-11 w-11" title="" />
          <p className="min-w-0 flex-1 text-muted">No tengo dudas pendientes. Si un cliente me pregunta algo que no sé, te lo dejaré aquí para que me enseñes.</p>
          <ButtonLink href="/conocimiento" variant="secondary">Ver lo que sé</ButtonLink>
        </section>
      )}
    </div>
  )
}
