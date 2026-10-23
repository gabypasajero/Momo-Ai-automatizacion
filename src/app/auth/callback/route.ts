import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/** Recibe los enlaces de Supabase Auth (invitación, recuperar contraseña) y abre la sesión. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/hoy'
  const safe = next.startsWith('/') && !next.startsWith('//') ? next : '/hoy'

  if (code) {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${safe}`)
  }
  // Enlace vencido o abierto en otro navegador: se puede pedir uno nuevo.
  return NextResponse.redirect(`${origin}/recuperar?error=enlace`)
}
