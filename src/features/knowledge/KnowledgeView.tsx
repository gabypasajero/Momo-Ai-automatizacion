import { BookOpen, ExternalLink, Package, Search } from 'lucide-react'
import { Badge, Card, PageHeader } from '@/components/ui'
import type { KnowledgeEntry, Product } from '@/lib/data/types'
import { formatClp, formatNumber } from '@/lib/format'

interface Props {
  entries: KnowledgeEntry[]
  products: Product[]
  totalProducts: number
  query: string
}

export function KnowledgeView({ entries, products, totalProducts, query }: Props) {
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <PageHeader icon={BookOpen} title="Conocimiento del asistente"
          description="Lo que la IA usa para responder: las políticas de tu negocio y tu catálogo." />
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.4fr]">
        <section aria-labelledby="politicas" className="space-y-3">
          <h2 id="politicas" className="text-xs font-semibold uppercase text-muted">Políticas del negocio ({entries.length})</h2>
          {entries.map((e) => (
            <Card key={e.id} className="p-4">
              <h3 className="font-semibold">{e.title}</h3>
              <p className="mt-1 whitespace-pre-line text-sm text-muted">{e.content}</p>
            </Card>
          ))}
        </section>

        <section aria-labelledby="catalogo" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="catalogo" className="text-xs font-semibold uppercase text-muted">
              Catálogo · {query ? `${formatNumber(totalProducts)} resultados para “${query}”` : `${formatNumber(totalProducts)} productos`}
            </h2>
            {/* GET simple: la búsqueda corre en el servidor con el mismo índice que usará la IA. */}
            <form className="flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-1.5 text-sm focus-within:border-brand-400">
              <Search className="h-4 w-4 text-muted" aria-hidden />
              <input type="search" name="q" defaultValue={query} placeholder="Prueba: cocina con horno" aria-label="Buscar en el catálogo"
                className="w-56 bg-transparent outline-none placeholder:text-muted" />
            </form>
          </div>
          {products.length === 0 && (
            <Card className="p-6 text-center text-sm text-muted">
              <Package className="mx-auto mb-2 h-8 w-8 text-brand-200" aria-hidden />
              Sin resultados. Si un cliente pregunta por esto, la IA lo derivará a una persona.
            </Card>
          )}
          <ul className="grid gap-3 sm:grid-cols-2">
            {products.map((p) => (
              <li key={p.id}>
                <Card className="flex h-full gap-3 p-3">
                  {p.imageUrl ? (
                    // Imágenes externas de las tiendas: se cargan tal cual, sin optimizar.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imageUrl} alt="" loading="lazy" className="h-20 w-20 shrink-0 rounded-lg bg-surface object-cover" />
                  ) : (
                    <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-surface"><Package className="h-6 w-6 text-muted" aria-hidden /></span>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="line-clamp-2 text-sm font-medium">{p.name}</h3>
                    <p className="mt-1 text-sm">
                      {p.salePriceClp ? (
                        <><span className="font-semibold text-success">{formatClp(p.salePriceClp)}</span> <s className="text-xs text-muted">{formatClp(p.priceClp)}</s></>
                      ) : <span className="font-semibold">{formatClp(p.priceClp)}</span>}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      {p.customizable && <Badge tone="brand">Personalizable</Badge>}
                      {p.dimensions && <span className="text-xs text-muted">{p.dimensions}</span>}
                      {p.sourceUrl && (
                        <a href={p.sourceUrl} aria-label={`Ver ${p.name} en la tienda`} className="text-muted hover:text-brand-600">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
