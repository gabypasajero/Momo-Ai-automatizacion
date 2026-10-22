import type { CSSProperties } from 'react'
import { cn } from '@/lib/cn'

/**
 * Momo, la mascota de la app: un lemur de cola anillada estilizado (diseño propio,
 * basado en el animal real, no en ningún personaje existente).
 * Rasgos propios: pelaje taupe con antifaz crema, ojos ámbar, interior de orejas
 * rosado y cola con anillos frambuesa DTO.
 *
 * Las partes llevan clases `momo-*` para que el acompañante animado las mueva
 * (ojos que siguen al cursor, parpadeo, pasos y cola).
 *
 * - `variant="face"`: solo la cabeza (logo, avatares, firma de la IA).
 * - `variant="full"`: cuerpo completo (ingreso, acompañante, estados vacíos).
 */

const C = {
  fur: '#C9BBAF',
  furDark: '#8C7A70',
  cream: '#F6EEE6',
  line: '#3A2A33',
  ear: '#E7A9BC',
  eye: '#E3A431',
  nose: '#3A2A33',
  ring: '#A8325E',
}

const STROKE = { stroke: C.line, strokeWidth: 1.3, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const }

function Head() {
  return (
    <g className="momo-head">
      {/* Orejas grandes hacia arriba y afuera */}
      <path d="M37 31 C27 27 18 14 20 7 C28 7 39 17 43 27 Z" fill={C.fur} {...STROKE} />
      <path d="M36 27 C29 23 24 15 24 11 C29 12 36 18 39 25 Z" fill={C.ear} />
      <path d="M63 31 C73 27 82 14 80 7 C72 7 61 17 57 27 Z" fill={C.fur} {...STROKE} />
      <path d="M64 27 C71 23 76 15 76 11 C71 12 64 18 61 25 Z" fill={C.ear} />
      {/* Cabeza de lemur: frente ancha y hocico afinado */}
      <path d="M30 37 C30 25 40 20 50 20 C60 20 70 25 70 37 C70 47 60 56 50 58 C40 56 30 47 30 37 Z" fill={C.fur} {...STROKE} />
      {/* Antifaz claro (crema, no oscuro) */}
      <path d="M35 39 C35 31 43 28 50 32 C57 28 65 31 65 39 C65 47 57 52.5 50 54.5 C43 52.5 35 47 35 39 Z" fill={C.cream} />
      {/* Cejas */}
      <path d="M38.5 33.5 Q43 31 47 33.3" fill="none" stroke={C.furDark} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M61.5 33.5 Q57 31 53 33.3" fill="none" stroke={C.furDark} strokeWidth="1.4" strokeLinecap="round" />
      {/* Ojos ámbar; las pupilas se mueven con --momo-px / --momo-py */}
      <circle cx="43" cy="39.5" r="4.3" fill={C.eye} stroke={C.line} strokeWidth="1.1" />
      <circle cx="57" cy="39.5" r="4.3" fill={C.eye} stroke={C.line} strokeWidth="1.1" />
      <g className="momo-pupils">
        <circle cx="43" cy="39.5" r="2" fill={C.line} />
        <circle cx="57" cy="39.5" r="2" fill={C.line} />
        <circle cx="42.2" cy="38.6" r="0.8" fill="#fff" />
        <circle cx="56.2" cy="38.6" r="0.8" fill="#fff" />
      </g>
      {/* Párpados para parpadear */}
      <ellipse className="momo-lid" cx="43" cy="39.5" rx="4.6" ry="4.6" fill={C.fur} />
      <ellipse className="momo-lid" cx="57" cy="39.5" rx="4.6" ry="4.6" fill={C.fur} />
      {/* Nariz y boca */}
      <path d="M47.8 47 L52.2 47 L50 49.6 Z" fill={C.nose} />
      <path d="M47 51.3 Q50 53.4 53 51.3" fill="none" stroke={C.line} strokeWidth="1.1" strokeLinecap="round" />
    </g>
  )
}

function Body() {
  return (
    <g>
      {/* Cola larga con anillos frambuesa */}
      <g className="momo-tail">
        <path d="M60 100 C80 104 93 92 89 74 C86 61 79 56 83 44" fill="none" stroke={C.line} strokeWidth="8" strokeLinecap="round" />
        <path d="M60 100 C80 104 93 92 89 74 C86 61 79 56 83 44" fill="none" stroke={C.cream} strokeWidth="5.6" strokeLinecap="round" />
        <path d="M60 100 C80 104 93 92 89 74 C86 61 79 56 83 44" fill="none" stroke={C.ring} strokeWidth="5.6" strokeDasharray="5 5" />
      </g>
      {/* Piernas */}
      <g className="momo-leg-l">
        <path d="M45 102 L43 119" fill="none" stroke={C.line} strokeWidth="6.6" strokeLinecap="round" />
        <path d="M45 102 L43 119" fill="none" stroke={C.fur} strokeWidth="4.4" strokeLinecap="round" />
        <ellipse cx="41.5" cy="120.5" rx="4.6" ry="2.4" fill={C.fur} {...STROKE} />
      </g>
      <g className="momo-leg-r">
        <path d="M55 102 L57 119" fill="none" stroke={C.line} strokeWidth="6.6" strokeLinecap="round" />
        <path d="M55 102 L57 119" fill="none" stroke={C.fur} strokeWidth="4.4" strokeLinecap="round" />
        <ellipse cx="58.5" cy="120.5" rx="4.6" ry="2.4" fill={C.fur} {...STROKE} />
      </g>
      {/* Cuerpo esbelto y pecho crema */}
      <path d="M39 60 C35 74 35 95 41 103 C46 108 54 108 59 103 C65 95 65 74 61 60 C57 56 43 56 39 60 Z" fill={C.fur} {...STROKE} />
      <path d="M44 66 C42 78 43 94 47 100 C49 102 51 102 53 100 C57 94 58 78 56 66 C53 63 47 63 44 66 Z" fill={C.cream} />
      {/* Brazos */}
      <g className="momo-arm-l">
        <path d="M41 65 C35 74 35 85 38 92" fill="none" stroke={C.line} strokeWidth="6" strokeLinecap="round" />
        <path d="M41 65 C35 74 35 85 38 92" fill="none" stroke={C.fur} strokeWidth="3.8" strokeLinecap="round" />
      </g>
      <g className="momo-arm-r">
        <path d="M59 65 C65 74 65 85 62 92" fill="none" stroke={C.line} strokeWidth="6" strokeLinecap="round" />
        <path d="M59 65 C65 74 65 85 62 92" fill="none" stroke={C.fur} strokeWidth="3.8" strokeLinecap="round" />
      </g>
    </g>
  )
}

export function Mascot({ variant = 'face', className, title = 'Momo', style }: {
  variant?: 'face' | 'full'
  className?: string
  /** Texto para lectores de pantalla; usa "" si es decorativa. */
  title?: string
  style?: CSSProperties
}) {
  const decorative = title === ''
  const a11y = decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': title }
  if (variant === 'face') {
    return (
      <svg viewBox="16 4 68 56" className={cn('momo-svg shrink-0', className)} style={style} {...a11y}>
        <Head />
      </svg>
    )
  }
  return (
    <svg viewBox="14 2 84 124" className={cn('momo-svg shrink-0', className)} style={style} {...a11y}>
      <Body />
      <Head />
    </svg>
  )
}
