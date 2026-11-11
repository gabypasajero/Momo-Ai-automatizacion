import { NextResponse, type NextRequest } from 'next/server'

/**
 * Webhook de Messenger (Meta). Meta lo llama con GET para verificar la dirección
 * y con POST cuando llega un mensaje a la página de De Todito Outlet.
 * Por ahora solo verifica y confirma la recepción; las respuestas automáticas
 * se activan después de probar las sugerencias en Conversaciones.
 */

/** Meta verifica la dirección: responde el "challenge" solo si el token coincide. */
export function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const token = process.env.META_WEBHOOK_VERIFY_TOKEN
  if (
    searchParams.get('hub.mode') === 'subscribe' &&
    token &&
    searchParams.get('hub.verify_token') === token
  ) {
    return new NextResponse(searchParams.get('hub.challenge') ?? '', { status: 200 })
  }
  return NextResponse.json({ error: 'verificación fallida' }, { status: 403 })
}

/** Mensajes entrantes. Se confirman con 200 para que Meta no los reenvíe. */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { object?: string } | null
  if (body?.object !== 'page') return NextResponse.json({ error: 'objeto no soportado' }, { status: 404 })
  return NextResponse.json({ received: true })
}
