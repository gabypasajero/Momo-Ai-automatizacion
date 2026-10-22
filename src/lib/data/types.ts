/**
 * Modelo de dominio compartido entre la UI y el backend.
 * Estos tipos reflejan las tablas que tendrá Supabase (ver docs/arquitectura.md).
 */

export type ChannelType = 'whatsapp' | 'instagram' | 'messenger' | 'tiktok'

export type MessageAuthor = 'client' | 'ai' | 'human'

export type TicketStatus = 'open' | 'won' | 'lost'

export interface Organization {
  id: string
  name: string
  plan: PlanId
}

export interface ChannelAccount {
  id: string
  type: ChannelType
  name: string
  handle: string
  /** Conectado vía API oficial (WhatsApp Cloud API / Graph API). */
  official: boolean
  pipelineIds: string[]
}

export interface PipelineStage {
  id: string
  name: string
  emoji: string
  /** Clase Tailwind del borde superior de la columna. */
  tone: string
}

export interface Pipeline {
  id: string
  name: string
  stages: PipelineStage[]
}

export interface Ticket {
  id: string
  pipelineId: string
  stageId: string
  contactName: string
  channel: ChannelType
  aiHandled: boolean
  lastMessage: string
  lastMessageAt: string
  /** Monto en pesos chilenos (enteros). */
  valueClp: number
  status: TicketStatus
}

export interface Message {
  id: string
  author: MessageAuthor
  text: string
  sentAt: string
}

export interface Conversation {
  id: string
  contactName: string
  channel: ChannelType
  aiEnabled: boolean
  unread: boolean
  lastMessageAt: string
  messages: Message[]
}

export interface Contact {
  id: string
  name: string
  phone: string | null
  channel: ChannelType
  tag: string
  ownerName: string | null
}

export interface Assistant {
  id: string
  name: string
  emoji: string
  pipelineName: string
  scenarioCoverage: number
}

export interface KpiValue {
  label: string
  value: string
  delta: string
}

export interface AnalyticsSummary {
  conversationKpis: KpiValue[]
  ticketKpis: KpiValue[]
  aiCoverage: {
    percent: number
    messages: { ai: number; human: number }
    conversations: { aiOnly: number; mixed: number; humanOnly: number }
  }
  /** Matriz [día][hora] con la cantidad de mensajes recibidos. */
  heatmap: number[][]
  ticketFlow: { label: string; count: number; color: string }[]
  resolution: { aiPercent: number; humanPercent: number }
}

export type PlanId = 'emprende' | 'pyme' | 'empresa' | 'corporativo'

export interface Product {
  id: string
  name: string
  category: string | null
  description: string | null
  dimensions: string | null
  priceClp: number
  salePriceClp: number | null
  imageUrl: string | null
  sourceUrl: string | null
  customizable: boolean
}

export interface KnowledgeEntry {
  id: string
  title: string
  content: string
}
