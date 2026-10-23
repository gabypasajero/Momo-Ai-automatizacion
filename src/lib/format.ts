const TZ = 'America/Santiago'

export const formatClp = (value: number) => '$' + Math.round(value).toLocaleString('es-CL')

export const formatNumber = (value: number) => value.toLocaleString('es-CL')

export const formatPercent = (value: number) => `${Math.round(value)}%`

const TIME = new Intl.DateTimeFormat('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TZ })
const SHORT_DATE = new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short', timeZone: TZ })
const LONG_DATE = new Intl.DateTimeFormat('es-CL', { weekday: 'long', day: 'numeric', month: 'long', timeZone: TZ })
const DATE_TIME = new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TZ })

export const formatTime = (iso: string) => TIME.format(new Date(iso))
export const formatShortDate = (iso: string) => SHORT_DATE.format(new Date(iso)).replace('.', '')
export const formatDateTime = (iso: string) => DATE_TIME.format(new Date(iso)).replace('.', '')

/** "Jueves 23 de octubre" */
export function formatToday(date = new Date()) {
  const text = LONG_DATE.format(date).replace(',', '')
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** "hace 5 min", "hace 2 h", "ayer", "12 oct" */
export function timeAgo(iso: string | null | undefined, now = Date.now()) {
  if (!iso) return ''
  const minutes = Math.floor((now - new Date(iso).getTime()) / 60000)
  if (minutes < 1) return 'ahora'
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours} h`
  if (hours < 48) return 'ayer'
  return formatShortDate(iso)
}

/** Saludo según la hora de Chile. */
export function greeting(date = new Date()) {
  const hour = Number(new Intl.DateTimeFormat('es-CL', { hour: 'numeric', hour12: false, timeZone: TZ }).format(date))
  if (hour < 12) return 'Buenos días'
  if (hour < 20) return 'Buenas tardes'
  return 'Buenas noches'
}

export const initials = (text: string) =>
  text.split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('') || 'M'

/** Primer nombre para saludar. */
export const firstName = (text: string) => text.split(/[\s@]+/)[0] ?? text

/** Teléfono chileno para enlaces de WhatsApp: solo dígitos. */
export const phoneDigits = (phone: string) => phone.replace(/\D/g, '')
