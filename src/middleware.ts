import { NextResponse, type NextRequest } from 'next/server'
import { isSupabaseConfigured } from '@/lib/env'
import { updateSession } from '@/lib/supabase/middleware'

/** Dirección oficial de Momo: las direcciones de prueba de Vercel llevan aquí (ahí están las claves). */
const OFFICIAL = 'https://momo-ai-automatizacion-de-todito.vercel.app'

export async function middleware(request: NextRequest) {
  if (process.env.VERCEL_ENV === 'preview' && process.env.MOMO_PREVIEW_ABIERTO !== '1') {
    return NextResponse.redirect(new URL(request.nextUrl.pathname + request.nextUrl.search, OFFICIAL))
  }
  // Modo demo: sin Supabase no hay login.
  if (!isSupabaseConfigured) return NextResponse.next()
  return updateSession(request)
}

export const config = {
  // Todo excepto archivos estáticos e imágenes.
  matcher: ['/((?!_next/static|_next/image|icon.svg|favicon.ico|manifest.webmanifest|admin-app.webmanifest|sw.js|offline.html|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)'],
}
