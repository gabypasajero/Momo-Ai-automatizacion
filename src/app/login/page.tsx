import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui'
import { LoginForm } from '@/features/auth/LoginForm'
import { isSupabaseConfigured } from '@/lib/env'

export const metadata: Metadata = { title: 'Ingresar' }

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (!isSupabaseConfigured) redirect('/inicio')
  const { next = '/inicio' } = await searchParams
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent text-lg font-bold text-white">M</span>
          <div>
            <h1 className="font-semibold">Momo AI</h1>
            <p className="text-sm text-muted">Ingresa a tu panel de ventas</p>
          </div>
        </div>
        <LoginForm next={next} />
        <p className="mt-4 text-center text-xs text-muted">¿No tienes cuenta? Pide una invitación al administrador de tu empresa.</p>
      </Card>
    </main>
  )
}
