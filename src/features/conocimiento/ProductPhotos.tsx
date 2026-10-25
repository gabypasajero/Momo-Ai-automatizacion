import { ExternalLink } from 'lucide-react'
import type { ProductPhoto } from '@/lib/ai/catalog'
import { formatClp } from '@/lib/format'

/** Fotos de referencia que Momo envía junto a su mensaje (sacadas del catálogo de la página). */
export function ProductPhotos({ photos }: { photos: ProductPhoto[] }) {
  if (!photos.length) return null
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Fotos de referencia">
      {photos.map((p) => (
        <li key={p.image} className="w-40 overflow-hidden rounded-2xl border border-line bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element -- fotos del catálogo en otro dominio */}
          <img src={p.image} alt={p.name} loading="lazy" className="aspect-square w-full bg-surface object-cover" />
          <div className="space-y-0.5 p-2">
            <p className="line-clamp-2 text-xs font-bold leading-snug">{p.name}</p>
            <p className="text-xs text-muted">{formatClp(p.price)}</p>
            {p.url && (
              <a href={p.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-8 items-center gap-1 text-xs font-extrabold text-brand-700 hover:underline">
                Ver en la página<ExternalLink className="h-3 w-3" aria-hidden /><span className="sr-only">(se abre en otra pestaña)</span>
              </a>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
