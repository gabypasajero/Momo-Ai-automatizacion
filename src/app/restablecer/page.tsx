import type { Metadata } from 'next'
import { AuthCard } from '@/features/auth/AuthCard'
import { NewPasswordForm } from '@/features/auth/NewPasswordForm'

export const metadata: Metadata = { title: 'Nueva contraseña' }

// Llega aquí desde el enlace del correo: /auth/callback ya abrió la sesión de recuperación.
export default function RestablecerPage() {
  return (
    <AuthCard subtitle="Crea tu nueva contraseña">
      <NewPasswordForm />
    </AuthCard>
  )
}
