'use client'

import { Mascot } from '@/components/brand'
import { Button, ButtonLink } from '@/components/ui'

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto mt-10 max-w-md rounded-3xl border border-line bg-white p-8 text-center">
      <Mascot className="mx-auto h-16 w-16" title="" />
      <h2 className="mt-3 font-display text-xl font-bold">Algo salió mal</h2>
      <p className="mt-1 text-muted">No pudimos cargar esta sección. Revisa tu conexión e intenta nuevamente.</p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Button variant="primary" onClick={reset}>Reintentar</Button>
        <ButtonLink href="/hoy">Ir a Hoy</ButtonLink>
      </div>
    </div>
  )
}
