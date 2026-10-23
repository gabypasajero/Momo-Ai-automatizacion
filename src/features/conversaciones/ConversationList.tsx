import Link from 'next/link'
import { Avatar, Badge } from '@/components/ui'
import { CHANNELS, saleLabel } from '@/config/sales'
import { cn } from '@/lib/cn'
import { timeAgo } from '@/lib/format'
import type { ConversationListItem } from './queries'

/** Una fila de la bandeja (también se usa en "Hoy" y en la ficha del cliente). */
export function ConversationRow({ item, href, active, showReason }: { item: ConversationListItem; href: string; active?: boolean; showReason?: boolean }) {
  const label = saleLabel(item.sale)
  const waiting = item.status === 'open' && !item.ai_enabled && item.last_message_author === 'client'
  const preview = item.last_message_preview
    ? `${item.last_message_author === 'client' ? '' : item.last_message_author === 'ai' ? 'Momo: ' : 'Tú: '}${item.last_message_preview}`
    : item.sale?.title ?? 'Sin mensajes'
  return (
    <Link href={href} aria-current={active ? 'true' : undefined}
      className={cn('flex gap-3 rounded-2xl border p-3 transition',
        active ? 'border-brand-200 bg-white shadow-card' : 'border-transparent hover:bg-white')}>
      <Avatar name={item.contact.name} />
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex items-baseline justify-between gap-2">
          <strong className="truncate">{item.contact.name}</strong>
          <span className="shrink-0 text-xs text-muted">{timeAgo(item.last_message_at)}</span>
        </span>
        <span className={cn('truncate text-sm', item.unread_count > 0 ? 'font-bold text-ink' : 'text-muted')}>{showReason && item.sale?.title ? item.sale.title : preview}</span>
        <span className="flex flex-wrap items-center gap-1.5">
          <Badge tone={label.tone}>{label.label}</Badge>
          <span className="inline-flex items-center gap-1 text-xs text-muted"><span className={cn('h-1.5 w-1.5 rounded-full', CHANNELS[item.channel].dot)} aria-hidden />{CHANNELS[item.channel].label}</span>
          {waiting && <span className="text-xs font-extrabold text-brand-700">· Te espera</span>}
          {item.unread_count > 0 && <span className="ml-auto rounded-full bg-brand-600 px-1.5 text-xs font-extrabold text-white" aria-label={`${item.unread_count} sin leer`}>{item.unread_count}</span>}
        </span>
      </span>
    </Link>
  )
}
