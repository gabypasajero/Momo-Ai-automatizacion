import Anthropic from '@anthropic-ai/sdk'
import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { runSellerAssistant } from '@/lib/assistant/seller-assistant'
import { NoOrganizationError, getRepository } from '@/lib/data'

export const runtime = 'nodejs'
export const maxDuration = 60

const Body = z.object({
  messages: z.array(z.object({ role: z.enum(['user', 'assistant']), text: z.string().min(1).max(2000) })).min(1).max(20),
})

/** Chat del asistente interno (Momo) para vendedores. Requiere sesión; actúa sobre la empresa activa. */
export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'sin-clave', reply: 'Todavía no tengo conectada mi inteligencia (falta la clave de la API de Claude). Mientras tanto, usa los atajos de abajo.' }, { status: 503 })
  }

  const parsed = Body.safeParse(await request.json().catch(() => null))
  if (!parsed.success || parsed.data.messages.at(-1)?.role !== 'user') {
    return NextResponse.json({ error: 'solicitud-invalida' }, { status: 400 })
  }

  try {
    const repo = await getRepository() // exige sesión en modo real
    return NextResponse.json(await runSellerAssistant(repo, parsed.data.messages))
  } catch (error) {
    if (error instanceof NoOrganizationError) return NextResponse.json({ error: 'sin-empresa' }, { status: 403 })
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: 'limite', reply: 'Estoy recibiendo muchas consultas. Prueba de nuevo en un minuto.' }, { status: 429 })
    }
    if (error instanceof Anthropic.APIError) {
      console.error('asistente: error de la API', error.status, error.message)
      return NextResponse.json({ error: 'api', reply: 'Tuve un problema para pensar la respuesta. Intenta otra vez.' }, { status: 502 })
    }
    throw error
  }
}
