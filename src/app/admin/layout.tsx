import { ArrowLeft, Lock } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Mascot } from '@/components/brand'
import { lockPanel } from '@/features/admin/actions'
import { AdminNav } from '@/features/admin/AdminNav'
import { PanelGate } from '@/features/admin/PanelGate'
import { getAdminContext, listRequests } from '@/features/admin/queries'

export const metadata: Metadata = { title: { default: 'Administración', template: '%s · Administración Momo AI' } }
export const dynamic = 'force-dynamic'

/** Área exclusiva del dueño de la plataforma: diseño propio, separado del panel de las empresas. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { state, email } = await getAdminContext()
  // Para quien no es administrador de la plataforma, esta área no existe.
  if (state === 'sin_acceso') notFound()
  if (state !== 'abierto') return <PanelGate state={state} email={email} />

  const pending = (await listRequests('pendiente')).length
  return (
    <div className="min-h-screen md:flex">
      <aside className="flex shrink-0 flex-col gap-4 bg-ink p-4 text-white md:sticky md:top-0 md:h-screen md:w-64 md:p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white"><Mascot className="h-9 w-9" title="" /></span>
          <div><p className="font-display text-lg font-bold leading-tight">Momo AI</p><p className="text-xs text-white/70">Administración</p></div>
        </div>
        <AdminNav pending={pending} />
        <div className="mt-auto hidden flex-col gap-1 md:flex">
          <p className="px-3 text-xs text-white/60">{email}</p>
          <Link href="/hoy" className="flex min-h-11 items-center gap-3 rounded-2xl px-3 font-semibold text-white/80 hover:bg-white/10 hover:text-white"><ArrowLeft className="h-5 w-5" aria-hidden />Volver a mi panel</Link>
          <form action={lockPanel}>
            <button type="submit" className="flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 font-semibold text-white/80 hover:bg-white/10 hover:text-white"><Lock className="h-5 w-5" aria-hidden />Cerrar panel</button>
          </form>
        </div>
      </aside>
      <main className="mx-auto w-full max-w-7xl min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">
        {children}
        <div className="mt-10 flex flex-wrap gap-2 md:hidden">
          <Link href="/hoy" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-white px-4 font-bold"><ArrowLeft className="h-4 w-4" aria-hidden />Volver a mi panel</Link>
          <form action={lockPanel}><button type="submit" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-white px-4 font-bold"><Lock className="h-4 w-4" aria-hidden />Cerrar panel</button></form>
        </div>
      </main>
    </div>
  )
}
