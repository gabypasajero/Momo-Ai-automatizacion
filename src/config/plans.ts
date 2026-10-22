import type { PlanId } from '@/lib/data/types'

export interface Plan {
  id: PlanId
  name: string
  description: string
  /** Precio mensual en CLP sin IVA; null = cotización a medida. */
  priceClp: number | null
  highlighted?: boolean
  limits: { channels: number | null; users: number | null; aiConversations: number | null }
  features: string[]
}

/** Fuente única de planes: la usarán la página de precios, la facturación y los límites del backend. */
export const PLANS: Plan[] = [
  {
    id: 'emprende', name: 'Emprende', description: 'Para quien parte vendiendo por Facebook o WhatsApp', priceClp: 49990,
    limits: { channels: 1, users: 2, aiConversations: 500 },
    features: ['1 canal', '2 usuarios', '500 conversaciones IA/mes', 'Embudo Kanban'],
  },
  {
    id: 'pyme', name: 'Pyme', description: 'El más elegido por tiendas y servicios', priceClp: 149990, highlighted: true,
    limits: { channels: 3, users: 5, aiConversations: 2000 },
    features: ['3 canales (Messenger, WhatsApp, Instagram)', '5 usuarios', '2.000 conversaciones IA/mes', 'CRM + campañas', 'Analítica completa'],
  },
  {
    id: 'empresa', name: 'Empresa', description: 'Equipos de venta con varios embudos', priceClp: 299990,
    limits: { channels: null, users: 15, aiConversations: 8000 },
    features: ['Canales ilimitados + TikTok', '15 usuarios', '8.000 conversaciones IA/mes', 'Workflows y API', 'Soporte prioritario'],
  },
  {
    id: 'corporativo', name: 'Corporativo', description: 'Multi-marca, agencias y marca blanca', priceClp: null,
    limits: { channels: null, users: null, aiConversations: null },
    features: ['Todo ilimitado', 'Marca blanca', 'SLA y ejecutivo dedicado', 'Integraciones a medida'],
  },
]

export const SETUP_FEE_CLP = 150000

export const ADD_ONS = { aiConversationsPack: { amount: 1000, priceClp: 29990 }, extraUserClp: 9990 }
