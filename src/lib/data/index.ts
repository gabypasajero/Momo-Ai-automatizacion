import 'server-only'
import { mockRepository } from './mock'
import type { Repository } from './repository'

/**
 * Punto único para obtener el repositorio de datos.
 * Cuando exista el backend: devolver aquí la implementación de Supabase
 * según la sesión y la organización del usuario.
 */
export function getRepository(): Repository {
  return mockRepository
}

export type * from './types'
