import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthCard } from '@/features/auth/AuthCard'
import { NewPasswordForm } from '@/features/auth/NewPasswordForm'

export const metadata: Metadata = { title: 'Nueva contraseña' }

// Llega aquí desde el enlace del correo de recuperación (/auth/callback abre la sesión).
// Con la sesión abierta, la contraseña se cambia en Ajustes › Mi perfil (pide la actual).
export default function RestablecerPage() {
  return (
    <AuthCard title="Nueva contraseña" subtitle="Crea una contraseña que solo tú conozcas"
      footer={<Link href="/hoy" className="font-bold text-brand-700 hover:underline">Volver a Momo</Link>}>
      <NewPasswordForm />
    </AuthCard>
  )
}
