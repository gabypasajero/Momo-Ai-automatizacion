import { Card } from '@/components/ui'

export function ResolutionDonut({ aiPercent, humanPercent }: { aiPercent: number; humanPercent: number }) {
  const r = 40
  const c = 2 * Math.PI * r
  const fmt = (n: number) => n.toLocaleString('es-CL')
  return (
    <Card className="p-5">
      <h3 className="mb-2 text-sm font-medium">Resolución humano vs IA</h3>
      <svg viewBox="0 0 100 100" className="mx-auto h-40 w-40 -rotate-90" role="img" aria-label={`IA ${fmt(aiPercent)}%, humano ${fmt(humanPercent)}%`}>
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgb(var(--success-chart))" strokeWidth="14" />
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgb(var(--brand-500))" strokeWidth="14" strokeDasharray={`${(aiPercent / 100) * c} ${c}`} />
      </svg>
      <div className="mt-3 flex justify-center gap-4 text-sm">
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-brand-500" /> IA {fmt(aiPercent)}%</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-success-chart" /> Humano {fmt(humanPercent)}%</span>
      </div>
    </Card>
  )
}
