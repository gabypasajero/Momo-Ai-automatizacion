'use client'

import { Bell, BellOff, BellRing } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/cn'
import { deletePushSubscription, getPushPublicKey, savePushSubscription } from './actions'

type State = 'cargando' | 'no-soportado' | 'instalar' | 'bloqueado' | 'apagado' | 'encendido'

function keyBytes(base64: string) {
  const pad = '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + pad).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

/** Botón grande para activar los avisos "Un cliente te escribió" en este teléfono. */
export function PushToggle({ className }: { className?: string }) {
  const [state, setState] = useState<State>('cargando')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    (async () => {
      const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
      const standalone = window.matchMedia('(display-mode: standalone)').matches
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
        setState(ios && !standalone ? 'instalar' : 'no-soportado'); return
      }
      if (Notification.permission === 'denied') { setState('bloqueado'); return }
      const reg = await navigator.serviceWorker.register('/sw.js')
      const sub = await reg.pushManager.getSubscription()
      setState(sub ? 'encendido' : 'apagado')
    })().catch(() => setState('no-soportado'))
  }, [])

  const turnOn = async () => {
    setBusy(true); setMsg('')
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') { setState(permission === 'denied' ? 'bloqueado' : 'apagado'); return }
      const publicKey = await getPushPublicKey()
      if (!publicKey) { setMsg('Los avisos aún no están disponibles. Intenta más tarde.'); return }
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) })
      const json = sub.toJSON()
      const res = await savePushSubscription({ endpoint: sub.endpoint, p256dh: json.keys?.p256dh ?? '', auth: json.keys?.auth ?? '' })
      if (!res.ok) { await sub.unsubscribe(); setMsg('No se pudo activar. Intenta de nuevo en un rato.'); return }
      setState('encendido'); setMsg('¡Listo! Te avisaremos cuando un cliente te escriba.')
    } catch { setMsg('No se pudo activar. Intenta de nuevo.') } finally { setBusy(false) }
  }
  const turnOff = async () => {
    setBusy(true); setMsg('')
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) { await deletePushSubscription(sub.endpoint); await sub.unsubscribe() }
      setState('apagado')
    } finally { setBusy(false) }
  }

  if (state === 'cargando' || state === 'no-soportado') return null
  const on = state === 'encendido'
  const Icon = on ? BellRing : state === 'bloqueado' ? BellOff : Bell
  const description = {
    instalar: 'Primero instala Momo en tu inicio (más arriba) y ábrelo desde ahí.',
    bloqueado: 'Los avisos están bloqueados. Actívalos en los ajustes del teléfono, en "Notificaciones".',
    apagado: 'Te avisamos con sonido cuando un cliente te escriba.',
    encendido: 'Recibirás un aviso cuando un cliente te escriba.',
  }[state]

  return (
    <div className={cn('rounded-3xl border border-line bg-white p-4', className)}>
      <div className="flex items-center gap-4">
        <span className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl', on ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-700')}>
          <Icon className="h-6 w-6" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-extrabold">Avisos al teléfono {on && <span className="text-brand-600">· activados</span>}</p>
          <p className="text-sm text-muted">{description}</p>
        </div>
      </div>
      {(state === 'apagado' || on) && (
        <button type="button" disabled={busy} onClick={on ? turnOff : turnOn}
          className={cn('mt-3 min-h-12 w-full rounded-full px-5 text-base font-extrabold disabled:opacity-60',
            on ? 'border border-line text-ink' : 'bg-brand-600 text-white')}>
          {busy ? 'Un momento…' : on ? 'Apagar avisos' : 'Activar avisos'}
        </button>
      )}
      {msg && <p role="status" className="mt-2 text-sm font-semibold text-brand-700">{msg}</p>}
    </div>
  )
}
