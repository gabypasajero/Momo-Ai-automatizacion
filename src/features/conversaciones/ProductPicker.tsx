'use client'

import { Package, X } from 'lucide-react'
import { useEffect, useState, useTransition } from 'react'
import { inputClass } from '@/components/ui'
import { formatClp } from '@/lib/format'
import { searchProducts, type ProductOption } from './actions'

/** Elige el producto del catálogo; completa el título y el precio (editables). */
export function SaleFields({ productId, title, value, delivery }: { productId: string | null; title: string; value: number; delivery: number }) {
  const [selectedId, setSelectedId] = useState(productId)
  const [name, setName] = useState(title)
  const [price, setPrice] = useState(value ? String(value) : '')
  const [shipping, setShipping] = useState(delivery ? String(delivery) : '')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ProductOption[]>([])
  const [, startTransition] = useTransition()

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return }
    const id = setTimeout(() => startTransition(async () => setResults(await searchProducts(query))), 250)
    return () => clearTimeout(id)
  }, [query])

  const pick = (p: ProductOption) => {
    setSelectedId(p.id); setName(p.name); setPrice(String(p.price)); setQuery(''); setResults([])
  }
  const total = (Number(price.replace(/\D/g, '')) || 0) + (Number(shipping.replace(/\D/g, '')) || 0)

  return (
    <div className="space-y-3">
      <input type="hidden" name="product_id" value={selectedId ?? ''} />
      <div className="relative">
        <label className="block text-sm">
          <span className="font-bold">Buscar en el catálogo</span>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Closet, cómoda, rack…" autoComplete="off"
            className={`${inputClass} mt-1.5`} />
        </label>
        {results.length > 0 && (
          <ul className="absolute inset-x-0 top-full z-10 mt-1 max-h-64 overflow-y-auto rounded-2xl border border-line bg-white shadow-pop" aria-label="Productos">
            {results.map((p) => (
              <li key={p.id}>
                <button type="button" onClick={() => pick(p)} className="flex w-full items-start gap-2 px-4 py-2.5 text-left hover:bg-brand-50">
                  <Package className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden />
                  <span className="min-w-0 flex-1"><span className="block font-semibold">{p.name}</span>
                    <span className="block text-xs text-muted">{[p.category, p.dimensions].filter(Boolean).join(' · ')}</span></span>
                  <span className="text-sm font-bold">{formatClp(p.price)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <label className="block text-sm">
        <span className="font-bold">Producto o pedido</span>
        <span className="mt-1.5 flex items-center gap-2">
          <input name="title" value={name} onChange={(e) => { setName(e.target.value); setSelectedId(null) }} maxLength={160} placeholder="Closet 3 puertas · blanco" className={inputClass} />
          {selectedId && (
            <button type="button" onClick={() => setSelectedId(null)} aria-label="Quitar vínculo con el catálogo" title="Vinculado al catálogo"
              className="shrink-0 rounded-full bg-brand-50 p-2 text-brand-700"><X className="h-4 w-4" aria-hidden /></button>
          )}
        </span>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm"><span className="font-bold">Precio</span>
          <input name="value_clp" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="189990" className={`${inputClass} mt-1.5`} /></label>
        <label className="block text-sm"><span className="font-bold">Despacho</span>
          <input name="delivery_clp" inputMode="numeric" value={shipping} onChange={(e) => setShipping(e.target.value)} placeholder="15000" className={`${inputClass} mt-1.5`} /></label>
      </div>
      <p className="flex justify-between rounded-2xl bg-surface px-4 py-2.5 font-extrabold"><span>Total</span><span>{formatClp(total)}</span></p>
    </div>
  )
}
