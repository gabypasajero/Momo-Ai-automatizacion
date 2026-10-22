import 'server-only'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { isSupabaseConfigured } from '@/lib/env'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { mockRepository } from './mock'
import type { Repository } from './repository'
import { SupabaseRepository } from './supabase'

export class NoOrganizationError extends Error {
  constructor() {
    super('La cuenta no pertenece a ninguna empresa en Momo.')
  }
}

/**
 * Punto único de acceso a datos (una instancia por request).
 * Sin Supabase configurado devuelve los datos de prueba (modo demo).
 */
export const getRepository = cache(async (): Promise<Repository> => {
  if (!isSupabaseConfigured) return mockRepository

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const repo = await SupabaseRepository.forCurrentUser(supabase, user.id)
  if (!repo) throw new NoOrganizationError()
  return repo
})

/** Datos del usuario con sesión para el encabezado (null en modo demo). */
export const getCurrentUser = cache(async () => {
  if (!isSupabaseConfigured) return null
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('members').select('display_name').eq('user_id', user.id).not('display_name', 'is', null).limit(1).maybeSingle()
  const name = data?.display_name ?? (user.user_metadata?.full_name as string | undefined) ?? user.email ?? ''
  return { email: user.email ?? '', name }
})

export type * from './types'
