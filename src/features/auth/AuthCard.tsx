import type { ReactNode } from 'react'
import { Card } from '@/components/ui'

/** Tarjeta centrada con la marca, compartida por ingreso y recuperación de contraseña. */
export function AuthCard({ subtitle, children, footer }: { subtitle: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent text-lg font-bold text-white">M</span>
          <div>
            <h1 className="font-semibold">Momo AI</h1>
            <p className="text-sm text-muted">{subtitle}</p>
          </div>
        </div>
        {children}
        {footer && <div className="mt-4 text-center text-xs text-muted">{footer}</div>}
      </Card>
    </main>
  )
}
