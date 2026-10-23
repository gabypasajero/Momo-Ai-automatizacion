import { Lock } from 'lucide-react'
import type { Metadata } from 'next'
import { ActionForm, Card, CardTitle, PageTitle, PasswordInput, SubmitButton, buttonClass } from '@/components/ui'
import { changePanelPassword, lockPanel } from '@/features/admin/actions'
import { getAdminContext } from '@/features/admin/queries'

export const metadata: Metadata = { title: 'Seguridad' }

export default async function SeguridadPage() {
  const { email } = await getAdminContext()
  return (
    <div className="space-y-5">
      <PageTitle title="Seguridad" description="Cómo se protege esta área." />
      <div className="grid items-start gap-5 lg:grid-cols-2">
        <Card className="space-y-4 p-5">
          <CardTitle>Contraseña del panel</CardTitle>
          <ActionForm action={changePanelPassword} resetOnSuccess className="space-y-4">
            <PasswordInput name="current" label="Contraseña actual del panel" autoComplete="current-password" />
            <PasswordInput name="password" label="Nueva contraseña (mínimo 10)" autoComplete="new-password" minLength={10} />
            <PasswordInput name="confirm" label="Repite la nueva contraseña" autoComplete="new-password" minLength={10} />
            <SubmitButton>Cambiar contraseña del panel</SubmitButton>
          </ActionForm>
        </Card>
        <Card className="space-y-3 p-5">
          <CardTitle>Así se protege</CardTitle>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted">
            <li>Solo la cuenta <strong className="text-ink">{email}</strong> está registrada como administradora de la plataforma. Para el resto, esta área no existe.</li>
            <li>Además de iniciar sesión, pide una contraseña propia, guardada cifrada (nadie puede leerla).</li>
            <li>Se cierra sola a los 30 minutos. Con 5 intentos fallidos se bloquea 15 minutos.</li>
            <li>Las cuentas nuevas reciben una contraseña temporal que deben cambiar al entrar.</li>
          </ul>
          <form action={lockPanel}><button type="submit" className={buttonClass('secondary')}><Lock className="h-4 w-4" aria-hidden />Cerrar panel ahora</button></form>
        </Card>
      </div>
    </div>
  )
}
