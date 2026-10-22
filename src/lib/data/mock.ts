import type { Repository } from './repository'
import type { AnalyticsSummary, Assistant, ChannelAccount, Contact, Conversation, KnowledgeEntry, Pipeline, Product, Ticket } from './types'

/** Datos de prueba realistas en español y CLP. Se reemplazan por Supabase. */

const pipelines: Pipeline[] = [
  {
    id: 'pl_ventas',
    name: 'Ventas | Muebles y Hogar',
    stages: [
      { id: 'human', name: 'Asistencia humana', emoji: '🙋', tone: 'border-t-danger' },
      { id: 'standard', name: 'Asesoría muebles estándar', emoji: '🪑', tone: 'border-t-brand-500' },
      { id: 'kitchen', name: 'Proyecto cocina a medida', emoji: '🍳', tone: 'border-t-accent' },
      { id: 'quote', name: 'Revisión de cotización', emoji: '📄', tone: 'border-t-warning-chart' },
    ],
  },
]

const ticket = (t: Omit<Ticket, 'pipelineId' | 'status'> & Partial<Pick<Ticket, 'status'>>): Ticket => ({
  pipelineId: 'pl_ventas',
  status: 'open',
  ...t,
})

const tickets: Ticket[] = [
  ticket({ id: 't1', contactName: 'Priscilla Olivares', channel: 'whatsapp', stageId: 'human', aiHandled: false, lastMessage: 'Hola Priscilla, ya derivé tu caso para que te contacte un ejecutivo 🙏', lastMessageAt: '09:09', valueClp: 0 }),
  ticket({ id: 't2', contactName: 'Eduardo Pérez', channel: 'whatsapp', stageId: 'human', aiHandled: false, lastMessage: 'Mueble trato de repararlo el maestro pero se da no más', lastMessageAt: '08:35', valueClp: 0 }),
  ticket({ id: 't3', contactName: 'Daniel Fernández', channel: 'messenger', stageId: 'human', aiHandled: false, lastMessage: '📷 Imagen desde Marketplace', lastMessageAt: '07:39', valueClp: 0 }),
  ticket({ id: 't4', contactName: 'Karen Soto', channel: 'whatsapp', stageId: 'standard', aiHandled: true, lastMessage: '¿Tienen el rack de TV en color nogal?', lastMessageAt: '16:40', valueClp: 189990 }),
  ticket({ id: 't5', contactName: 'Armando Muebles', channel: 'whatsapp', stageId: 'standard', aiHandled: true, lastMessage: 'Confirmación de datos para coordinar tu pedido: Mueble de cocina XL', lastMessageAt: '16:09', valueClp: 459990 }),
  ticket({ id: 't6', contactName: 'Edgar Maldonado', channel: 'messenger', stageId: 'standard', aiHandled: true, lastMessage: '¡Perfecto, Edgar! Te esperamos en la tienda 😊', lastMessageAt: '15:51', valueClp: 129990 }),
  ticket({ id: 't7', contactName: 'yoyita_28', channel: 'tiktok', stageId: 'kitchen', aiHandled: true, lastMessage: '😍🙏', lastMessageAt: '15:10', valueClp: 0 }),
  ticket({ id: 't8', contactName: 'Eric Bustos Moya', channel: 'instagram', stageId: 'kitchen', aiHandled: true, lastMessage: '¿Te gustaría contarme qué mueble necesitas fabricar a medida y en qué espacio?', lastMessageAt: '14:56', valueClp: 890000 }),
  ticket({ id: 't9', contactName: 'Stephanie Vejar', channel: 'instagram', stageId: 'kitchen', aiHandled: true, lastMessage: '¡De nada! Te esperamos en la tienda cuando quieras 😊', lastMessageAt: '14:54', valueClp: 1250000 }),
  ticket({ id: 't10', contactName: 'Marcela Rojas', channel: 'whatsapp', stageId: 'quote', aiHandled: false, lastMessage: 'Ok hablaré con mi hija, muchas gracias', lastMessageAt: '16:31', valueClp: 349990 }),
  ticket({ id: 't11', contactName: 'Iska Muñoz', channel: 'messenger', stageId: 'quote', aiHandled: false, lastMessage: '¿Sigue disponible el sofá de Marketplace?', lastMessageAt: '16:14', valueClp: 0 }),
  ticket({ id: 't12', contactName: 'Valentina Cruz', channel: 'whatsapp', stageId: 'quote', aiHandled: true, lastMessage: 'Gracias, Valentina. Anoté tus datos y el diseño que buscas.', lastMessageAt: '13:35', valueClp: 279990 }),
  ticket({ id: 't13', contactName: 'Rodrigo Silva', channel: 'messenger', stageId: 'standard', aiHandled: true, lastMessage: 'La próxima semana voy a ver si vamos', lastMessageAt: '15:42', valueClp: 99990, status: 'won' }),
]

const msg = (id: string, author: Conversation['messages'][number]['author'], text: string, sentAt: string) => ({ id, author, text, sentAt })

const conversations: Conversation[] = [
  { id: 'c1', contactName: 'Beatriz', channel: 'messenger', lastMessageAt: '16:42', aiEnabled: true, unread: true, messages: [
    msg('m1', 'client', 'Hola, ¿sigue disponible la cama de 2 plazas que publicaron en Marketplace?', '16:30'),
    msg('m2', 'ai', '¡Hola Beatriz! 😊 Sí, sigue disponible a $149.990. ¿Te envío más fotos?', '16:31'),
    msg('m3', 'client', 'Sí porfa, ¿y pueden despachar?', '16:40'),
    msg('m4', 'ai', 'Claro, despachamos en toda la RM. ¿Para qué comuna sería?', '16:41'),
    msg('m5', 'client', '¿Hoy?', '16:42'),
  ] },
  { id: 'c2', contactName: 'Karlutty', channel: 'whatsapp', lastMessageAt: '16:35', aiEnabled: true, unread: true, messages: [
    msg('m1', 'client', '¿Cuánto sale el mueble de cocina XL con horno?', '16:20'),
    msg('m2', 'ai', 'El mueble de cocina XL con torre para horno está en $459.990, con despacho incluido en la RM.', '16:21'),
    msg('m3', 'client', 'Muchas gracias', '16:35'),
  ] },
  { id: 'c3', contactName: 'Marcela', channel: 'whatsapp', lastMessageAt: '16:31', aiEnabled: false, unread: true, messages: [
    msg('m1', 'human', 'Hola Marcela, te comparto la cotización del clóset a medida: $349.990.', '16:10'),
    msg('m2', 'client', 'Ok hablaré con mi hija, muchas gracias', '16:31'),
  ] },
  { id: 'c4', contactName: 'Isabel', channel: 'messenger', lastMessageAt: '16:19', aiEnabled: true, unread: false, messages: [
    msg('m1', 'client', '¡Gracias! Para la base de cama de 2 plazas, ¿qué colores hay?', '16:19'),
  ] },
  { id: 'c5', contactName: 'Rodrigo', channel: 'messenger', lastMessageAt: '15:42', aiEnabled: true, unread: false, messages: [
    msg('m1', 'ai', 'Nuestra tienda abre de lunes a sábado de 10:00 a 19:00. ¡Te esperamos!', '15:40'),
    msg('m2', 'client', 'La próxima semana a ver si vamos', '15:42'),
  ] },
  { id: 'c6', contactName: 'Marlit Asenjo', channel: 'instagram', lastMessageAt: '15:41', aiEnabled: false, unread: false, messages: [
    msg('m1', 'client', '🎤 Audio (0:24)', '15:41'),
  ] },
  { id: 'c7', contactName: 'Martina', channel: 'instagram', lastMessageAt: '15:21', aiEnabled: true, unread: false, messages: [
    msg('m1', 'client', 'Mi idea es el mueble que vi en el post', '15:21'),
  ] },
  { id: 'c8', contactName: 'Anto Urrutia', channel: 'tiktok', lastMessageAt: '14:31', aiEnabled: true, unread: false, messages: [
    msg('m1', 'client', '¿Hacen envíos a regiones?', '14:31'),
  ] },
]

const contacts: Contact[] = [
  ['Beatriz', '56962655512', 'messenger', 'Cotizando'], ['Karen Soto', '56972139613', 'whatsapp', 'Cliente'],
  ['Jaime González', '56930282367', 'whatsapp', 'Nuevo'], ['Gabriel Esteban', '56985511261', 'whatsapp', 'Cliente'],
  ['jano26570', null, 'tiktok', 'Nuevo'], ['Karlutty', '56949333534', 'whatsapp', 'Cotizando'],
  ['Marcela Rojas', '56942877327', 'whatsapp', 'Cotizando'], ['ema', null, 'instagram', 'Nuevo'],
  ['Isabel', '56934262263', 'messenger', 'Cliente'], ['Rodrigo Silva', null, 'messenger', 'Cliente'],
].map(([name, phone, channel, tag], i) => ({
  id: `ct${i + 1}`, name: name as string, phone: phone as string | null,
  channel: channel as Contact['channel'], tag: tag as string, ownerName: null,
}))

const assistants: Assistant[] = [
  { id: 'as1', name: 'Asistente Ventas', emoji: '🪑', pipelineName: 'Ventas | Muebles y Hogar', scenarioCoverage: 100 },
]

const channelAccounts: ChannelAccount[] = [
  { id: 'ch1', type: 'messenger', name: 'Rachel Ventas', handle: 'Página de Facebook + Marketplace', official: true, pipelineIds: ['pl_ventas'] },
  { id: 'ch2', type: 'whatsapp', name: 'Muebles y Hogar SPA', handle: '+56 9 3084 3636', official: true, pipelineIds: ['pl_ventas'] },
  { id: 'ch3', type: 'instagram', name: 'Muebles y Hogar Spa', handle: '@mueblesyhogar.spa', official: true, pipelineIds: ['pl_ventas'] },
  { id: 'ch4', type: 'tiktok', name: 'mueblesyhogarspa', handle: '@mueblesyhogarspa', official: false, pipelineIds: ['pl_ventas'] },
]

/** Tráfico estable con picos en horario comercial; más bajo el fin de semana. */
const heatmap = Array.from({ length: 7 }, (_, d) =>
  Array.from({ length: 24 }, (_, h) => {
    const peak = h >= 10 && h <= 18 ? 1 : h >= 8 && h <= 21 ? 0.4 : 0.05
    return Math.round(peak * (12 + ((d * 7 + h * 13) % 12)) * (d < 5 ? 1 : 0.6))
  }),
)

const analytics: AnalyticsSummary = {
  conversationKpis: [
    { label: 'Mensajes enviados IA', value: '968', delta: '+38%' },
    { label: 'Mensajes recibidos', value: '1.321', delta: '+24%' },
    { label: 'Contactos creados', value: '204', delta: '+17%' },
    { label: 'Contactos activos', value: '116', delta: '+9%' },
    { label: 'Conversaciones totales', value: '148', delta: '+21%' },
  ],
  ticketKpis: [
    { label: 'Total de oportunidades', value: '143', delta: '+12%' },
    { label: 'Tickets creados', value: '143', delta: '+12%' },
    { label: 'Tickets resueltos', value: '72', delta: '+15%' },
    { label: 'Tasa de éxito', value: '29,17%', delta: '+4%' },
  ],
  aiCoverage: { percent: 70.5, messages: { ai: 968, human: 405 }, conversations: { aiOnly: 60, mixed: 70, humanOnly: 18 } },
  heatmap,
  ticketFlow: [
    { label: 'Asesoría muebles', count: 48, color: 'rgb(var(--brand-500))' },
    { label: 'Asistencia humana', count: 38, color: 'rgb(var(--warning-chart))' },
    { label: 'Proyecto cocina', count: 27, color: 'rgb(var(--accent))' },
    { label: 'Cierre de venta', count: 18, color: 'rgb(var(--success-chart))' },
    { label: 'Cliente perdido', count: 12, color: 'rgb(var(--danger))' },
  ],
  resolution: { aiPercent: 61.1, humanPercent: 38.9 },
}

const products: Product[] = [
  { id: 'p1', name: 'Mueble de cocina con encimera 3 quemadores tamaño M', category: 'Muebles de cocina', description: '2 puertas, 3 cajones y encimera integrada de 3 hornillas.', dimensions: '55 × 110 × 90 cm', priceClp: 209990, salePriceClp: 169990, imageUrl: null, sourceUrl: null, customizable: false },
  { id: 'p2', name: 'Cómoda 4 cajones · Diseño 07', category: 'comodas', description: '4 cajones con diseño temático.', dimensions: '37 × 70 × 78 cm', priceClp: 59990, salePriceClp: null, imageUrl: null, sourceUrl: null, customizable: true },
  { id: 'p3', name: 'Clóset 2 puertas 4 cajones personalizable', category: 'closets', description: 'Melamina blanca con tu imagen en el frente.', dimensions: '40 × 80 × 170 cm', priceClp: 99990, salePriceClp: null, imageUrl: null, sourceUrl: null, customizable: true },
]

const knowledge: KnowledgeEntry[] = [
  { id: 'k1', title: 'Disponibilidad', content: 'Somos fabricantes: todo el catálogo está siempre disponible porque se fabrica a pedido.' },
  { id: 'k2', title: 'Despacho', content: 'Despachamos dentro de Santiago. El costo depende de la comuna y se confirma antes de pagar.' },
]

export const mockRepository: Repository = {
  getOrganization: async () => ({ id: 'org_demo', name: 'Muebles y Hogar', plan: 'pyme' }),
  getPipelines: async () => pipelines,
  getTickets: async (pipelineId) => tickets.filter((t) => t.pipelineId === pipelineId),
  getConversations: async () => conversations,
  getContacts: async () => ({ items: contacts, total: 274 }),
  getAssistants: async () => assistants,
  getChannelAccounts: async () => channelAccounts,
  getAnalyticsSummary: async () => analytics,
  getProducts: async (query) => {
    const q = query?.toLowerCase().trim()
    const items = q ? products.filter((p) => `${p.name} ${p.description}`.toLowerCase().includes(q)) : products
    return { items, total: items.length }
  },
  getKnowledge: async () => knowledge,
  addKnowledgeEntry: async ({ title, content }) => {
    const entry = { id: `k${knowledge.length + 1}`, title, content }
    knowledge.push(entry)
    return entry
  },
}
