import type {
  AnalyticsSummary, Assistant, ChannelAccount, Contact, Conversation, Organization, Pipeline, Ticket,
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
}
