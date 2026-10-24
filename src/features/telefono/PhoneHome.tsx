import { ChevronRight, HandCoins, MessageCircleHeart, UsersRound } from 'lucide-react'
import Link from 'next/link'
import { Mascot } from '@/components/brand'
import { NewConversation } from '@/features/conversaciones/NewConversation'
import { PushToggle } from '@/features/avisos/PushToggle'
import { firstName, formatClp, greeting } from '@/lib/format'

/** Portada exclusiva del teléfono: saludo grande y 3 botones gigantes. Pensada para quien no usa mucha tecnología. */
export function PhoneHome({ name, waiting, sold, editable, detail }: {
  name: string
  waiting: number
  sold: number
  editable: boolean
  detail: string
}) {
  const tiles = [
    { href: '/conversaciones?f=esperan', icon: MessageCircleHeart, title: 'Te esperan', big: String(waiting), note: waiting === 1 ? 'cliente por responder' : 'clientes por responder', strong: waiting > 0 },
    { href: '/conversaciones?f=vendidas', icon: HandCoins, title: 'Vendí', big: formatClp(sold), note: 'esta semana', strong: false },
    { href: '/clientes', icon: UsersRound, title: 'Mis clientes', big: '', note: 'Ver a todos', strong: false },
  ]
  return (
    <div className="space-y-4 md:hidden">
      <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 p-6 text-white">
        <span className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10" aria-hidden />
        <span className="absolute -bottom-10 right-10 h-24 w-24 rounded-full bg-white/10" aria-hidden />
        <div className="relative flex items-center gap-4">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-50"><Mascot className="h-14 w-14" title="" /></span>
          <div className="min-w-0">
            <h1 className="font-display text-[26px] font-bold leading-tight">{greeting()}, {firstName(name)}</h1>
            <p className="mt-1 text-[17px] text-brand-50">{detail}</p>
          </div>
        </div>
      </section>

      <ul className="space-y-3">
        {tiles.map(({ href, icon: Icon, title, big, note, strong }) => (
          <li key={href}>
            <Link href={href} className={strong
              ? 'flex min-h-24 items-center gap-4 rounded-[28px] bg-brand-600 p-5 text-white shadow-lg shadow-brand-600/25 active:scale-[0.99]'
              : 'flex min-h-24 items-center gap-4 rounded-[28px] border-2 border-brand-100 bg-white p-5 active:scale-[0.99]'}>
              <span className={strong ? 'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15' : 'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-700'}>
                <Icon className="h-8 w-8" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xl font-extrabold">{title}</span>
                <span className={strong ? 'block text-base text-brand-50' : 'block text-base text-muted'}>
                  {big && <b className={strong ? 'text-white' : 'text-ink'}>{big} </b>}{note}
                </span>
              </span>
              <ChevronRight className="h-7 w-7 shrink-0 opacity-70" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>

      {editable && (
        <NewConversation triggerLabel="Anotar mensaje de un cliente" triggerClassName="min-h-16 w-full text-lg" />
      )}
      <PushToggle />
    </div>
  )
}
