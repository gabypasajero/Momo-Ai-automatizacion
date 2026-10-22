/** Configuración pública de Supabase. Si falta, la app corre en modo demo con datos de prueba. */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
export const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ''

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY)

/** Esquema de Postgres donde viven las tablas de Momo. */
export const DB_SCHEMA = 'momo'
