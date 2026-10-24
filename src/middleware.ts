import { NextResponse, type NextRequest } from 'next/server'
import { isSupabaseConfigured } from '@/lib/env'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Modo demo: sin Supabase no hay login.
  if (!isSupabaseConfigured) return NextResponse.next()
  return updateSession(request)
}

export const config = {
  // Todo excepto archivos estáticos e imágenes.
  matcher: ['/((?!_next/static|_next/image|icon.svg|favicon.ico|manifest.webmanifest|admin-app.webmanifest|sw.js|offline.html|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)'],
}
