import { Mascot } from '@/components/brand'
import { ButtonLink } from '@/components/ui'

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="max-w-md text-center">
        <Mascot variant="full" className="mx-auto h-32 w-auto" title="" />
        <h1 className="mt-3 font-display text-2xl font-bold">No encontramos esta página</h1>
        <p className="mt-1 text-muted">Puede que el enlace esté incompleto o que ya no exista.</p>
        <ButtonLink href="/hoy" variant="primary" className="mt-5">Volver a Hoy</ButtonLink>
      </div>
    </main>
  )
}
