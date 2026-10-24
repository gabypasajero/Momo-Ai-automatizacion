import 'server-only'
import { z } from 'zod'
import { canEdit, type Session } from '@/lib/session'
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

const SYSTEM = `Eres Momo, el asistente interno de la app Momo AI (ventas por chat con IA para pymes).
Hablas con el equipo de la empresa (dueños y vendedores), no con clientes finales. Responde en español de Chile, cercano y breve (2 a 5 frases), sin tecnicismos.

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
- ir_a: lleva a una pantalla cuando lo pidan o cuando sea lo más rápido para resolver la duda.`

/** Ejecuta un turno del asistente con herramientas sobre la empresa activa. */
export async function runTeamAssistant(session: Session, history: AssistantTurn[]) {
  const actions: AssistantAction[] = []
  const { db, org } = session

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
    feature: 'asistente_interno', system: SYSTEM, effort: 'low',
    tools: [buscarProductos, verConocimiento, agregarConocimiento, irA],
    messages: history,
  })

  if (result.refused) {
    return { reply: 'No puedo ayudarte con eso. Pregúntame por el uso de la app, tus productos o lo que sabe Momo.', actions }
  }
  return { reply: result.text || 'Listo.', actions }
}
