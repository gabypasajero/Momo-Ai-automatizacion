import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import { betaZodTool } from '@anthropic-ai/sdk/helpers/beta/zod'
import { z } from 'zod'
import type { Repository } from '@/lib/data/repository'
import { formatClp } from '@/lib/format'

/**
 * Asistente interno para vendedores (Rachel, el dueño): explica cómo usar Momo y hace
 * tareas dentro de la app con herramientas que actúan sobre los datos de SU empresa.
 * No atiende clientes finales: eso lo hará el agente de ventas conectado a Facebook.
 */

export const MODEL = 'claude-opus-5-5'

/** Pantallas a las que Momo puede llevar al usuario. */
export const ROUTES = {
  inicio: '/inicio',
  embudo: '/embudo',
  chat: '/chat',
  asistentes: '/asistentes',
  conocimiento: '/asistentes/conocimiento',
  crm: '/crm',
  canales: '/canales',
  analitica: '/analitica',
  facturacion: '/ajustes/facturacion',
  cambiar_contrasena: '/restablecer',
} as const

/** Precio en US$ por millón de tokens (entrada, salida, lectura de caché). */
const PRICING: Record<string, { input: number; output: number; cacheRead: number }> = {
  'claude-opus-5-5': { input: 4, output: 20, cacheRead: 0.2 },
  'claude-sonnet-5-5': { input: 2, output: 10, cacheRead: 0.2 },
  'claude-haiku-5-5': { input: 0.1, output: 0.5, cacheRead: 0.01 },
}

export type AssistantAction = { type: 'navigate'; href: string; label: string }

export interface AssistantTurn {
  role: 'user' | 'assistant'
  text: string
}

const SYSTEM = `Eres Momo, el asistente interno de la app Momo AI (un CRM con IA para vender por Facebook, WhatsApp e Instagram).
Hablas con vendedores y dueños de la empresa, no con clientes finales. Responde en español de Chile, cercano y breve (2 a 5 frases), sin tecnicismos.

Qué hay en la app:
- Inicio: resumen del día y conversaciones que esperan a una persona.
- Embudo: tablero con etapas; los tickets se arrastran entre columnas y se marcan como venta ganada (✓) o perdida (✕).
- Chat: conversaciones de todos los canales; se puede pausar o activar la IA en cada una.
- Asistente > Conocimiento: políticas del negocio y catálogo que usa la IA para responder a los clientes.
- CRM: clientes. Canales: cuentas conectadas. Analítica: métricas. Ajustes > Plan y facturación.
- El ícono de llave en la barra superior sirve para cambiar la contraseña.
Lo que aún no está disponible: conexión real con Facebook/WhatsApp (en preparación), campañas, workflows y agenda. Si preguntan por eso, dilo con honestidad.

Herramientas:
- buscar_productos: para responder sobre productos, precios u ofertas. Nunca inventes precios.
- ver_conocimiento: para revisar qué políticas ya sabe la IA antes de agregar algo.
- agregar_conocimiento: guarda una política o dato del negocio (despacho, pagos, horarios, garantías, preguntas frecuentes). Antes de usarla, muestra el título y el texto que vas a guardar y pide confirmación explícita; úsala solo cuando el usuario confirme. Redacta el contenido claro y completo, en tercera persona, como lo leerá la IA de ventas.
- ir_a: lleva al usuario a una pantalla cuando lo pida o cuando sea la forma más rápida de resolver su duda.`

/** Ejecuta un turno del asistente con las herramientas sobre el repositorio de la empresa activa. */
export async function runSellerAssistant(repo: Repository, history: AssistantTurn[]) {
  const actions: AssistantAction[] = []

  const buscarProductos = betaZodTool({
    name: 'buscar_productos',
    description: 'Busca productos del catálogo de la empresa por texto (nombre, categoría, diseño). Devuelve hasta 8 con precio y oferta.',
    inputSchema: z.object({ consulta: z.string().min(1).max(120).describe('Texto a buscar, por ejemplo "cocina con horno"') }),
    run: async ({ consulta }) => {
      const { items, total } = await repo.getProducts(consulta)
      if (!items.length) return `Sin resultados para "${consulta}".`
      const lines = items.slice(0, 8).map((p) =>
        `- ${p.name}: ${p.salePriceClp ? `${formatClp(p.salePriceClp)} (antes ${formatClp(p.priceClp)})` : formatClp(p.priceClp)}${p.dimensions ? ` · ${p.dimensions}` : ''}`)
      return `${total} resultado(s):\n${lines.join('\n')}`
    },
  })

  const verConocimiento = betaZodTool({
    name: 'ver_conocimiento',
    description: 'Lista las políticas y datos del negocio que la IA de ventas ya conoce.',
    inputSchema: z.object({}),
    run: async () => {
      const entries = await repo.getKnowledge()
      return entries.length ? entries.map((e) => `- ${e.title}: ${e.content}`).join('\n') : 'Aún no hay conocimiento cargado.'
    },
  })

  const agregarConocimiento = betaZodTool({
    name: 'agregar_conocimiento',
    description: 'Guarda una nueva política o dato del negocio en el conocimiento de la IA. Solo después de que el usuario confirme el texto.',
    inputSchema: z.object({
      titulo: z.string().min(3).max(80).describe('Título corto, por ejemplo "Despacho a regiones"'),
      contenido: z.string().min(10).max(2000).describe('Texto completo que leerá la IA de ventas'),
    }),
    run: async ({ titulo, contenido }) => {
      try {
        const entry = await repo.addKnowledgeEntry({ title: titulo, content: contenido })
        actions.push({ type: 'navigate', href: ROUTES.conocimiento, label: 'Ver conocimiento' })
        return `Guardado: "${entry.title}".`
      } catch {
        return 'No se pudo guardar: tu rol no tiene permiso para editar el conocimiento.'
      }
    },
  })

  const irA = betaZodTool({
    name: 'ir_a',
    description: 'Lleva al usuario a una pantalla de la app.',
    inputSchema: z.object({ pantalla: z.enum(Object.keys(ROUTES) as [keyof typeof ROUTES, ...(keyof typeof ROUTES)[]]) }),
    run: async ({ pantalla }) => {
      actions.push({ type: 'navigate', href: ROUTES[pantalla], label: `Ir a ${pantalla.replace('_', ' ')}` })
      return `Listo, se mostrará el botón para ir a ${pantalla}.`
    },
  })

  const client = new Anthropic()
  const runner = client.beta.messages.toolRunner({
    model: MODEL,
    max_tokens: 16000,
    // Chat de ayuda: esfuerzo bajo para respuestas rápidas y económicas.
    output_config: { effort: 'low' },
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    max_iterations: 6,
    system: SYSTEM,
    tools: [buscarProductos, verConocimiento, agregarConocimiento, irA],
    messages: history.map((t) => ({ role: t.role, content: t.text })),
  })

  // Cada iteración del runner es una llamada a la API: se suma su consumo para el panel de administración.
  let final: Anthropic.Beta.BetaMessage | undefined
  let inputTokens = 0, outputTokens = 0, cacheReadTokens = 0, costUsd = 0
  for await (const message of runner) {
    final = message
    const u = message.usage
    const price = PRICING[message.model] ?? PRICING[MODEL]!
    const cacheRead = u.cache_read_input_tokens ?? 0
    const input = u.input_tokens + (u.cache_creation_input_tokens ?? 0)
    inputTokens += input; outputTokens += u.output_tokens; cacheReadTokens += cacheRead
    costUsd += (input * price.input + u.output_tokens * price.output + cacheRead * price.cacheRead) / 1e6
  }
  await repo.recordAiUsage({ feature: 'asistente_interno', model: final?.model ?? MODEL, inputTokens, outputTokens, cacheReadTokens, costUsd })
  if (!final) return { reply: 'Listo.', actions }

  if (final.stop_reason === 'refusal') {
    return { reply: 'No puedo ayudarte con eso. Pregúntame por el uso de la app, tus productos o el conocimiento de la IA.', actions }
  }
  const reply = final.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim()
  return { reply: reply || 'Listo.', actions }
}
