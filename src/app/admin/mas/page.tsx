import { ArrowLeft, ChevronRight, Gauge, Lock, ShieldCheck } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { InstallApp } from '@/components/pwa/InstallApp'
import { PageTitle } from '@/components/ui'
import { lockPanel } from '@/features/admin/actions'
import { getAdminContext } from '@/features/admin/queries'

export const metadata: Metadata = { title: 'Más' }

const LINKS = [
  { href: '/admin/consumo', label: 'Consumo de IA', description: 'Cuánto gasta cada empresa en Momo', icon: Gauge },
  { href: '/admin/seguridad', label: 'Seguridad', description: 'Contraseña del panel y protección', icon: ShieldCheck },
]

export default async function ControlMas() {
  const { email } = await getAdminContext()
  const row = 'flex min-h-16 w-full items-center gap-4 rounded-3xl border border-line bg-white p-4 text-left'
  return (
    <div className="space-y-4">
      <PageTitle title="Más" description={email} />
      <InstallApp name="Momo Control" />
      <ul className="space-y-2">
        {LINKS.map(({ href, label, description, icon: Icon }) => (
          <li key={href}><Link href={href} className={row}>
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-600 text-white"><Icon className="h-5 w-5" aria-hidden /></span>
            <span className="min-w-0 flex-1"><span className="block font-extrabold">{label}</span><span className="block text-sm text-muted">{description}</span></span>
            <ChevronRight className="h-5 w-5 text-muted" aria-hidden />
          </Link></li>
        ))}
        <li><Link href="/hoy" className={row}>
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700"><ArrowLeft className="h-5 w-5" aria-hidden /></span>
          <span className="min-w-0 flex-1"><span className="block font-extrabold">Volver a mi panel</span><span className="block text-sm text-muted">El Momo de tu empresa</span></span>
        </Link></li>
        <li><form action={lockPanel}><button type="submit" className={row}>
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700"><Lock className="h-5 w-5" aria-hidden /></span>
          <span className="min-w-0 flex-1"><span className="block font-extrabold">Cerrar panel</span><span className="block text-sm text-muted">Pide la contraseña la próxima vez</span></span>
        </button></form></li>
      </ul>
    </div>
  )
}
