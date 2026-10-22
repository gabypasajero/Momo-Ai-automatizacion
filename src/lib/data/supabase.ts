import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { formatNumber } from '@/lib/format'
import type { Repository } from './repository'
import type {
  AnalyticsSummary, Assistant, ChannelAccount, ChannelType, Contact, Conversation, KnowledgeEntry,
  Message, Organization, Pipeline, Product, Ticket,
} from './types'

/**
 * Implementación del repositorio sobre el esquema `momo` de Supabase.
 * Las políticas RLS limitan cada consulta a las empresas del usuario; además
 * filtramos por organización para que un usuario con varias empresas vea solo la activa.
 */

// Sin tipos generados del esquema todavía: las filas se tipan a mano al mapearlas.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MomoClient = SupabaseClient<any, 'momo', 'momo'>

const TIME = new Intl.DateTimeFormat('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Santiago' })
const hhmm = (iso: string | null | undefined) => (iso ? TIME.format(new Date(iso)) : '')

const STAGE_TONES: Record<string, string> = {
  new: 'border-t-muted', human: 'border-t-danger', standard: 'border-t-brand-500', custom: 'border-t-accent', quote: 'border-t-warning-chart',
}

type MessageRow = { id: string; author: Message['author']; body: string | null; sent_at: string }

function lastMessage(messages: MessageRow[] | null | undefined) {
  return [...(messages ?? [])].sort((a, b) => a.sent_at.localeCompare(b.sent_at)).at(-1)
}

export class SupabaseRepository implements Repository {
  constructor(private readonly db: MomoClient, private readonly organization: Organization) {}

  /**
   * Empresa activa del usuario. Con varias membresías, prioriza donde es dueño,
   * luego administrador, y desempata por antigüedad (por ahora no hay selector).
   */
  static async forCurrentUser(db: MomoClient, userId: string): Promise<SupabaseRepository | null> {
    const { data, error } = await db
      .from('members')
      .select('role, created_at, organization:organizations(id, name, plan)')
      .eq('user_id', userId) // RLS deja ver a todo el equipo; aquí solo interesan las propias
    if (error) throw error
    const PRIORITY: Record<string, number> = { owner: 0, admin: 1, agent: 2, viewer: 3 }
    const [first] = [...(data ?? [])].sort((a, b) =>
      (PRIORITY[a.role] ?? 9) - (PRIORITY[b.role] ?? 9) || a.created_at.localeCompare(b.created_at))
    const org = first?.organization as unknown as Organization | undefined
    return org ? new SupabaseRepository(db, org) : null
  }

  private get orgId() {
    return this.organization.id
  }

  async getOrganization() {
    return this.organization
  }

  async getPipelines(): Promise<Pipeline[]> {
    const { data, error } = await this.db
      .from('pipelines')
      .select('id, name, stages:pipeline_stages(id, key, name, emoji, tone, position)')
      .eq('organization_id', this.orgId)
      .order('position')
    if (error) throw error
    return (data ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      stages: [...(p.stages ?? [])]
        .sort((a, b) => a.position - b.position)
        .map((s) => ({ id: s.id, name: s.name, emoji: s.emoji ?? '', tone: s.tone ?? STAGE_TONES[s.key] ?? 'border-t-line' })),
    }))
  }

  async getTickets(pipelineId: string): Promise<Ticket[]> {
    const { data, error } = await this.db
      .from('tickets')
      .select(`id, pipeline_id, stage_id, value_clp, status, ai_handled, updated_at,
        contact:contacts(name),
        conversation:conversations(last_message_at, channel:channel_accounts(type), messages(id, author, body, sent_at))`)
      .eq('organization_id', this.orgId)
      .eq('pipeline_id', pipelineId)
      .order('updated_at', { ascending: false })
      .limit(500)
    if (error) throw error
    return (data ?? []).map((t) => {
      const conv = t.conversation as unknown as { last_message_at: string | null; channel: { type: ChannelType } | null; messages: MessageRow[] } | null
      const last = lastMessage(conv?.messages)
      return {
        id: t.id,
        pipelineId: t.pipeline_id,
        stageId: t.stage_id,
        contactName: (t.contact as unknown as { name: string } | null)?.name ?? 'Sin nombre',
        channel: conv?.channel?.type ?? 'messenger',
        aiHandled: t.ai_handled,
        lastMessage: last?.body ?? '',
        lastMessageAt: hhmm(conv?.last_message_at ?? t.updated_at),
        valueClp: Number(t.value_clp),
        status: t.status,
      }
    })
  }

  async getConversations(): Promise<Conversation[]> {
    const { data, error } = await this.db
      .from('conversations')
      .select('id, ai_enabled, unread_count, last_message_at, contact:contacts(name), channel:channel_accounts(type), messages(id, author, body, sent_at)')
      .eq('organization_id', this.orgId)
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .limit(100)
    if (error) throw error
    return (data ?? []).map((c) => ({
      id: c.id,
      contactName: (c.contact as unknown as { name: string } | null)?.name ?? 'Sin nombre',
      channel: (c.channel as unknown as { type: ChannelType } | null)?.type ?? 'messenger',
      aiEnabled: c.ai_enabled,
      unread: c.unread_count > 0,
      lastMessageAt: hhmm(c.last_message_at),
      messages: [...((c.messages as MessageRow[] | null) ?? [])]
        .sort((a, b) => a.sent_at.localeCompare(b.sent_at))
        .map((m) => ({ id: m.id, author: m.author, text: m.body ?? '', sentAt: hhmm(m.sent_at) })),
    }))
  }

  async getContacts(): Promise<{ items: Contact[]; total: number }> {
    const { data, error, count } = await this.db
      .from('contacts')
      .select('id, name, phone, tags, owner_user_id, identities:contact_identities(channel:channel_accounts(type))', { count: 'exact' })
      .eq('organization_id', this.orgId)
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) throw error
    return {
      total: count ?? 0,
      items: (data ?? []).map((c) => {
        const identities = c.identities as unknown as { channel: { type: ChannelType } | null }[] | null
        return {
          id: c.id,
          name: c.name,
          phone: c.phone,
          channel: identities?.[0]?.channel?.type ?? 'messenger',
          tag: c.tags?.[0] ?? 'Nuevo',
          ownerName: null,
        }
      }),
    }
  }

  async getAssistants(): Promise<Assistant[]> {
    const { data, error } = await this.db
      .from('ai_assistants')
      .select('id, name, emoji, pipeline:pipelines(name)')
      .eq('organization_id', this.orgId)
      .eq('active', true)
      .order('created_at')
    if (error) throw error
    return (data ?? []).map((a) => ({
      id: a.id,
      name: a.name,
      emoji: a.emoji ?? '🤖',
      pipelineName: (a.pipeline as unknown as { name: string } | null)?.name ?? 'Sin embudo',
      scenarioCoverage: 100,
    }))
  }

  async getChannelAccounts(): Promise<ChannelAccount[]> {
    const [{ data, error }, pipelines] = await Promise.all([
      this.db.from('channel_accounts').select('id, type, name, handle, status').eq('organization_id', this.orgId).order('created_at'),
      this.getPipelines(),
    ])
    if (error) throw error
    return (data ?? []).map((a) => ({
      id: a.id,
      type: a.type,
      name: a.name,
      handle: a.handle ?? '',
      official: a.status === 'active',
      // Por ahora cada canal alimenta todos los embudos de la empresa.
      pipelineIds: pipelines.map((p) => p.id),
    }))
  }

  async getProducts(query?: string): Promise<{ items: Product[]; total: number }> {
    let q = this.db
      .from('products')
      .select('id, name, category, description, dimensions, price_clp, sale_price_clp, image_url, source_url, customizable', { count: 'exact' })
      .eq('organization_id', this.orgId)
      .eq('active', true)
    if (query?.trim()) q = q.textSearch('search', query.trim(), { type: 'websearch', config: 'spanish' })
    const { data, error, count } = await q.order('name').limit(60)
    if (error) throw error
    return {
      total: count ?? 0,
      items: (data ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        description: p.description,
        dimensions: p.dimensions,
        priceClp: p.price_clp,
        salePriceClp: p.sale_price_clp,
        imageUrl: p.image_url,
        sourceUrl: p.source_url,
        customizable: p.customizable,
      })),
    }
  }

  async getKnowledge(): Promise<KnowledgeEntry[]> {
    const { data, error } = await this.db
      .from('knowledge_entries')
      .select('id, title, content')
      .eq('organization_id', this.orgId)
      .order('created_at')
    if (error) throw error
    return data ?? []
  }

  async addKnowledgeEntry({ title, content }: { title: string; content: string }): Promise<KnowledgeEntry> {
    // Se asocia al asistente activo de la empresa (si existe); RLS exige rol owner/admin/agent.
    const { data: assistant } = await this.db
      .from('ai_assistants').select('id').eq('organization_id', this.orgId).eq('active', true).order('created_at').limit(1).maybeSingle()
    const { data, error } = await this.db
      .from('knowledge_entries')
      .insert({ organization_id: this.orgId, assistant_id: assistant?.id ?? null, title, content })
      .select('id, title, content')
      .single()
    if (error) throw error
    return data
  }

  /** Métricas de los últimos 30 días, calculadas a partir de mensajes, conversaciones y tickets. */
  async getAnalyticsSummary(): Promise<AnalyticsSummary> {
    const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
    const [messages, conversations, contacts, tickets, stages] = await Promise.all([
      this.db.from('messages').select('author, sent_at, conversation_id').eq('organization_id', this.orgId).gte('sent_at', since).limit(20000),
      this.db.from('conversations').select('id', { count: 'exact', head: true }).eq('organization_id', this.orgId).gte('last_message_at', since),
      this.db.from('contacts').select('id', { count: 'exact', head: true }).eq('organization_id', this.orgId).gte('created_at', since),
      this.db.from('tickets').select('status, ai_handled, stage_id').eq('organization_id', this.orgId).gte('created_at', since),
      this.db.from('pipeline_stages').select('id, name, key').eq('organization_id', this.orgId),
    ])
    for (const r of [messages, conversations, contacts, tickets, stages]) if (r.error) throw r.error

    const msgs = messages.data ?? []
    const ai = msgs.filter((m) => m.author === 'ai').length
    const human = msgs.filter((m) => m.author === 'human').length
    const received = msgs.filter((m) => m.author === 'client').length

    // Clasificación de conversaciones según quién respondió.
    const byConv = new Map<string, { ai: boolean; human: boolean }>()
    for (const m of msgs) {
      const c = byConv.get(m.conversation_id) ?? { ai: false, human: false }
      if (m.author === 'ai') c.ai = true
      if (m.author === 'human') c.human = true
      byConv.set(m.conversation_id, c)
    }
    const convs = [...byConv.values()]

    // Mapa de calor: lunes = 0, en hora de Chile.
    const heatmap = Array.from({ length: 7 }, () => Array(24).fill(0) as number[])
    const parts = new Intl.DateTimeFormat('en-US', { weekday: 'short', hour: 'numeric', hour12: false, timeZone: 'America/Santiago' })
    const DAY = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 } as Record<string, number>
    for (const m of msgs) {
      if (m.author !== 'client') continue
      const p = Object.fromEntries(parts.formatToParts(new Date(m.sent_at)).map((x) => [x.type, x.value]))
      heatmap[DAY[p.weekday]][Number(p.hour) % 24] += 1
    }

    const t = tickets.data ?? []
    const resolved = t.filter((x) => x.status !== 'open')
    const won = t.filter((x) => x.status === 'won').length
    const resolvedByAi = resolved.filter((x) => x.ai_handled).length
    const pct = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0)
    const COLORS = ['rgb(var(--brand-500))', 'rgb(var(--danger))', 'rgb(var(--accent))', 'rgb(var(--warning-chart))', 'rgb(var(--success-chart))']
    const stageCount = new Map<string, number>()
    t.forEach((x) => stageCount.set(x.stage_id, (stageCount.get(x.stage_id) ?? 0) + 1))

    return {
      conversationKpis: [
        { label: 'Mensajes enviados IA', value: formatNumber(ai), delta: '' },
        { label: 'Mensajes recibidos', value: formatNumber(received), delta: '' },
        { label: 'Contactos creados', value: formatNumber(contacts.count ?? 0), delta: '' },
        { label: 'Contactos activos', value: formatNumber(byConv.size), delta: '' },
        { label: 'Conversaciones totales', value: formatNumber(conversations.count ?? 0), delta: '' },
      ],
      ticketKpis: [
        { label: 'Total de oportunidades', value: formatNumber(t.length), delta: '' },
        { label: 'Tickets creados', value: formatNumber(t.length), delta: '' },
        { label: 'Tickets resueltos', value: formatNumber(resolved.length), delta: '' },
        { label: 'Tasa de éxito', value: `${pct(won, t.length).toLocaleString('es-CL')}%`, delta: '' },
      ],
      aiCoverage: {
        percent: pct(ai, ai + human),
        messages: { ai, human },
        conversations: {
          aiOnly: convs.filter((c) => c.ai && !c.human).length,
          mixed: convs.filter((c) => c.ai && c.human).length,
          humanOnly: convs.filter((c) => !c.ai && c.human).length,
        },
      },
      heatmap,
      ticketFlow: (stages.data ?? [])
        .map((s, i) => ({ label: s.name, count: stageCount.get(s.id) ?? 0, color: COLORS[i % COLORS.length] }))
        .filter((f) => f.count > 0),
      resolution: { aiPercent: pct(resolvedByAi, resolved.length), humanPercent: resolved.length ? pct(resolved.length - resolvedByAi, resolved.length) : 0 },
    }
  }
}
