import { Camera, MessageCircle, MessageSquare, Music2, type LucideIcon } from 'lucide-react'
import type { ChannelType } from '@/lib/data/types'

/** Los canales conservan el color de su propia marca para que se reconozcan al instante. */
export const CHANNELS: Record<ChannelType, { label: string; icon: LucideIcon; className: string }> = {
  messenger: { label: 'Messenger', icon: MessageSquare, className: 'bg-gradient-to-br from-sky-400 to-blue-600' },
  whatsapp: { label: 'WhatsApp', icon: MessageCircle, className: 'bg-[#25D366]' },
  instagram: { label: 'Instagram', icon: Camera, className: 'bg-gradient-to-br from-amber-400 via-pink-500 to-purple-600' },
  tiktok: { label: 'TikTok', icon: Music2, className: 'bg-slate-900' },
}

export const CHANNEL_ORDER: ChannelType[] = ['messenger', 'whatsapp', 'instagram', 'tiktok']
