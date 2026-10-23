import { BarChart3, BookOpen, Ellipsis, Home, MessageCircle, Settings, ShieldCheck, Users } from 'lucide-react'
import type { NavId } from '@/config/navigation'

const ICONS = {
  hoy: Home, conversaciones: MessageCircle, clientes: Users, conocimiento: BookOpen, resultados: BarChart3,
  ajustes: Settings, mas: Ellipsis, buscar: Home, admin: ShieldCheck,
} as const

export function NavIcon({ id, className = 'h-5 w-5' }: { id: NavId | 'admin'; className?: string }) {
  const Icon = ICONS[id]
  return <Icon className={className} aria-hidden />
}
