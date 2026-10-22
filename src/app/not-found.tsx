import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3">
      <h1 className="text-2xl font-bold">Página no encontrada</h1>
      <Link href="/inicio" className="text-brand-600">Volver al inicio</Link>
    </main>
  )
}
