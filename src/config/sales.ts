/** Canales por los que llega una conversación. Marketplace se registra en modo copiloto (sin API de Meta). */
export const CHANNELS = {
  marketplace: { label: 'Marketplace', dot: 'bg-[#1877F2]' },
  messenger: { label: 'Messenger', dot: 'bg-[#0084FF]' },
  whatsapp: { label: 'WhatsApp', dot: 'bg-[#25D366]' },
  instagram: { label: 'Instagram', dot: 'bg-[#E1306C]' },
  tiktok: { label: 'TikTok', dot: 'bg-ink' },
  web: { label: 'Sitio web', dot: 'bg-accent' },
  telefono: { label: 'Teléfono', dot: 'bg-muted' },
  presencial: { label: 'En tienda', dot: 'bg-brand-600' },
  otro: { label: 'Otro', dot: 'bg-line' },
} as const

export type Channel = keyof typeof CHANNELS
export const CHANNEL_IDS = Object.keys(CHANNELS) as Channel[]
export const isChannel = (v: unknown): v is Channel => typeof v === 'string' && v in CHANNELS

/** Pasos de una venta. Pagado y despachado cuentan como venta ganada. */
export const STEPS = [
  { id: 'pregunta', label: 'Pregunta' },
  { id: 'cotizado', label: 'Cotizado' },
  { id: 'pagado', label: 'Pagado' },
  { id: 'despachado', label: 'Despachado' },
] as const

export type Step = (typeof STEPS)[number]['id']
export const isStep = (v: unknown): v is Step => STEPS.some((s) => s.id === v)
export const WON_STEPS: Step[] = ['pagado', 'despachado']

export type SaleStatus = 'open' | 'won' | 'lost'

export interface SaleSummary {
  step: Step
  status: SaleStatus
  design: boolean
}

export type Tone = 'neutral' | 'brand' | 'success' | 'accent' | 'danger'

/** Etiqueta de la venta en la bandeja ("Cotizada", "Área de Diseño"…). */
export function saleLabel(sale: SaleSummary | null): { label: string; tone: Tone } {
  if (!sale) return { label: 'Consulta', tone: 'neutral' }
  if (sale.status === 'lost') return { label: 'Perdida', tone: 'danger' }
  if (sale.design && sale.status === 'open') return { label: 'Área de Diseño', tone: 'accent' }
  if (sale.step === 'despachado') return { label: 'Despachada', tone: 'success' }
  if (sale.step === 'pagado') return { label: 'Pagada', tone: 'success' }
  if (sale.step === 'cotizado') return { label: 'Cotizada', tone: 'brand' }
  return { label: 'Consulta', tone: 'neutral' }
}

export const ROLE_LABELS = { owner: 'Dueño', admin: 'Administrador', agent: 'Vendedor', viewer: 'Solo lectura' } as const
export type Role = keyof typeof ROLE_LABELS
export const ROLES = Object.keys(ROLE_LABELS) as Role[]
export const isRole = (v: unknown): v is Role => typeof v === 'string' && v in ROLE_LABELS
