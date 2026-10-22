import type { ReactNode } from 'react'
import { Mascot } from '@/components/brand'
import { Card } from '@/components/ui'

/** Tarjeta centrada con la marca, compartida por ingreso y recuperación de contraseña. */
export function AuthCard({ subtitle, children, footer }: { subtitle: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm p-6">
        <div className="mb-5 text-center">
          <Mascot variant="full" className="mx-auto h-28 w-auto" title="Momo, la mascota de Momo AI" />
          <h1 className="mt-2 text-xl font-bold">¡Hola! Soy Momo</h1>
          <p className="text-sm text-muted">{subtitle}</p>
        </div>
        {children}
        {footer && <div className="mt-4 text-center text-xs text-muted">{footer}</div>}
      </Card>
    </main>
  )
}
