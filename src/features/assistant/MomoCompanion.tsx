'use client'

import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Mascot } from '@/components/brand'
import { cn } from '@/lib/cn'
import { AssistantPanel } from './AssistantPanel'

/**
 * Momo recorre la interfaz: camina por el borde inferior, se cuelga de la barra superior,
 * sigue el cursor con la mirada, parpadea y da consejos según la pantalla.
 * Al tocarlo abre el chat de asistencia para vendedores.
 */

const W = 64
const H = 94
/** Altura desde la que se cuelga (borde superior de la ventana). */
const HANG_TOP = -6
const STORAGE_KEY = 'momo-oculto'

type Pose = 'idle' | 'walk' | 'hang' | 'wave'

const TIPS: Record<string, string[]> = {
  '/hoy': ['Aquí ves a quién responder primero.', 'Si no sé algo, te lo dejo abajo para que me enseñes.'],
  '/conversaciones': ['Pega lo que te escribió el cliente y pídeme una respuesta.', 'Marca los pasos de la venta a la derecha: Cotizado, Pagado, Despachado.'],
  '/clientes': ['Toca un cliente para ver todo lo que te ha comprado.', 'Puedes exportar tus clientes a Excel.'],
  '/conocimiento': ['Mientras más políticas me enseñes, mejor respondo.', 'Prueba cómo respondería en la pestaña Personalidad.'],
  '/resultados': ['¿Quieres que te explique alguna cifra? Tócame.'],
  '/ajustes': ['Aquí sumas a tu equipo y cambias tu contraseña.'],
}
const GENERIC_TIPS = ['¿Te ayudo con algo? Tócame.', 'Puedo buscar productos o agregar conocimiento por ti.']

const readHidden = () => {
  try { return window.localStorage.getItem(STORAGE_KEY) === '1' } catch { return false }
}
const writeHidden = (v: boolean) => {
  try { window.localStorage.setItem(STORAGE_KEY, v ? '1' : '0') } catch { /* sin almacenamiento: no se recuerda */ }
}
const rand = (a: number, b: number) => a + Math.random() * (b - a)

export function MomoCompanion() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [open, setOpen] = useState(false)
  const [still, setStill] = useState(false) // celular o "reducir movimiento"
  const [narrow, setNarrow] = useState(false) // celular: queda sobre la barra inferior
  const [pose, setPose] = useState<Pose>('idle')
  const [x, setX] = useState(0)
  const [facing, setFacing] = useState<1 | -1>(1)
  const [moveMs, setMoveMs] = useState(0)
  const [blink, setBlink] = useState(false)
  const [bubble, setBubble] = useState<string | null>(null)
  const svgRef = useRef<HTMLDivElement>(null)
  const xRef = useRef(0)
  const poseRef = useRef<Pose>('idle')
  const dodgeRef = useRef(0)
  useEffect(() => { poseRef.current = pose }, [pose])

  // Inicio: posición, preferencia de ocultar y modo quieto
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const narrow = window.innerWidth < 768
    setStill(reduce || narrow)
    setNarrow(narrow)
    setHidden(readHidden())
    const start = window.innerWidth - W - 28
    xRef.current = start
    setX(start)
    setMounted(true)
  }, [])

  // Ojos que siguen el cursor
  useEffect(() => {
    if (!mounted || hidden) return
    const onMove = (e: PointerEvent) => {
      const el = svgRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const dx = e.clientX - (r.left + r.width / 2)
      const dy = e.clientY - (r.top + r.height * 0.3)
      const len = Math.hypot(dx, dy) || 1
      // Colgado arriba: si el cursor se acerca, se suelta y baja para no tapar botones.
      if (poseRef.current === 'hang' && len < 110) setPose('idle')
      // Abajo: si el cursor se acerca, Momo se hace a un lado para no tapar lo que vas a tocar.
      else if (poseRef.current !== 'hang' && len < 120 && Date.now() - dodgeRef.current > 900) {
        dodgeRef.current = Date.now()
        const maxX = window.innerWidth - W - 16
        const away = dx > 0 ? xRef.current - 180 : xRef.current + 180
        const target = Math.min(maxX, Math.max(272, away < 272 || away > maxX ? (dx > 0 ? xRef.current + 180 : xRef.current - 180) : away))
        setFacing(target < xRef.current ? -1 : 1)
        setPose('walk')
        setMoveMs(350)
        xRef.current = target
        setX(target)
        setTimeout(() => setPose((p) => (p === 'walk' ? 'idle' : p)), 420)
      }
      const k = Math.min(1, len / 200) * 1.5
      el.style.setProperty('--momo-px', `${((dx / len) * k * facing).toFixed(2)}px`)
      el.style.setProperty('--momo-py', `${((dy / len) * k).toFixed(2)}px`)
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [mounted, hidden, facing])

  // Parpadeo
  useEffect(() => {
    if (!mounted || hidden) return
    let t: ReturnType<typeof setTimeout>
    const loop = () => {
      t = setTimeout(() => { setBlink(true); setTimeout(() => setBlink(false), 140); loop() }, rand(2500, 6000))
    }
    loop()
    return () => clearTimeout(t)
  }, [mounted, hidden])

  // Comportamiento: caminar, colgarse, saludar
  const nextAction = useCallback(() => {
    const maxX = window.innerWidth - W - 16
    const minX = 272 // deja libre el menú lateral
    const roll = Math.random()
    if (roll < 0.55) {
      const target = rand(minX, maxX)
      const dist = Math.abs(target - xRef.current)
      setFacing(target < xRef.current ? -1 : 1)
      setPose('walk')
      setMoveMs(dist * 9)
      xRef.current = target
      setX(target)
      return dist * 9 + rand(1500, 3500)
    }
    if (roll < 0.8) {
      setMoveMs(0)
      setPose('hang')
      return rand(5000, 9000)
    }
    setPose('wave')
    return 2200
  }, [])

  useEffect(() => {
    if (!mounted || hidden || still || open) { setPose('idle'); return }
    let t: ReturnType<typeof setTimeout>
    const loop = (delay: number) => {
      t = setTimeout(() => {
        const busy = nextAction()
        t = setTimeout(() => { setPose('idle'); loop(rand(3000, 7000)) }, busy)
      }, delay)
    }
    loop(2500)
    return () => clearTimeout(t)
  }, [mounted, hidden, still, open, nextAction])

  // Consejos según la pantalla
  useEffect(() => {
    if (!mounted || hidden || open) { setBubble(null); return }
    const tips = TIPS['/' + (pathname.split('/')[1] ?? '')] ?? GENERIC_TIPS
    let i = 0
    let t: ReturnType<typeof setTimeout>
    const show = (delay: number) => {
      t = setTimeout(() => {
        setBubble(tips[i % tips.length]); i++
        t = setTimeout(() => { setBubble(null); show(rand(30000, 50000)) }, 6500)
      }, delay)
    }
    show(4000)
    return () => clearTimeout(t)
  }, [mounted, hidden, open, pathname])

  const toggleHidden = (v: boolean) => { setHidden(v); writeHidden(v); if (v) setOpen(false) }

  if (!mounted) return null

  if (hidden) {
    return (
      <button type="button" onClick={() => toggleHidden(false)} aria-label="Mostrar a Momo"
        className="fixed bottom-[92px] right-3 z-40 flex min-h-10 items-center gap-1 rounded-full border border-line bg-white py-1 pl-1 pr-3 text-xs font-bold text-muted shadow-card hover:text-ink md:bottom-3">
        <Mascot className="h-6 w-6" title="" /> Momo
      </button>
    )
  }

  // Celular: botón redondo con la cara de Momo sobre la barra inferior (no tapa el contenido).
  if (narrow) {
    return (
      <>
        <button type="button" onClick={() => setOpen((o) => !o)} aria-label="Abrir el asistente Momo" aria-expanded={open}
          className={cn('fixed bottom-[88px] right-3 z-40 flex h-14 w-14 items-center justify-center rounded-full border-2 border-white bg-brand-100 shadow-pop', blink && 'momo-blink')}>
          <Mascot className="h-11 w-11" title="" />
        </button>
        {open && <AssistantPanel onClose={() => setOpen(false)} onHideMascot={() => toggleHidden(true)} />}
      </>
    )
  }

  const hanging = pose === 'hang' && !still
  const left = still ? undefined : x
  const style = still
    ? { right: 12, bottom: 12 }
    : hanging
      ? { left, top: HANG_TOP, transition: 'top 400ms ease' }
      : { left, top: `calc(100dvh - ${H + 10}px)`, transition: `left ${moveMs}ms linear, top 400ms ease` }

  return (
    <>
      <div className="pointer-events-none fixed z-40" style={{ width: W, height: H, ...style }}>
        {bubble && !open && (
          <button type="button" onClick={() => setOpen(true)}
            className={cn('momo-pop pointer-events-auto absolute w-56 rounded-2xl border border-brand-200 bg-white px-3 py-2 text-left text-xs text-ink shadow-card',
              hanging ? 'top-full mt-1' : 'bottom-full mb-1', x > window.innerWidth / 2 || still ? 'right-0' : 'left-0')}>
            {bubble}
            <span className="mt-1 block font-semibold text-brand-700">Toca para hablar conmigo</span>
          </button>
        )}
        <button type="button" onClick={() => setOpen((o) => !o)} aria-label="Abrir el asistente Momo" aria-expanded={open}
          className="pointer-events-auto block h-full w-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400">
          <div ref={svgRef} className={cn('h-full w-full', hanging && 'momo-swing')} style={{ transform: `scaleX(${facing})` }}>
            <div className={cn('h-full w-full',
              pose === 'walk' && !still ? 'momo-walk' : hanging ? 'momo-hang' : pose === 'wave' ? 'momo-wave momo-idle' : 'momo-idle',
              blink && 'momo-blink')}>
              <Mascot variant="full" className="h-full w-full drop-shadow-md" title="" />
            </div>
          </div>
        </button>
      </div>
      {open && <AssistantPanel onClose={() => setOpen(false)} onHideMascot={() => toggleHidden(true)} />}
    </>
  )
}
