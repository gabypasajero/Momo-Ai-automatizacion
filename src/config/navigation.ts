/** Secciones del panel. Pocas y con nombres simples: el corazón es "Hoy" y "Conversaciones". */
export const NAV = [
  { id: 'hoy', label: 'Hoy', href: '/hoy' },
  { id: 'conversaciones', label: 'Conversaciones', short: 'Chats', href: '/conversaciones' },
  { id: 'clientes', label: 'Clientes', href: '/clientes' },
  { id: 'conocimiento', label: 'Lo que Momo sabe', href: '/conocimiento' },
  { id: 'resultados', label: 'Resultados', href: '/resultados' },
] as const

export type NavId = (typeof NAV)[number]['id'] | 'ajustes' | 'mas' | 'buscar'

export function activeSection(pathname: string): NavId | null {
  const first = pathname.split('/')[1] ?? ''
  const known = [...NAV.map((n) => n.id), 'ajustes', 'mas', 'buscar'] as string[]
  return known.includes(first) ? (first as NavId) : null
}
