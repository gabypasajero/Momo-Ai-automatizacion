import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthCard } from '@/features/auth/AuthCard'
import { RecoveryForm } from '@/features/auth/RecoveryForm'

export const metadata: Metadata = { title: 'Recuperar contraseña' }

export default async function RecuperarPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  return (
    <AuthCard title="Recuperar contraseña" subtitle="Te enviaremos un enlace para crear una nueva"
      footer={<Link href="/login" className="font-bold text-brand-700 hover:underline">Volver al ingreso</Link>}>
      {error === 'enlace' && (
        <p role="alert" className="mb-4 rounded-2xl bg-warning-soft px-4 py-2.5 text-sm font-semibold text-warning">
          El enlace venció o se abrió en otro navegador. Pide uno nuevo aquí.
        </p>
      )}
      <RecoveryForm />
    </AuthCard>
  )
}
