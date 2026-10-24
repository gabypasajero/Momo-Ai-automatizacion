import { ArrowLeft, Lock } from 'lucide-react'
import type { Metadata, Viewport } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Mascot } from '@/components/brand'
import { lockPanel } from '@/features/admin/actions'
import { AdminBottomNav, AdminNav } from '@/features/admin/AdminNav'
import { PanelGate } from '@/features/admin/PanelGate'
import { getAdminContext, listRequests } from '@/features/admin/queries'

export const metadata: Metadata = {
  title: { default: 'Momo Control', template: '%s · Momo Control' },
  manifest: '/admin-app.webmanifest',
  appleWebApp: { capable: true, title: 'Momo Control', statusBarStyle: 'black-translucent' },
  icons: { apple: '/icons/control-apple-touch-icon.png' },
}
export const viewport: Viewport = { themeColor: '#1E0F17' }
export const dynamic = 'force-dynamic'

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F7D9E2] ring-2 ring-[#F4B740]"><Mascot className="h-9 w-9" title="" /></span>
      <div><p className="font-display text-lg font-bold leading-tight">Momo Control</p><p className="text-xs font-bold uppercase tracking-widest text-[#F4B740]">Solo administración</p></div>
    </div>
  )
}

/** "Momo Control": la app exclusiva del dueño de la plataforma. Oscura y dorada, distinta a la de las empresas. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { state, email } = await getAdminContext()
  // Para quien no es administrador de la plataforma, esta área no existe.
  if (state === 'sin_acceso') notFound()
  if (state !== 'abierto') return <PanelGate state={state} email={email} />

  const pending = (await listRequests('pendiente')).length
  return (
    <div className="min-h-screen bg-[#F6F0EC] md:flex">
      <aside className="hidden shrink-0 flex-col gap-6 bg-[#1E0F17] p-5 text-white md:sticky md:top-0 md:flex md:h-screen md:w-64">
        <Brand />
        <AdminNav pending={pending} />
        <div className="mt-auto flex flex-col gap-1">
          <p className="px-3 text-xs text-white/60">{email}</p>
          <Link href="/hoy" className="flex min-h-11 items-center gap-3 rounded-2xl px-3 font-semibold text-white/80 hover:bg-white/10 hover:text-white"><ArrowLeft className="h-5 w-5" aria-hidden />Volver a mi panel</Link>
          <form action={lockPanel}>
            <button type="submit" className="flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 font-semibold text-white/80 hover:bg-white/10 hover:text-white"><Lock className="h-5 w-5" aria-hidden />Cerrar panel</button>
          </form>
        </div>
      </aside>
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 bg-[#1E0F17] px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))] text-white md:hidden">
        <Brand />
        <form action={lockPanel}>
          <button type="submit" aria-label="Cerrar panel" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10"><Lock className="h-5 w-5" aria-hidden /></button>
        </form>
      </header>
      <main className="mx-auto w-full min-w-0 max-w-7xl flex-1 px-4 pb-32 pt-5 md:px-8 md:py-8">{children}</main>
      <AdminBottomNav pending={pending} />
    </div>
  )
}
