import type {
  AiUsage, AnalyticsSummary, Assistant, ChannelAccount, Contact, Conversation, KnowledgeEntry, Organization, Pipeline, Product, Ticket,
} from './types'

/**
 * Contrato de acceso a datos. La UI depende solo de esta interfaz,
 * así el paso de datos de prueba a Supabase no toca ninguna pantalla.
 */
export interface Repository {
  getOrganization(): Promise<Organization>
  getPipelines(): Promise<Pipeline[]>
  getTickets(pipelineId: string): Promise<Ticket[]>
  getConversations(): Promise<Conversation[]>
  getContacts(): Promise<{ items: Contact[]; total: number }>
  getAssistants(): Promise<Assistant[]>
  getChannelAccounts(): Promise<ChannelAccount[]>
  getAnalyticsSummary(): Promise<AnalyticsSummary>
  /** Catálogo; con `query` usa la búsqueda de texto en español. */
  getProducts(query?: string): Promise<{ items: Product[]; total: number }>
  getKnowledge(): Promise<KnowledgeEntry[]>
  /** Agrega una política o dato del negocio al conocimiento de la IA de la empresa activa. */
  addKnowledgeEntry(entry: { title: string; content: string }): Promise<KnowledgeEntry>
  /** Registra el consumo de IA de la empresa activa (costos y márgenes del panel de administración). */
  recordAiUsage(usage: AiUsage): Promise<void>
}
