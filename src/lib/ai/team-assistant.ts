import 'server-only'
import { z } from 'zod'
import { CHANNELS, ROLE_LABELS, type Channel } from '@/config/sales'
import { formatClp } from '@/lib/format'
import { canEdit, canManage, type Session } from '@/lib/session'
import { latestLearningReport } from './learning'
import { describeHits, searchCatalog } from './catalog'
import { defineTool, runAgent } from './engine'

/**
 * Asistente interno para el equipo (Rachel, el dueño): explica cómo usar Momo y hace
 * tareas dentro de la app con herramientas que actúan sobre los datos de SU empresa.
 * No atiende clientes finales: eso lo hace Momo vendedor (sales-agent.ts).
 */

/** Pantallas a las que Momo puede llevar a la persona (siempre en la misma pestaña). */
export const ROUTES = {
  hoy: '/hoy',
  conversaciones: '/conversaciones',
  te_esperan: '/conversaciones?f=esperan',
  clientes: '/clientes',
  politicas: '/conocimiento',
  productos: '/conocimiento?t=productos',
  dudas: '/conocimiento?t=dudas',
  personalidad: '/conocimiento?t=personalidad',
  resultados: '/resultados',
  mi_perfil: '/ajustes?t=perfil',
  equipo: '/ajustes?t=equipo',
  plan: '/ajustes?t=plan',
  canales: '/ajustes?t=canales',
} as const

export type AssistantAction = { type: 'navigate'; href: string; label: string }

export interface AssistantTurn {
  role: 'user' | 'assistant'
  text: string
}

const BASE = `Eres Momo Equipo, el compañero de trabajo interno de la app Momo AI (ventas por chat con IA para pymes).
Hablas con el equipo de la empresa (dueños y vendedores), nunca con clientes finales. Responde en español de Chile, cercano, claro y breve, sin tecnicismos. Usa listas cortas cuando des datos.

Qué hay en la app:
- Hoy: resumen del día, clientes que te esperan, ventas de la semana y lo que Momo aprendió.
- Conversaciones: cada chat con su venta al lado (pasos Pregunta → Cotizado → Pagado → Despachado). Por ahora los chats de Marketplace se registran a mano: se pega lo que escribió el cliente, con \"Momo atiende\" activado Momo responde solo; si no, sugiere la respuesta y se copia para pegarla en Marketplace. "Pasar al Área de Diseño" deriva proyectos a medida.
- Clientes: ficha de cada cliente con sus conversaciones y compras; se puede exportar a Excel.
- Lo que Momo sabe: políticas del negocio, productos, dudas que Momo no supo responder y su personalidad. En "Entrenar a Momo" se conversa con Momo como cliente: lo que no sabe queda en Dudas y cada corrección se guarda como política.
- Resultados: ventas, conversaciones y canales por periodo.
- Ajustes: mi perfil y contraseña, empresa, equipo, plan y canales.
Lo que aún no está disponible: la conexión directa con Facebook, WhatsApp e Instagram (se solicita en Ajustes › Canales). Dilo con honestidad si preguntan.

Herramientas:
- buscar_productos: para responder sobre productos, precios u ofertas. Nunca inventes precios.
- ver_conocimiento: revisa qué políticas ya sabe Momo antes de agregar algo.
- agregar_conocimiento: guarda una política o dato del negocio. Antes de usarla muestra el título y el texto y pide confirmación explícita; úsala solo cuando la persona confirme. Redacta claro y completo, en tercera persona.
- ir_a: lleva a una pantalla cuando lo pidan o cuando sea lo más rápido para resolver la duda.
- resumen_negocio: números reales del periodo (conversaciones, ventas, montos, qué piden, dudas). Úsalo para "¿cómo vamos?", resúmenes y antes de dar ideas de estrategia.
- clientes_pendientes: quién espera respuesta y qué ventas quedaron cotizadas sin cerrar, para hacer seguimiento.
- aprendizaje_momo: el último resumen semanal de lo que aprendió Momo (preguntas frecuentes, objeciones, políticas sugeridas).
Cuando des estrategia o ideas, basa cada idea en un dato concreto del resumen y termina con 1 acción para hoy. Aclara que son sugerencias: no conoces el stock real ni los costos de fábrica. Nunca inventes cifras.`

/** Ejecuta un turno del asistente con herramientas sobre la empresa activa. */
export async function runTeamAssistant(session: Session, history: AssistantTurn[]) {
  const actions: AssistantAction[] = []
  const { db, org } = session
  const first = session.user.name.split(/[\s@]+/)[0] || session.user.name
  const owner = canManage(session.role)
  const SYSTEM = `${BASE}

## Con quién hablas
Estás hablando con ${first} (${ROLE_LABELS[session.role]}) de ${org.name}. Ya inició sesión, así que sabes quién es: llámalo por su nombre.
${owner
    ? 'Es dueño o administrador: puedes hablar de estrategia, resultados del negocio, ideas para vender más y mejoras para Momo.'
    : 'Es vendedor(a): enfócate en su día a día: a quién responder, a quién hacer seguimiento, cómo cerrar una venta difícil y cómo usar la app. Puedes compartir los números del equipo, pero sin entrar en decisiones de precios o del negocio.'}`

  // Políticas reales del negocio: Momo Equipo no inventa características, precios ni condiciones.
  const { data: knowledge } = await db.from('knowledge_entries').select('title, content').eq('organization_id', org.id).order('updated_at').limit(80)
  const policies = (knowledge ?? []).map((k) => `- ${k.title}: ${k.content}`).join('\n') || 'Aún no hay políticas cargadas.'
  const SYSTEM_FULL = `${SYSTEM}

## Políticas del negocio (si dos se contradicen, manda la más reciente)
${policies}

Cuando propongas qué responderle a un cliente, usa solo lo que dicen estas políticas y el catálogo (buscar_productos). Nunca inventes materiales, medidas, cuotas, descuentos ni condiciones que no estén aquí.`

  const since = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString()

  const resumenNegocio = defineTool({
    name: 'resumen_negocio',
    description: 'Números reales de la empresa en los últimos N días: conversaciones, mensajes, cuánto respondió Momo, ventas (cantidad y monto), ventas en curso por paso, lo más pedido y dudas pendientes.',
    schema: z.object({ dias: z.number().int().min(1).max(90).default(7) }),
    run: async ({ dias }) => {
      const from = since(dias)
      const [convs, msgs, won, open, interest, gaps, waiting] = await Promise.all([
        db.from('conversations').select('channel').eq('organization_id', org.id).gte('created_at', from).limit(5000),
        db.from('messages').select('author').eq('organization_id', org.id).gte('sent_at', from).limit(20000),
        db.from('tickets').select('value_clp, delivery_clp, title').eq('organization_id', org.id).eq('status', 'won').gte('closed_at', from),
        db.from('tickets').select('step').eq('organization_id', org.id).eq('status', 'open'),
        db.from('tickets').select('title').eq('organization_id', org.id).not('title', 'is', null).gte('created_at', from).limit(2000),
        db.from('knowledge_gaps').select('question').eq('organization_id', org.id).eq('status', 'pendiente').limit(10),
        db.from('conversations').select('id', { count: 'exact', head: true }).eq('organization_id', org.id).eq('status', 'open').eq('ai_enabled', false).eq('last_message_author', 'client'),
      ])
      const byChannel = new Map<string, number>()
      for (const c of convs.data ?? []) byChannel.set(c.channel as string, (byChannel.get(c.channel as string) ?? 0) + 1)
      const authors = (msgs.data ?? []).reduce<Record<string, number>>((a, m) => ({ ...a, [m.author as string]: (a[m.author as string] ?? 0) + 1 }), {})
      const replies = (authors.ai ?? 0) + (authors.human ?? 0)
      const total = (won.data ?? []).reduce((s, t) => s + Number(t.value_clp ?? 0) + Number(t.delivery_clp ?? 0), 0)
      const steps = (open.data ?? []).reduce<Record<string, number>>((a, t) => ({ ...a, [t.step as string]: (a[t.step as string] ?? 0) + 1 }), {})
      const top = new Map<string, number>()
      for (const t of interest.data ?? []) { const k = String(t.title).trim(); if (k) top.set(k, (top.get(k) ?? 0) + 1) }
      return [
        `Periodo: últimos ${dias} días.`,
        `Conversaciones nuevas: ${(convs.data ?? []).length}${byChannel.size ? ` (${[...byChannel].map(([c, n]) => `${CHANNELS[c as Channel]?.label ?? c}: ${n}`).join(', ')})` : ''}.`,
        `Mensajes de clientes: ${authors.client ?? 0}. Respuestas: ${replies} (Momo ${authors.ai ?? 0}, equipo ${authors.human ?? 0}).`,
        `Ventas cerradas: ${(won.data ?? []).length} por ${formatClp(total)}.`,
        `Ventas en curso: pregunta ${steps.pregunta ?? 0}, cotizado ${steps.cotizado ?? 0}, pagado ${steps.pagado ?? 0}.`,
        `Clientes esperando respuesta ahora: ${waiting.count ?? 0}.`,
        `Lo más pedido: ${[...top].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, n]) => `${k} (${n})`).join(', ') || 'sin datos'}.`,
        `Dudas que Momo no sabe responder: ${(gaps.data ?? []).map((g) => `«${g.question}»`).join('; ') || 'ninguna'}.`,
      ].join('\n')
    },
  })

  const clientesPendientes = defineTool({
    name: 'clientes_pendientes',
    description: 'Clientes que esperan respuesta y ventas cotizadas que no se han cerrado (para seguimiento), con días sin movimiento.',
    schema: z.object({}),
    run: async () => {
      const [waiting, quoted] = await Promise.all([
        db.from('conversations').select('id, last_message_at, last_message_preview, contact:contacts(name)').eq('organization_id', org.id).eq('status', 'open')
          .eq('last_message_author', 'client').order('last_message_at', { ascending: true }).limit(10),
        db.from('tickets').select('title, value_clp, updated_at, conversation_id, contact:contacts(name)').eq('organization_id', org.id).eq('status', 'open')
          .eq('step', 'cotizado').order('updated_at', { ascending: true }).limit(10),
      ])
      const days = (iso: string | null) => (iso ? Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)) : 0)
      const name = (c: unknown) => (c as { name?: string } | null)?.name ?? 'Cliente'
      const a = (waiting.data ?? []).map((c) => `- ${name(c.contact)}: espera hace ${days(c.last_message_at as string)} día(s) · «${String(c.last_message_preview ?? '').slice(0, 80)}»`)
      const b = (quoted.data ?? []).map((t) => `- ${name(t.contact)}: cotizado ${t.title ?? ''}${t.value_clp ? ` por ${formatClp(Number(t.value_clp))}` : ''}, sin movimiento hace ${days(t.updated_at as string)} día(s)`)
      if (a.length || b.length) actions.push({ type: 'navigate', href: ROUTES.te_esperan, label: 'Ver quién espera' })
      return `Esperan respuesta:\n${a.join('\n') || '- Nadie'}\n\nCotizados sin cerrar:\n${b.join('\n') || '- Ninguno'}`
    },
  })

  const aprendizajeMomo = defineTool({
    name: 'aprendizaje_momo',
    description: 'Último resumen semanal de aprendizaje de Momo: preguntas frecuentes, objeciones, lo que funcionó y políticas sugeridas.',
    schema: z.object({}),
    run: async () => {
      const r = await latestLearningReport(session)
      if (!r) return 'Aún no hay resumen de aprendizaje. Se crea en Lo que Momo sabe › Aprendizaje › Analizar mi semana.'
      const d = r.data
      return [`Resumen (${r.period_start.slice(0, 10)} a ${r.period_end.slice(0, 10)}): ${d.resumen}`,
        `Preguntas frecuentes: ${d.preguntas_frecuentes.map((p) => `${p.pregunta} (${p.tiene_respuesta ? 'Momo sabe' : 'falta enseñarle'})`).join('; ')}`,
        `Objeciones: ${d.objeciones.map((o) => o.objecion).join('; ')}`,
        `Políticas sugeridas: ${d.politicas_sugeridas.map((p) => p.titulo).join('; ')}`].join('\n')
    },
  })


  const buscarProductos = defineTool({
    name: 'buscar_productos',
    description: 'Busca productos del catálogo de la empresa por texto. Devuelve hasta 8 con precio y oferta.',
    schema: z.object({ consulta: z.string().min(1).max(120).describe('Texto a buscar, por ejemplo "cocina con horno"') }),
    run: async ({ consulta }) => describeHits(consulta, await searchCatalog(session, consulta)),
  })

  const verConocimiento = defineTool({
    name: 'ver_conocimiento',
    description: 'Lista las políticas y datos del negocio que Momo ya conoce.',
    schema: z.object({}),
    run: async () => {
      const { data } = await db.from('knowledge_entries').select('title, content').eq('organization_id', org.id).order('created_at').limit(80)
      return data?.length ? data.map((e) => `- ${e.title}: ${e.content}`).join('\n') : 'Aún no hay políticas cargadas.'
    },
  })

  const agregarConocimiento = defineTool({
    name: 'agregar_conocimiento',
    description: 'Guarda una nueva política o dato del negocio. Solo después de que la persona confirme el texto.',
    schema: z.object({
      titulo: z.string().min(3).max(80).describe('Título corto, por ejemplo "Despacho a regiones"'),
      contenido: z.string().min(10).max(2000).describe('Texto completo que leerá Momo vendedor'),
    }),
    run: async ({ titulo, contenido }) => {
      if (!canEdit(session.role)) return 'No se pudo guardar: tu rol es de solo lectura.'
      const { data: assistant } = await db.from('ai_assistants').select('id').eq('organization_id', org.id).eq('active', true).order('created_at').limit(1).maybeSingle()
      const { error } = await db.from('knowledge_entries').insert({ organization_id: org.id, assistant_id: assistant?.id ?? null, title: titulo, content: contenido })
      if (error) return 'No se pudo guardar: ' + (error.code === '42501' ? 'tu rol no tiene permiso.' : 'intenta de nuevo.')
      actions.push({ type: 'navigate', href: ROUTES.politicas, label: 'Ver políticas' })
      return `Guardado: "${titulo}".`
    },
  })

  const irA = defineTool({
    name: 'ir_a',
    description: 'Lleva a la persona a una pantalla de la app.',
    schema: z.object({ pantalla: z.enum(Object.keys(ROUTES) as [keyof typeof ROUTES, ...(keyof typeof ROUTES)[]]) }),
    run: async ({ pantalla }) => {
      actions.push({ type: 'navigate', href: ROUTES[pantalla], label: `Ir a ${pantalla.replace(/_/g, ' ')}` })
      return `Listo, se mostrará el botón para ir a ${pantalla}.`
    },
  })

  // Chat de ayuda: esfuerzo bajo para respuestas rápidas y económicas.
  const result = await runAgent(session, {
    feature: 'asistente_interno', system: SYSTEM_FULL, effort: 'low',
    tools: [buscarProductos, verConocimiento, agregarConocimiento, irA, resumenNegocio, clientesPendientes, aprendizajeMomo],
    messages: history,
  })

  if (result.refused) {
    return { reply: 'No puedo ayudarte con eso. Pregúntame por el uso de la app, tus productos o lo que sabe Momo.', actions }
  }
  return { reply: result.text || 'Listo.', actions }
}
