import {
  BarChart3, BookOpen, Bot, CalendarDays, Code2, Columns3, Contact, CreditCard, FileBarChart, FileText,
  FlaskConical, Headphones, Home, LayoutGrid, Lightbulb, ClipboardList, Mail, Megaphone, MessageCircle,
  Pencil, Puzzle, Settings, ShieldCheck, ShoppingBag, SlidersHorizontal, Smartphone, Tag, Ticket, Users,
  Workflow, type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  /** false = módulo en el roadmap; se muestra con la etiqueta "Pronto". */
  ready?: boolean
}

export interface ModuleNav extends NavItem {
  breadcrumb?: string[]
  submenu?: { group: string; items: NavItem[] }[]
}

const soon = (label: string, icon: LucideIcon): NavItem => ({ label, href: '#', icon, ready: false })

export const MODULES: ModuleNav[] = [
  { label: 'Inicio', href: '/inicio', icon: Home },
  { label: 'Embudo', href: '/embudo', icon: Columns3, breadcrumb: ['Embudo', 'Tickets'] },
  { label: 'Chat', href: '/chat', icon: MessageCircle },
  {
    label: 'Asistente', href: '/asistentes', icon: Bot, breadcrumb: ['Asistente', 'Asistentes'],
    submenu: [
      { group: 'Entrenar IA', items: [{ label: 'Asistentes', href: '/asistentes', icon: Bot }, { label: 'Conocimiento', href: '/asistentes/conocimiento', icon: BookOpen }] },
      { group: 'Probar IA', items: [soon('Playground', FlaskConical), soon('Evaluaciones', Pencil)] },
      { group: 'Librerías', items: [soon('Bloques', Puzzle), soon('Funciones', Code2)] },
      { group: 'Ajustes', items: [soon('Ajustes de IA', SlidersHorizontal)] },
    ],
  },
  {
    label: 'CRM', href: '/crm', icon: Contact, breadcrumb: ['CRM', 'Clientes'],
    submenu: [
      { group: 'Información', items: [{ label: 'Clientes', href: '/crm', icon: Users }, soon('Tickets', Ticket)] },
      { group: 'Seguimiento', items: [soon('Tareas', ClipboardList)] },
      { group: 'Ajustes', items: [soon('Campos', SlidersHorizontal), soon('Etiquetas', Tag)] },
    ],
  },
  {
    label: 'Canales', href: '/canales', icon: Smartphone,
    submenu: [
      { group: 'Principal', items: [{ label: 'Canales', href: '/canales', icon: Smartphone }, soon('Campañas', Megaphone), soon('Plantillas Mensajería', FileText), soon('Plantillas Email', Mail)] },
      { group: 'Extra', items: [soon('WhatsApp Flows', Workflow)] },
    ],
  },
  {
    label: 'Analítica', href: '/analitica', icon: BarChart3, breadcrumb: ['Analítica', 'Resumen'],
    submenu: [
      { group: '', items: [{ label: 'Resumen', href: '/analitica', icon: LayoutGrid }, soon('Conversaciones', MessageCircle), soon('Tickets', Ticket), soon('Insights', Lightbulb), soon('Reportes', FileBarChart)] },
    ],
  },
  { label: 'Servicio', href: '/servicio', icon: Headphones, ready: false },
  { label: 'Ecommerce', href: '/ecommerce', icon: ShoppingBag, ready: false },
  { label: 'Workflows', href: '/workflows', icon: Workflow, ready: false },
  { label: 'Agenda', href: '/agenda', icon: CalendarDays, ready: false },
  { label: 'Más', href: '/mas', icon: LayoutGrid, ready: false },
]

export const SETTINGS_MODULE: ModuleNav = {
  label: 'Ajustes', href: '/ajustes/facturacion', icon: Settings, breadcrumb: ['Ajustes', 'Plan y facturación'],
  submenu: [
    { group: 'Cuenta', items: [{ label: 'Plan y facturación', href: '/ajustes/facturacion', icon: CreditCard }, soon('Usuarios', Users), soon('Seguridad', ShieldCheck)] },
  ],
}

export const ALL_MODULES = [...MODULES, SETTINGS_MODULE]

/** Primer segmento de la ruta → módulo activo. */
export function findModule(pathname: string): ModuleNav | undefined {
  const segment = '/' + (pathname.split('/')[1] ?? '')
  return ALL_MODULES.find((m) => m.href === segment || m.href.startsWith(segment + '/'))
}
