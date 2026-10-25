/**
 * Diseñador de muebles personalizados de De Todito Outlet (adaptado de detoditooutlet.cl/disenador.js).
 * Medidas reales en cm (ancho × alto; el alto incluye 5 cm de zócalo). Cuerpo siempre en melamina blanca;
 * la foto o el nombre del cliente va en los frentes, como el vinilo ploteado.
 */

interface Panel { x: number; y: number; w: number; h: number; tipo: 'puerta' | 'cajon' | 'hueco' | 'cubierta'; col?: number; cols?: number; repisas?: number }
interface Pos { x: number; y: number; w: number }
export interface Modelo { id: string; etiqueta: string; prefijo: string; w: number; h: number; baranda?: number; nombre: Pos; paneles: () => Panel[] }

function grilla(x: number, y: number, w: number, h: number, cols: number, filas: number, tipo: Panel['tipo']) {
  const out: Panel[] = []
  for (let f = 0; f < filas; f++) for (let c = 0; c < cols; c++) out.push({ x: x + (c * w) / cols, y: y + (f * h) / filas, w: w / cols, h: h / filas, tipo, col: c, cols })
  return out
}

const CLOSET: Pos = { x: 0.5, y: 0.3, w: 0.86 }
const COMODA: Pos = { x: 0.5, y: 0.5, w: 0.86 }

export const MODELOS: Modelo[] = [
  { id: 'closet2', etiqueta: 'Clóset 2 puertas', prefijo: 'Clóset 2 puertas 4 cajones', w: 80, h: 170, nombre: CLOSET, paneles: () => [...grilla(0, 0, 80, 110, 2, 1, 'puerta'), ...grilla(0, 110, 80, 55, 2, 2, 'cajon')] },
  { id: 'closet3', etiqueta: 'Clóset 3 puertas', prefijo: 'Clóset 3 puertas 4 cajones', w: 113, h: 170, nombre: CLOSET, paneles: () => [...grilla(0, 0, 113, 110, 3, 1, 'puerta'), ...grilla(0, 110, 113, 55, 2, 2, 'cajon')] },
  { id: 'closet38', etiqueta: 'Clóset 3 puertas 8 cajones', prefijo: 'Clóset 3 puertas 8 cajones', w: 113, h: 170, nombre: CLOSET, paneles: () => [...grilla(0, 0, 113, 95, 3, 1, 'puerta'), ...grilla(0, 95, 113, 70, 4, 2, 'cajon')] },
  { id: 'closet4', etiqueta: 'Clóset 4 puertas', prefijo: 'Clóset 4 puertas', w: 150, h: 170, nombre: CLOSET, paneles: () => [...grilla(0, 0, 150, 110, 4, 1, 'puerta'), ...grilla(0, 110, 150, 55, 4, 1, 'cajon')] },
  { id: 'closetxl', etiqueta: 'Clóset XL 5 puertas', prefijo: 'Clóset XL 5 puertas', w: 190, h: 170, nombre: CLOSET, paneles: () => [...grilla(0, 0, 190, 110, 5, 1, 'puerta'), ...grilla(0, 110, 190, 55, 4, 1, 'cajon')] },
  { id: 'escritorio', etiqueta: 'Clóset escritorio', prefijo: 'Clóset escritorio', w: 130, h: 170, nombre: { x: 0.19, y: 0.35, w: 0.32 },
    paneles: () => [{ x: 0, y: 0, w: 48, h: 165, tipo: 'puerta', col: 0, cols: 1 }, { x: 48, y: 0, w: 82, h: 88, tipo: 'hueco', repisas: 2 },
      { x: 48, y: 88, w: 82, h: 4, tipo: 'cubierta' }, { x: 48, y: 92, w: 55, h: 73, tipo: 'hueco', repisas: 0 }, ...grilla(103, 92, 27, 73, 1, 3, 'cajon')] },
  { id: 'velador', etiqueta: 'Velador 3 cajones (comodín)', prefijo: 'Velador 3 cajones', w: 37, h: 70, nombre: { x: 0.5, y: 0.5, w: 0.9 }, paneles: () => grilla(0, 0, 37, 65, 1, 3, 'cajon') },
  { id: 'comoda4', etiqueta: 'Cómoda 4 cajones', prefijo: 'Cómoda 4 cajones', w: 70, h: 78, nombre: COMODA, paneles: () => grilla(0, 0, 70, 73, 1, 4, 'cajon') },
  { id: 'comoda7', etiqueta: 'Cómoda 7 cajones', prefijo: 'Cómoda 7 cajones', w: 70, h: 113, nombre: { x: 0.5, y: 0.6, w: 0.86 }, paneles: () => [...grilla(0, 0, 70, 20, 3, 1, 'cajon'), ...grilla(0, 20, 70, 88, 1, 4, 'cajon')] },
  { id: 'comoda13', etiqueta: 'Cómoda 13 cajones', prefijo: 'Cómoda 13 cajones', w: 100, h: 105, nombre: { x: 0.5, y: 0.55, w: 0.86 }, paneles: () => [...grilla(0, 0, 100, 20, 3, 1, 'cajon'), ...grilla(0, 20, 100, 80, 2, 5, 'cajon')] },
  { id: 'mudador', etiqueta: 'Cómoda con mudador', prefijo: 'Cómoda con mudador', w: 80, h: 90, baranda: 12, nombre: COMODA, paneles: () => grilla(0, 0, 80, 85, 1, 4, 'cajon') },
]
export const MODELO_IDS = MODELOS.map((m) => m.id) as [string, ...string[]]

export const LETRAS = [
  { id: 'redonda', nombre: 'Redonda', css: '700 1px Fredoka, Nunito, sans-serif' },
  { id: 'manuscrita', nombre: 'Manuscrita', css: '400 1px Pacifico, cursive' },
  { id: 'comic', nombre: 'Cómic', css: '400 1px Bangers, Impact, sans-serif' },
] as const
export const TINTAS = { blanco: '#FFFFFF', vino: '#A8325E', azul: '#2B6CB0', amarillo: '#F2B705', negro: '#3A2A33' } as const

/** Lo que Momo decide al crear un diseño. La foto la pone el chat (la del cliente), no la IA. */
export interface DesignSpec {
  modelo: string
  nombre?: string
  letra?: (typeof LETRAS)[number]['id']
  tinta?: keyof typeof TINTAS
  conFoto: boolean
  precio?: number | null
}

const BLANCO = '#F4F1EC'

/** Dibuja la vista referencial (900 × 1100) igual que el diseñador de la página. */
export function dibujarDiseno(ctx: CanvasRenderingContext2D, spec: DesignSpec, img: CanvasImageSource & { width: number; height: number } | null) {
  const m = MODELOS.find((x) => x.id === spec.modelo) ?? MODELOS[0]!
  const W = ctx.canvas.width, H = ctx.canvas.height
  ctx.clearRect(0, 0, W, H)
  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, '#FFF8F6'); bg.addColorStop(1, '#F3E3E8')
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)
  const extra = m.baranda ?? 0
  const esc = Math.min((W * 0.84) / m.w, (H * 0.78) / (m.h + extra + 4))
  const fw = m.w * esc, fh = m.h * esc, ox = (W - fw) / 2, oy = (H - fh + extra * esc) / 2 - 10
  const borde = Math.min(3 * esc, fw * 0.04), zocalo = 5 * esc
  ctx.fillStyle = 'rgba(58,42,51,0.12)'
  ctx.beginPath(); ctx.ellipse(W / 2, oy + fh + 6, fw * 0.6, 14, 0, 0, Math.PI * 2); ctx.fill()
  if (extra) {
    ctx.fillStyle = BLANCO; ctx.fillRect(ox, oy - extra * esc, fw, extra * esc)
    ctx.fillStyle = 'rgba(0,0,0,0.06)'; ctx.fillRect(ox + 3 * esc, oy - extra * esc + 3 * esc, fw - 6 * esc, extra * esc - 3 * esc)
    ctx.strokeStyle = 'rgba(40,30,35,0.25)'; ctx.lineWidth = 2; ctx.strokeRect(ox + 1, oy - extra * esc + 1, fw - 2, extra * esc)
  }
  ctx.fillStyle = BLANCO; ctx.fillRect(ox, oy, fw, fh)
  const fx = ox + borde, fy = oy + borde, fW = fw - borde * 2, fH = fh - borde - zocalo
  ctx.save()
  ctx.beginPath(); ctx.rect(fx, fy, fW, fH); ctx.clip()
  if (img) {
    const r = Math.max(fW / img.width, fH / img.height)
    ctx.drawImage(img, fx + (fW - img.width * r) / 2, fy + (fH - img.height * r) / 2, img.width * r, img.height * r)
  }
  if (spec.nombre) {
    const letra = LETRAS.find((l) => l.id === spec.letra) ?? LETRAS[0]
    const tinta = TINTAS[spec.tinta ?? (img ? 'blanco' : 'vino')] ?? TINTAS.blanco
    const pos = m.nombre
    let tam = fW * Math.min(0.16, pos.w * 0.4)
    ctx.font = letra.css.replace('1px', `${tam}px`)
    while (ctx.measureText(spec.nombre).width > fW * pos.w && tam > 10) { tam -= 2; ctx.font = letra.css.replace('1px', `${tam}px`) }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(3, tam * 0.12)
    ctx.strokeStyle = tinta === '#FFFFFF' ? 'rgba(58,42,51,0.55)' : 'rgba(255,255,255,0.85)'
    const tx = fx + fW * pos.x, ty = fy + fH * pos.y
    ctx.strokeText(spec.nombre, tx, ty)
    ctx.fillStyle = tinta; ctx.fillText(spec.nombre, tx, ty)
  }
  ctx.restore()
  const sx = fW / m.w, sy = fH / (m.h - 5)
  for (const p of m.paneles()) {
    const px = fx + p.x * sx, py = fy + p.y * sy, pw = p.w * sx, ph = p.h * sy
    if (p.tipo === 'hueco' || p.tipo === 'cubierta') {
      ctx.fillStyle = p.tipo === 'cubierta' ? BLANCO : '#E6E0D8'
      ctx.fillRect(px, py, pw, ph)
      if (p.tipo === 'hueco') {
        const sombra = ctx.createLinearGradient(px, py, px, py + ph * 0.25)
        sombra.addColorStop(0, 'rgba(0,0,0,0.16)'); sombra.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = sombra; ctx.fillRect(px, py, pw, ph)
        for (let k = 1; k <= (p.repisas ?? 0); k++) { ctx.fillStyle = BLANCO; ctx.fillRect(px, py + (ph * k) / ((p.repisas ?? 0) + 1) - esc, pw, 2 * esc) }
      }
      ctx.strokeStyle = 'rgba(40,30,35,0.35)'; ctx.lineWidth = 2; ctx.strokeRect(px + 1, py + 1, pw - 2, ph - 2)
      continue
    }
    ctx.strokeStyle = 'rgba(40,30,35,0.55)'; ctx.lineWidth = 2; ctx.strokeRect(px + 1, py + 1, pw - 2, ph - 2)
    ctx.fillStyle = '#D9D4CF'
    if (p.tipo === 'puerta') {
      const cols = p.cols ?? 1, col = p.col ?? 0
      let hx = col < cols / 2 ? px + pw - (10 * esc) / 2.2 : px + (6 * esc) / 2.2
      if (cols % 2 === 1 && col === (cols - 1) / 2) hx = px + (6 * esc) / 2.2
      if (cols === 1) hx = px + pw - (10 * esc) / 2.2
      ctx.fillRect(hx, py + ph * 0.45, (3 * esc) / 2, ph * 0.12)
    } else {
      ctx.fillRect(px + pw * 0.38, py + ph * 0.42, pw * 0.24, Math.max(3, ph * 0.1))
    }
  }
  ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(ox, oy + fh - zocalo, fw, zocalo)
  ctx.fillStyle = 'rgba(58,42,51,0.6)'; ctx.font = '600 22px Nunito, sans-serif'; ctx.textAlign = 'center'
  ctx.fillText(`${m.etiqueta} · Vista referencial · De Todito Outlet`, W / 2, H - 18)
}
