'use client'

import { useEffect } from 'react'
import { markRead } from './actions'

/** Al abrir una conversación con mensajes sin leer, los marca como leídos. */
export function MarkRead({ id, unread }: { id: string; unread: number }) {
  useEffect(() => {
    if (unread > 0) void markRead(id)
  }, [id, unread])
  return null
}
