import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { AuthCard } from '@/features/auth/AuthCard'
import { LoginForm } from '@/features/auth/LoginForm'
import { isSupabaseConfigured } from '@/lib/env'

export const metadata: Metadata = { title: 'Ingresar' }

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (!isSupabaseConfigured) redirect('/inicio')
  const { next = '/inicio' } = await searchParams
  return (
    <AuthCard subtitle="Ingresa a tu panel de ventas" footer="¿No tienes cuenta? Pide una invitación al administrador de tu empresa.">
      <LoginForm next={next} />
    </AuthCard>
  )
}
