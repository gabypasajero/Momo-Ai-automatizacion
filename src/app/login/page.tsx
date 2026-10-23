import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { AuthCard } from '@/features/auth/AuthCard'
import { LoginForm } from '@/features/auth/LoginForm'
import { isSupabaseConfigured } from '@/lib/env'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Ingresar' }

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = '/hoy' } = await searchParams
  if (isSupabaseConfigured) {
    // Con sesión abierta no tiene sentido volver a ingresar.
    const { data: { user } } = await (await createSupabaseServerClient()).auth.getUser()
    if (user) redirect('/hoy')
  }
  return (
    <AuthCard subtitle="Ingresa a tu panel de ventas" footer="¿No tienes cuenta? Pídela al dueño de tu empresa: se crea desde Ajustes › Equipo.">
      <LoginForm next={next} />
    </AuthCard>
  )
}
