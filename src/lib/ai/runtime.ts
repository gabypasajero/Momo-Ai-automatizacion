import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import type { Session } from '@/lib/session'

/** Modelo por defecto: el más capaz para vender y resolver sin errores. */
export const DEFAULT_MODEL = 'claude-opus-5-5'

/** Precio en US$ por millón de tokens (entrada, salida, lectura de caché). */
export const PRICING: Record<string, { input: number; output: number; cacheRead: number }> = {
  'claude-opus-5-5': { input: 4, output: 20, cacheRead: 0.2 },
  'claude-sonnet-5-5': { input: 2, output: 10, cacheRead: 0.2 },
  'claude-haiku-5-5': { input: 0.1, output: 0.5, cacheRead: 0.01 },
}

export const modelFor = (configured: string | null | undefined) => (configured && configured in PRICING ? configured : DEFAULT_MODEL)

/** Opciones comunes: respaldo automático del servidor si el modelo rechaza una solicitud. */
export const FALLBACK = { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' } as const

export class AiNotConfiguredError extends Error {
  constructor() {
    super('La inteligencia de Momo no está activada (falta la clave de la API de Claude).')
  }
}

export function anthropic() {
  if (!process.env.ANTHROPIC_API_KEY) throw new AiNotConfiguredError()
  return new Anthropic()
}

/**
 * Recorre un tool runner (cada iteración es una llamada a la API), suma tokens y costo
 * y lo registra en momo.ai_usage para el panel de administración. Devuelve el último mensaje.
 */
export async function consume(
  session: Session,
  feature: 'asistente_interno' | 'vendedor',
  runner: AsyncIterable<Anthropic.Beta.BetaMessage>,
) {
  let final: Anthropic.Beta.BetaMessage | undefined
  let inputTokens = 0, outputTokens = 0, cacheReadTokens = 0, costUsd = 0
  for await (const message of runner) {
    final = message
    const u = message.usage
    const price = PRICING[message.model] ?? PRICING[DEFAULT_MODEL]!
    const cacheRead = u.cache_read_input_tokens ?? 0
    const input = u.input_tokens + (u.cache_creation_input_tokens ?? 0)
    inputTokens += input; outputTokens += u.output_tokens; cacheReadTokens += cacheRead
    costUsd += (input * price.input + u.output_tokens * price.output + cacheRead * price.cacheRead) / 1e6
  }
  const { error } = await session.db.from('ai_usage').insert({
    organization_id: session.org.id, feature, model: final?.model ?? DEFAULT_MODEL,
    input_tokens: inputTokens, output_tokens: outputTokens, cache_read_tokens: cacheReadTokens, cost_usd: costUsd,
  })
  // El registro de consumo nunca debe romper la respuesta al usuario.
  if (error) console.error('ai_usage: no se pudo registrar', error.message)
  return final
}

export const textOf = (message: Anthropic.Beta.BetaMessage | undefined) =>
  (message?.content ?? [])
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim()

/** Mensaje para la persona según el error de la API. */
export function describeAiError(error: unknown) {
  if (error instanceof AiNotConfiguredError) return error.message
  if (error instanceof Anthropic.RateLimitError) return 'Momo está recibiendo muchas consultas. Prueba de nuevo en un minuto.'
  if (error instanceof Anthropic.APIError) {
    console.error('IA: error de la API', error.status, error.message)
    return 'Momo tuvo un problema para pensar la respuesta. Intenta otra vez.'
  }
  console.error('IA: error inesperado', error)
  return 'Momo no pudo responder ahora. Intenta otra vez.'
}
