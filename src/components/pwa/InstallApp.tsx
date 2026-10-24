'use client'

import { Download, Share, SquarePlus, X } from 'lucide-react'
import { useEffect, useState } from 'react'

type PromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }
declare global { interface Window { __momoInstall?: PromptEvent } }
const DISMISS_KEY = 'momo_instalar_oculto'

/** Registra el service worker y ofrece instalar Momo en la pantalla de inicio del teléfono. */
export function InstallApp({ variant = 'card', name = 'Momo' }: { variant?: 'card' | 'banner'; name?: string }) {
  const [prompt, setPrompt] = useState<PromptEvent | null>(null)
  const [ios, setIos] = useState(false)
  const [android, setAndroid] = useState(false)
  const [installed, setInstalled] = useState(true)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {})
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true
    setInstalled(standalone)
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent))
    setAndroid(/android/i.test(navigator.userAgent))
    try { setHidden(localStorage.getItem(DISMISS_KEY) === '1') } catch {}
    if (window.__momoInstall) setPrompt(window.__momoInstall)
    const onPrompt = () => { if (window.__momoInstall) setPrompt(window.__momoInstall) }
    const onInstalled = () => setInstalled(true)
    window.addEventListener('momo-install', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => { window.removeEventListener('momo-install', onPrompt); window.removeEventListener('appinstalled', onInstalled) }
  }, [])

  if (installed || (!prompt && !ios && !android)) return null
  if (variant === 'banner' && hidden) return null

  const install = async () => {
    if (!prompt) return
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') setInstalled(true)
    window.__momoInstall = undefined
    setPrompt(null)
  }
  const dismiss = () => { setHidden(true); try { localStorage.setItem(DISMISS_KEY, '1') } catch {} }

  return (
    <section aria-label={`Instalar ${name} en tu teléfono`} className="relative rounded-3xl border border-brand-200 bg-brand-50 p-5 md:hidden">
      {variant === 'banner' && (
        <button type="button" onClick={dismiss} aria-label="Ocultar aviso" className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full hover:bg-white">
          <X className="h-5 w-5" aria-hidden />
        </button>
      )}
      <h2 className="pr-10 text-lg font-extrabold">Ten {name} en tu teléfono</h2>
      <p className="mt-1 text-base text-muted">Ábrelo con un toque, como cualquier otra app. No ocupa espacio.</p>
      {prompt ? (
        <button type="button" onClick={install} className="mt-4 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-brand-600 px-6 text-lg font-extrabold text-white">
          <Download className="h-6 w-6" aria-hidden />Instalar {name}
        </button>
      ) : android ? (
        <ol className="mt-4 space-y-3 text-base">
          <li className="flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 font-extrabold text-white">1</span>
            <span>Toca los <b>3 puntitos ⋮</b> arriba a la derecha de Chrome.</span></li>
          <li className="flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 font-extrabold text-white">2</span>
            <span>Elige <b>Instalar app</b> o <b>Agregar a pantalla principal</b>.</span></li>
          <li className="flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 font-extrabold text-white">3</span>
            <span>Toca <b>Instalar</b>. ¡Listo! {name} queda junto a tus apps.</span></li>
        </ol>
      ) : (
        <ol className="mt-4 space-y-3 text-base">
          <li className="flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 font-extrabold text-white">1</span>
            <span>Toca el botón <Share className="inline h-5 w-5 align-text-bottom" aria-label="Compartir" /> <b>Compartir</b> abajo en Safari.</span></li>
          <li className="flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 font-extrabold text-white">2</span>
            <span>Elige <SquarePlus className="inline h-5 w-5 align-text-bottom" aria-hidden /> <b>Agregar a inicio</b>.</span></li>
          <li className="flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 font-extrabold text-white">3</span>
            <span>Toca <b>Agregar</b>. ¡Listo! {name} queda junto a tus apps.</span></li>
        </ol>
      )}
    </section>
  )
}
