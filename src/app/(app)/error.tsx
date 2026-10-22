'use client'

import { Button, Card } from '@/components/ui'

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <Card className="mx-auto mt-10 max-w-md p-8 text-center">
      <h2 className="text-lg font-semibold">Algo salió mal</h2>
      <p className="mt-1 text-sm text-muted">No pudimos cargar esta sección. Intenta nuevamente.</p>
      <Button variant="primary" className="mt-4" onClick={reset}>Reintentar</Button>
    </Card>
  )
}
