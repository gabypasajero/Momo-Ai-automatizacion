import { CHANNELS } from '@/config/sales'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

const cell = (value: string | number | null | undefined) => `"${String(value ?? '').replace(/"/g, '""')}"`

/** Descarga todos los clientes en CSV (separado por punto y coma: abre directo en Excel en español). */
export async function GET() {
  const { db, org } = await getSession()
  const { data, error } = await db.from('contacts')
    .select('name, phone, email, comuna, tags, notes, created_at, tickets(status, value_clp, delivery_clp), conversations(channel, last_message_at)')
    .eq('organization_id', org.id).order('created_at', { ascending: false }).limit(10000)
  if (error) return new Response('No se pudo exportar', { status: 500 })

  const header = ['Nombre', 'Teléfono', 'Correo', 'Comuna', 'Etiquetas', 'Compras', 'Total comprado', 'Último canal', 'Cliente desde', 'Notas']
  const lines = (data ?? []).map((c) => {
    const won = (c.tickets as { status: string; value_clp: number; delivery_clp: number }[]).filter((t) => t.status === 'won')
    const last = [...(c.conversations as { channel: keyof typeof CHANNELS; last_message_at: string | null }[])]
      .sort((a, b) => (b.last_message_at ?? '').localeCompare(a.last_message_at ?? ''))[0]
    return [c.name, c.phone, c.email, c.comuna, (c.tags ?? []).join(', '), won.length, won.reduce((s, t) => s + t.value_clp + t.delivery_clp, 0),
      last ? CHANNELS[last.channel]?.label : '', c.created_at.slice(0, 10), c.notes].map(cell).join(';')
  })
  const csv = '﻿' + [header.map(cell).join(';'), ...lines].join('\r\n')
  const date = new Date().toISOString().slice(0, 10)
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="clientes-${org.slug}-${date}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
