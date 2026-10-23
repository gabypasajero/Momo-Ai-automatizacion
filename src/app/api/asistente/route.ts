import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { describeAiError } from '@/lib/ai/runtime'
import { runTeamAssistant } from '@/lib/ai/team-assistant'
import { isAiConfigured } from '@/lib/env'
import { NoOrganizationError, getSession } from '@/lib/session'

export const runtime = 'nodejs'
export const maxDuration = 60

const Body = z.object({
  messages: z.array(z.object({ role: z.enum(['user', 'assistant']), text: z.string().min(1).max(2000) })).min(1).max(20),
})

/** Chat del asistente interno (Momo) para el equipo. Requiere sesión; actúa sobre la empresa activa. */
export async function POST(request: NextRequest) {
  if (!isAiConfigured()) {
    // 200 con aviso: es un estado esperado (IA sin activar), no un error del servidor.
    return NextResponse.json({ error: 'sin-clave', reply: 'Todavía no tengo conectada mi inteligencia (falta la clave de la API de Claude). Mientras tanto, usa los atajos de abajo.' })
  }

  const parsed = Body.safeParse(await request.json().catch(() => null))
  if (!parsed.success || parsed.data.messages.at(-1)?.role !== 'user') {
    return NextResponse.json({ error: 'solicitud-invalida' }, { status: 400 })
  }

  try {
    const session = await getSession()
    return NextResponse.json(await runTeamAssistant(session, parsed.data.messages))
  } catch (error) {
    if (error instanceof NoOrganizationError) return NextResponse.json({ error: 'sin-empresa' }, { status: 403 })
    if (error instanceof Error && 'digest' in error) throw error // redirect al login
    return NextResponse.json({ error: 'api', reply: describeAiError(error) }, { status: 502 })
  }
}
