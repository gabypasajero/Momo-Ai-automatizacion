'use client'

import { Bookmark, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { Card, ChannelIcon } from '@/components/ui'
import { CHANNELS, CHANNEL_ORDER } from '@/config/channels'
import type { ChannelType } from '@/lib/data/types'
import { cn } from '@/lib/cn'

const SECTIONS = ['Fecha', 'Principal', 'Orden', 'Embudo y etapa', 'Canales', 'Ejecutivos', 'Etiquetas', 'Estado del ticket']

export function ChatFilters({ channel, onChannelChange }: { channel: ChannelType | null; onChannelChange: (c: ChannelType | null) => void }) {
  const [tab, setTab] = useState<'chat' | 'correos'>('chat')
  const [open, setOpen] = useState<string | null>('Canales')

  return (
    <Card className="hidden w-60 shrink-0 flex-col p-3 lg:flex">
      <p className="text-xs font-semibold uppercase text-muted">Filtros guardados</p>
      <button type="button" className="mt-2 flex items-center justify-between rounded-lg border border-line px-3 py-1.5 text-xs text-muted">
        No tienes filtros guardados <Bookmark className="h-3.5 w-3.5" aria-hidden />
      </button>
      <div role="tablist" className="mt-3 grid grid-cols-2 rounded-lg bg-surface p-0.5 text-sm">
        {(['chat', 'correos'] as const).map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={cn('rounded-md py-1 capitalize', tab === t ? 'bg-white shadow-sm' : 'text-muted')}>{t}</button>
        ))}
      </div>
      <div className="mt-3 divide-y divide-line text-sm">
        {SECTIONS.map((section) => (
          <div key={section}>
            <button type="button" aria-expanded={open === section} onClick={() => setOpen(open === section ? null : section)}
              className="flex w-full items-center justify-between py-2">
              {section} <ChevronDown className={cn('h-4 w-4 transition', open === section && 'rotate-180')} aria-hidden />
            </button>
            {open === section && (section === 'Canales' ? (
              <div className="space-y-1 pb-2">
                {CHANNEL_ORDER.map((c) => (
                  <label key={c} className="flex items-center gap-2 text-xs">
                    <input type="radio" name="channel" checked={channel === c} onChange={() => onChannelChange(c)} />
                    <ChannelIcon channel={c} /> {CHANNELS[c].label}
                  </label>
                ))}
                <button type="button" onClick={() => onChannelChange(null)} className="text-xs text-brand-600">Limpiar</button>
              </div>
            ) : <p className="pb-2 text-xs text-muted">Sin opciones seleccionadas</p>)}
          </div>
        ))}
      </div>
    </Card>
  )
}
