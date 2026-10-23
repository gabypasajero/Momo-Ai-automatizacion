import { Check } from 'lucide-react'
import type { ReactNode } from 'react'
import { Mascot } from '@/components/brand'

const POINTS = ['Momo sugiere cada respuesta con tu catálogo y tus políticas', 'Cada chat con su venta al lado, de la pregunta al despacho', 'Hecho para vender desde el celular']

/** Pantallas de acceso: a la izquierda la marca (en computador), a la derecha el formulario. */
export function AuthCard({ title = '¡Hola! Soy Momo', subtitle, children, footer }: { title?: string; subtitle: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1fr_minmax(420px,520px)]">
      <section aria-hidden className="relative hidden overflow-hidden bg-brand-600 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50"><Mascot className="h-10 w-10" title="" /></span>
          <span className="font-display text-2xl font-bold">Momo AI</span>
        </div>
        <div className="max-w-md space-y-6">
          <h2 className="font-display text-4xl font-bold leading-tight">Vende más por chat, sin dejar a nadie esperando.</h2>
          <ul className="space-y-3 text-lg text-brand-50">
            {POINTS.map((p) => <li key={p} className="flex gap-3"><Check className="mt-1 h-5 w-5 shrink-0" />{p}</li>)}
          </ul>
        </div>
        <Mascot variant="full" className="absolute -bottom-6 right-10 h-64 w-auto opacity-95" title="" />
        <p className="text-sm text-brand-100">Hecho en Chile para pymes que venden por redes sociales.</p>
      </section>
      <section className="flex items-center justify-center bg-surface p-4 sm:p-8">
        <div className="w-full max-w-sm">
          <div className="mb-6 text-center">
            <Mascot variant="full" className="mx-auto h-28 w-auto lg:hidden" title="Momo, la mascota de Momo AI" />
            <h1 className="mt-2 font-display text-[28px] font-bold leading-tight">{title}</h1>
            <p className="mt-1 text-muted">{subtitle}</p>
          </div>
          <div className="rounded-3xl border border-line bg-white p-6">{children}</div>
          {footer && <div className="mt-5 text-center text-sm text-muted">{footer}</div>}
        </div>
      </section>
    </main>
  )
}
