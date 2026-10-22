import { CHANNELS } from '@/config/channels'
import type { ChannelType } from '@/lib/data/types'
import { cn } from '@/lib/cn'

export function ChannelIcon({ channel, size = 'sm' }: { channel: ChannelType; size?: 'sm' | 'lg' }) {
  const { icon: Icon, label, className } = CHANNELS[channel]
  return (
    <span
      title={label}
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center text-white',
        size === 'lg' ? 'h-10 w-10 rounded-xl' : 'h-5 w-5 rounded-md',
        className,
      )}
    >
      <Icon className={size === 'lg' ? 'h-5 w-5' : 'h-3 w-3'} aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  )
}
