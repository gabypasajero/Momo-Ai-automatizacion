import { ShieldCheck } from 'lucide-react'
import { notFound } from 'next/navigation'
import { Card } from '@/components/ui'
import { AdminDashboard, PanelPasswordForm, getAdminOverview, getAdminPanelState } from '@/features/admin'

export const metadata = { title: 'Administración · Momo AI' }
export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const state = await getAdminPanelState()
  // Para quien no es administrador de la plataforma, la página no existe.
  if (state === 'sin_acceso') notFound()
  if (state === 'abierto') return <AdminDashboard companies={await getAdminOverview()} />

  const create = state === 'sin_clave'
  return (
    <Card className="mx-auto mt-8 max-w-sm p-6">
      <ShieldCheck className="h-8 w-8 text-brand-600" aria-hidden />
      <h1 className="mt-3 text-xl font-bold">Panel de administración</h1>
      <p className="mt-1 text-sm text-muted">
        {create
          ? 'Primera vez: crea una contraseña solo para este panel. Es distinta a la de tu cuenta y nadie más la tendrá.'
          : 'Ingresa la contraseña del panel. Se cierra solo tras 30 minutos.'}
      </p>
      {state === 'bloqueado' && <p role="alert" className="mt-3 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">Demasiados intentos. Vuelve a intentar en 15 minutos.</p>}
      <div className="mt-4"><PanelPasswordForm mode={create ? 'crear' : 'abrir'} /></div>
    </Card>
  )
}
