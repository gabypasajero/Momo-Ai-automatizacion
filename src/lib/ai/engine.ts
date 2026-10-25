import 'server-only'
import { betaZodTool } from '@anthropic-ai/sdk/helpers/beta/zod'
import { z } from 'zod'
import type { Session } from '@/lib/session'
import { AiNotConfiguredError, DEFAULT_MODEL, FALLBACK, anthropic, consume, textOf } from './runtime'

/**
 * Motor de IA de Momo: el mismo agente corre con Claude (si está ANTHROPIC_API_KEY) o con
 * Gemini (si solo está GEMINI_API_KEY). MOMO_IA=gemini fuerza Gemini aunque exista la de Claude.
 */

export type Provider = 'claude' | 'gemini'

export function aiProvider(): Provider | null {
  const claude = Boolean(process.env.ANTHROPIC_API_KEY)
  const gemini = Boolean(process.env.GEMINI_API_KEY)
  if (gemini && (process.env.MOMO_IA === 'gemini' || !claude)) return 'gemini'
  return claude ? 'claude' : null
}

/**
 * Modelos de Gemini en orden de preferencia. Si uno no existe (404), está saturado (503/500)
 * o agotó su cuota gratuita (429), se reintenta una vez y luego se prueba el siguiente.
 */
const GEMINI_MODELS = [process.env.GEMINI_MODEL, 'gemini-flash-latest', 'gemini-3.8-flash', 'gemini-flash-lite-latest'].filter((m): m is string => Boolean(m))
const RETRYABLE = new Set([429, 500, 503])
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
let geminiModel = GEMINI_MODELS[0]!

export interface ToolSpec<S extends z.ZodObject = z.ZodObject> {
  name: string
  description: string
  schema: S
  run: (input: z.infer<S>) => Promise<string>
}
export const defineTool = <S extends z.ZodObject>(t: ToolSpec<S>) => t as unknown as ToolSpec

export interface AgentImage { mediaType: 'image/jpeg' | 'image/png' | 'image/webp'; data: string }
export interface AgentTurn { role: 'user' | 'assistant'; text: string; images?: AgentImage[] }

interface AgentOptions {
  feature: 'asistente_interno' | 'vendedor'
  system: string
  messages: AgentTurn[]
  tools: ToolSpec[]
  /** Modelo de Claude configurado para la empresa. */
  claudeModel?: string
  effort: 'low' | 'medium'
}

export interface AgentResult { text: string; refused: boolean }

export async function runAgent(session: Session, options: AgentOptions): Promise<AgentResult> {
  const provider = aiProvider()
  if (!provider) throw new AiNotConfiguredError()
  return provider === 'gemini' ? runGemini(session, options) : runClaude(session, options)
}

async function runClaude(session: Session, o: AgentOptions): Promise<AgentResult> {
  const runner = anthropic().beta.messages.toolRunner({
    model: o.claudeModel ?? DEFAULT_MODEL,
    max_tokens: 16000,
    output_config: { effort: o.effort },
    ...FALLBACK,
    betas: [...FALLBACK.betas],
    max_iterations: 6,
    system: [{ type: 'text', text: o.system, cache_control: { type: 'ephemeral' } }],
    tools: o.tools.map((t) => betaZodTool({ name: t.name, description: t.description, inputSchema: t.schema, run: t.run })),
    messages: o.messages.map((m) => ({
      role: m.role,
      content: m.images?.length
        ? [...m.images.map((img) => ({ type: 'image' as const, source: { type: 'base64' as const, media_type: img.mediaType, data: img.data } })), { type: 'text' as const, text: m.text }]
        : m.text,
    })),
  })
  const final = await consume(session, o.feature, runner)
  return { text: textOf(final), refused: final?.stop_reason === 'refusal' }
}

// ---------------------------------------------------------------------------
// Gemini (API REST de Google AI Studio, sin librerías extra)
// ---------------------------------------------------------------------------

type GeminiPart = { text?: string; inlineData?: { mimeType: string; data: string }; functionCall?: { name: string; args?: Record<string, unknown> }; functionResponse?: { name: string; response: Record<string, unknown> } }
type GeminiContent = { role: 'user' | 'model'; parts: GeminiPart[] }

export class GeminiError extends Error {
  constructor(public status: number, message: string) { super(message); this.name = 'GeminiError' }
}

/** JSON Schema de zod para Gemini (parametersJsonSchema), sin $schema ni additionalProperties. */
function geminiSchema(schema: z.ZodObject) {
  const clean = (node: unknown): unknown => {
    if (Array.isArray(node)) return node.map(clean)
    if (!node || typeof node !== 'object') return node
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(node)) if (k !== '$schema' && k !== 'additionalProperties') out[k] = clean(v)
    return out
  }
  const json = clean(z.toJSONSchema(schema)) as Record<string, unknown>
  return Object.keys((json.properties as object) ?? {}).length ? json : undefined
}

async function runGemini(session: Session, o: AgentOptions): Promise<AgentResult> {
  const contents: GeminiContent[] = o.messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [...(m.images ?? []).map((img) => ({ inlineData: { mimeType: img.mediaType, data: img.data } })), { text: m.text }],
  }))
  const declarations = o.tools.map((t) => ({ name: t.name, description: t.description, parametersJsonSchema: geminiSchema(t.schema) }))
  let inputTokens = 0, outputTokens = 0, text = '', refused = false

  const startedAt = Date.now()
  for (let i = 0; i < 6; i++) {
    const body = JSON.stringify({
      systemInstruction: { parts: [{ text: o.system }] },
      contents,
      tools: declarations.length ? [{ functionDeclarations: declarations }] : undefined,
      generationConfig: { maxOutputTokens: 2048, temperature: 0.4 },
    })
    let res: Response | null = null
    let data: {
      candidates?: { content?: GeminiContent; finishReason?: string }[]
      usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number }
      error?: { message?: string }
    } = {}
    models: for (const model of [geminiModel, ...GEMINI_MODELS.filter((m) => m !== geminiModel)]) {
      for (let attempt = 0; attempt < 2; attempt++) {
        // Tope total: pasado 70 s se responde con el aviso de "ocupado" en vez de dejar el chat colgado.
        if (Date.now() - startedAt > 70_000) break models
        // Tope de 30 s por llamada: si Gemini se cuelga, se trata como saturado y se prueba otra versión.
        res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY ?? '' },
          body,
          signal: AbortSignal.timeout(30_000),
        }).catch(() => new Response('{}', { status: 503 }))
        data = await res.json().catch(() => ({}))
        if (res.ok) { geminiModel = model; break models }
        if (res.status === 404) break
        if (!RETRYABLE.has(res.status)) break models
        if (attempt === 0 && res.status !== 429) await sleep(1500)
        else break
      }
      console.error('IA: Gemini no disponible, probando otro modelo', model, res?.status)
    }
    if (!res?.ok) throw new GeminiError(res?.status ?? 500, data.error?.message ?? `HTTP ${res?.status}`)
    inputTokens += data.usageMetadata?.promptTokenCount ?? 0
    outputTokens += data.usageMetadata?.candidatesTokenCount ?? 0

    const candidate = data.candidates?.[0]
    if (!candidate?.content) { refused = candidate?.finishReason === 'SAFETY'; break }
    const parts = candidate.content.parts ?? []
    const calls = parts.filter((p) => p.functionCall)
    if (calls.length === 0) {
      text = parts.map((p) => p.text ?? '').join('').trim()
      break
    }
    contents.push({ role: 'model', parts })
    const responses: GeminiPart[] = []
    for (const { functionCall } of calls) {
      const spec = o.tools.find((t) => t.name === functionCall!.name)
      let result = 'Herramienta desconocida.'
      if (spec) {
        const parsed = spec.schema.safeParse(functionCall!.args ?? {})
        result = parsed.success ? await spec.run(parsed.data) : 'Datos inválidos para la herramienta.'
      }
      responses.push({ functionResponse: { name: functionCall!.name, response: { result } } })
    }
    contents.push({ role: 'user', parts: responses })
  }

  // La capa gratuita de Gemini no tiene costo; se registra igual para ver el uso.
  const { error } = await session.db.from('ai_usage').insert({
    organization_id: session.org.id, feature: o.feature, model: geminiModel,
    input_tokens: inputTokens, output_tokens: outputTokens, cache_read_tokens: 0, cost_usd: 0,
  })
  if (error) console.error('ai_usage: no se pudo registrar', error.message)
  return { text, refused }
}
