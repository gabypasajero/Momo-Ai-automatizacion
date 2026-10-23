import { TrendingUp } from 'lucide-react'
import { Card } from './Card'

export function KpiCard({ label, value, delta }: { label: string; value: string | number; delta?: string }) {
  return (
    <Card className="p-4">
      <p className="text-sm text-muted">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-2">
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        {delta && (
          <span className="flex items-center gap-0.5 text-xs font-medium text-success">
            <TrendingUp className="h-3 w-3" aria-hidden />
            {delta}
          </span>
        )}
      </div>
    </Card>
  )
}
