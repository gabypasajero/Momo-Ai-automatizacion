import type { Metadata } from 'next'
import { AuthCard } from '@/features/auth/AuthCard'
import { NewPasswordForm } from '@/features/auth/NewPasswordForm'

export const metadata: Metadata = { title: 'Nueva contraseña' }

// Llega aquí desde el enlace del correo (/auth/callback abre la sesión) o desde el botón
// "Cambiar contraseña" del panel. Sin sesión, el middleware envía al login.
export default function RestablecerPage() {
  return (
    <AuthCard subtitle="Crea tu nueva contraseña">
      <NewPasswordForm />
    </AuthCard>
  )
}
