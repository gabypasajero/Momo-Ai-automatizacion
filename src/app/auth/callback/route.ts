import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/** Recibe los enlaces de Supabase Auth (invitación, recuperar contraseña) y abre la sesión. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/inicio'
  const safe = next.startsWith('/') && !next.startsWith('//') ? next : '/inicio'

  if (code) {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${safe}`)
  }
  return NextResponse.redirect(`${origin}/login`)
}
