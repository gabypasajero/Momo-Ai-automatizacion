/** Configuración pública de Supabase (la seguridad la dan las políticas RLS). */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
export const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ''

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY)

/** Esquema de Postgres donde viven las tablas de Momo. */
export const DB_SCHEMA = 'momo'

/** ¿Está activa la inteligencia de Momo? (clave de la API de Claude, solo en el servidor) */
export const isAiConfigured = () => Boolean(process.env.ANTHROPIC_API_KEY)
