import { cn } from '@/lib/cn'

/**
 * Momo, la mascota de la app: un lemur alado original (no basado en ningún personaje existente).
 * Rasgos propios: cara crema sin antifaz, mejillas rosadas, interior de orejas rosa DTO,
 * iris lila, alas pequeñas lila y cola con anillos frambuesa.
 *
 * - `variant="face"`: solo la cabeza (logo, avatares, burbuja de la IA).
 * - `variant="full"`: cuerpo completo con alas (ingreso, estados vacíos).
 */

const C = {
  fur: '#FBF3EA',
  furShade: '#EEDFCF',
  line: '#3A2A33',
  ear: '#E393AE',
  cheek: '#F2B8C9',
  iris: '#8E6CC9',
  wing: '#C9B6EC',
  wingVein: '#8E6CC9',
  tail: '#A8325E',
}

function Head() {
  return (
    <g>
      {/* Orejas: anchas y abiertas hacia los lados (silueta de lemur alado, no de conejo) */}
      <path d="M21 31 C11 32 2 25 2 13 C11 10 23 16 28 25 Z" fill={C.fur} stroke={C.line} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M20 28 C12 28 6 22 6 16 C12 15 20 19 24 25 Z" fill={C.ear} />
      <path d="M43 31 C53 32 62 25 62 13 C53 10 41 16 36 25 Z" fill={C.fur} stroke={C.line} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M44 28 C52 28 58 22 58 16 C52 15 44 19 40 25 Z" fill={C.ear} />
      {/* Cabeza */}
      <ellipse cx="32" cy="38" rx="17" ry="15.5" fill={C.fur} stroke={C.line} strokeWidth="1.6" />
      {/* Mechón en la frente */}
      <path d="M28 24 Q32 19 36 24 Q32 22.5 28 24 Z" fill={C.furShade} />
      {/* Mejillas */}
      <ellipse cx="21" cy="44" rx="3.6" ry="2.4" fill={C.cheek} />
      <ellipse cx="43" cy="44" rx="3.6" ry="2.4" fill={C.cheek} />
      {/* Ojos grandes con iris lila y brillo */}
      <circle cx="25" cy="37" r="5.6" fill="#fff" stroke={C.line} strokeWidth="1.3" />
      <circle cx="39" cy="37" r="5.6" fill="#fff" stroke={C.line} strokeWidth="1.3" />
      <circle cx="25.6" cy="37.6" r="3.6" fill={C.iris} />
      <circle cx="38.4" cy="37.6" r="3.6" fill={C.iris} />
      <circle cx="25.8" cy="38" r="1.9" fill={C.line} />
      <circle cx="38.2" cy="38" r="1.9" fill={C.line} />
      <circle cx="24.3" cy="36.1" r="1.1" fill="#fff" />
      <circle cx="36.9" cy="36.1" r="1.1" fill="#fff" />
      {/* Nariz de corazón y sonrisa */}
      <path d="M32 44.2 C30.6 42.8 29.6 43.9 30.4 44.9 L32 46.4 L33.6 44.9 C34.4 43.9 33.4 42.8 32 44.2 Z" fill={C.tail} />
      <path d="M29 48 Q32 50.6 35 48" fill="none" stroke={C.line} strokeWidth="1.3" strokeLinecap="round" />
    </g>
  )
}

function Body() {
  return (
    <g>
      {/* Cola en espiral con anillos frambuesa (detrás del cuerpo) */}
      <path d="M72 96 C92 100 106 88 102 74 C99 63 86 62 85 71 C84 77 92 78 93 72" fill="none" stroke={C.line} strokeWidth="8" strokeLinecap="round" />
      <path d="M72 96 C92 100 106 88 102 74 C99 63 86 62 85 71 C84 77 92 78 93 72" fill="none" stroke={C.fur} strokeWidth="5.4" strokeLinecap="round" />
      <path d="M72 96 C92 100 106 88 102 74 C99 63 86 62 85 71 C84 77 92 78 93 72" fill="none" stroke={C.tail} strokeWidth="5.4" strokeDasharray="4 5" />
      {/* Alas pequeñas lila con borde ondulado, desde los hombros */}
      <path d="M46 72 C36 60 22 56 10 60 C14 66 14 72 20 74 C22 78 28 80 32 79 C36 82 42 82 46 80 Z" fill={C.wing} stroke={C.line} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M45 74 L20 63 M45 77 L28 72" stroke={C.wingVein} strokeWidth="1" strokeLinecap="round" opacity="0.55" />
      <path d="M74 72 C84 60 98 56 110 60 C106 66 106 72 100 74 C98 78 92 80 88 79 C84 82 78 82 74 80 Z" fill={C.wing} stroke={C.line} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M75 74 L100 63 M75 77 L92 72" stroke={C.wingVein} strokeWidth="1" strokeLinecap="round" opacity="0.55" />
      {/* Cuerpo, pancita y manitos */}
      <ellipse cx="60" cy="84" rx="16" ry="17" fill={C.fur} stroke={C.line} strokeWidth="1.6" />
      <ellipse cx="60" cy="88" rx="9.5" ry="10.5" fill={C.furShade} />
      <ellipse cx="53.5" cy="80" rx="3.6" ry="3" fill={C.fur} stroke={C.line} strokeWidth="1.3" />
      <ellipse cx="66.5" cy="80" rx="3.6" ry="3" fill={C.fur} stroke={C.line} strokeWidth="1.3" />
      {/* Patitas */}
      <ellipse cx="52" cy="100" rx="5.5" ry="3.4" fill={C.fur} stroke={C.line} strokeWidth="1.4" />
      <ellipse cx="68" cy="100" rx="5.5" ry="3.4" fill={C.fur} stroke={C.line} strokeWidth="1.4" />
    </g>
  )
}

export function Mascot({ variant = 'face', className, title = 'Momo' }: {
  variant?: 'face' | 'full'
  className?: string
  /** Texto para lectores de pantalla; usa "" si es decorativa. */
  title?: string
}) {
  const decorative = title === ''
  if (variant === 'face') {
    return (
      <svg viewBox="0 8 64 48" className={cn('shrink-0', className)} role={decorative ? undefined : 'img'} aria-hidden={decorative || undefined} aria-label={decorative ? undefined : title}>
        <Head />
      </svg>
    )
  }
  return (
    <svg viewBox="0 12 120 96" className={cn('shrink-0', className)} role={decorative ? undefined : 'img'} aria-hidden={decorative || undefined} aria-label={decorative ? undefined : title}>
      <Body />
      <g transform="translate(28 14)">
        <Head />
      </g>
    </svg>
  )
}
