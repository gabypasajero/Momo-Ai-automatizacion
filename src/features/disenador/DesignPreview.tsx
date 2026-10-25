'use client'

import { Download } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { buttonClass } from '@/components/ui'
import { formatClp } from '@/lib/format'
import { MODELOS, dibujarDiseno, type DesignSpec } from './modelos'

const FUENTES = 'https://fonts.googleapis.com/css2?family=Bangers&family=Fredoka:wght@700&family=Pacifico&display=swap'

/** Vista referencial que Momo crea en el chat: el mueble real con la foto y/o el nombre del cliente. */
export function DesignPreview({ spec, photo }: { spec: DesignSpec; photo: string | null }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const [url, setUrl] = useState<string | null>(null)
  const modelo = MODELOS.find((m) => m.id === spec.modelo) ?? MODELOS[0]!

  useEffect(() => {
    let cancel = false
    ;(async () => {
      // Las letras del diseñador (Fredoka, Pacifico, Bangers) se cargan una vez y se espera a que estén listas.
      let link = document.querySelector<HTMLLinkElement>(`link[href="${FUENTES}"]`)
      if (!link) {
        link = document.createElement('link'); link.rel = 'stylesheet'; link.href = FUENTES
        const ready = new Promise((r) => { link!.onload = r; link!.onerror = r; setTimeout(r, 4000) })
        document.head.appendChild(link)
        await ready
      } else if (!link.sheet) {
        await new Promise((r) => { link!.addEventListener('load', r, { once: true }); setTimeout(r, 4000) })
      }
      await Promise.all(['700 40px Fredoka', '40px Pacifico', '40px Bangers'].map((f) => document.fonts.load(f).catch(() => null)))
      let img: HTMLImageElement | null = null
      if (spec.conFoto && photo) {
        img = new Image()
        img.src = photo
        await img.decode().catch(() => { img = null })
      }
      const canvas = ref.current
      if (!canvas || cancel) return
      dibujarDiseno(canvas.getContext('2d')!, spec, img)
      setUrl(canvas.toDataURL('image/png'))
    })()
    return () => { cancel = true }
  }, [spec, photo])

  return (
    <figure className="w-64 overflow-hidden rounded-2xl border border-brand-200 bg-white">
      <canvas ref={ref} width={900} height={1100} className="h-auto w-full" role="img"
        aria-label={`Vista referencial: ${modelo.etiqueta}${spec.nombre ? ` con el nombre ${spec.nombre}` : ''}${spec.conFoto && photo ? ' con la imagen del cliente' : ''}`} />
      <figcaption className="space-y-1 p-2">
        <p className="text-xs font-bold">{modelo.etiqueta}{spec.nombre ? ` · ${spec.nombre}` : ''}</p>
        {spec.precio ? <p className="text-xs text-muted">{formatClp(spec.precio)}</p> : null}
        {url && (
          <a href={url} download={`diseno-${modelo.id}${spec.nombre ? `-${spec.nombre.toLowerCase()}` : ''}.png`} className={buttonClass('secondary', 'sm')}>
            <Download className="h-4 w-4" aria-hidden />Descargar para enviar
          </a>
        )}
      </figcaption>
    </figure>
  )
}
