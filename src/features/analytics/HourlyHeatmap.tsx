import { Card } from '@/components/ui'

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const hourLabel = (h: number) => `${h % 12 || 12}${h < 12 ? 'am' : 'pm'}`

export function HourlyHeatmap({ data }: { data: number[][] }) {
  const max = Math.max(1, ...data.flat())
  return (
    <Card className="p-5">
      <h3 className="mb-3 text-sm font-medium">Mensajes recibidos por horario</h3>
      <div className="overflow-x-auto">
        <div className="ml-16 flex text-[10px] text-muted">
          {Array.from({ length: 24 }, (_, h) => <span key={h} className="w-5 shrink-0 text-center">{h % 3 === 0 ? hourLabel(h) : ''}</span>)}
        </div>
        {DAYS.map((day, d) => (
          <div key={day} className="mt-0.5 flex items-center">
            <span className="w-16 shrink-0 text-xs text-muted">{day}</span>
            {data[d].map((v, h) => (
              <span key={h} title={`${day} ${h}:00 · ${v} mensajes`}
                className="mr-0.5 h-4 w-[18px] shrink-0 rounded-sm bg-brand-500" style={{ opacity: Math.max(0.07, v / max) }} />
            ))}
          </div>
        ))}
      </div>
    </Card>
  )
}
