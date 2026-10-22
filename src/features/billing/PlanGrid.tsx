import { Check, Zap } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { ADD_ONS, PLANS, SETUP_FEE_CLP } from '@/config/plans'
import type { PlanId } from '@/lib/data/types'
import { cn } from '@/lib/cn'
import { formatClp, formatNumber } from '@/lib/format'

export function PlanGrid({ currentPlan }: { currentPlan: PlanId }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">Elige tu plan</h2>
        <p className="text-sm text-muted">Precios mensuales en CLP + IVA. Implementación guiada desde {formatClp(SETUP_FEE_CLP)} (pago único).</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {PLANS.map((p) => {
          const current = p.id === currentPlan
          return (
            <Card key={p.id} className={cn('relative flex flex-col p-5', p.highlighted && 'ring-2 ring-brand-500')}>
              {p.highlighted && <span className="absolute -top-3 left-5 rounded-full bg-brand-600 px-3 py-0.5 text-xs font-semibold text-white">Más popular</span>}
              <h3 className="font-semibold">{p.name}</h3>
              <p className="text-xs text-muted">{p.description}</p>
              <p className="mt-4 text-3xl font-bold">{p.priceClp ? formatClp(p.priceClp) : 'A medida'}</p>
              {p.priceClp && <p className="text-xs text-muted">/mes</p>}
              <ul className="mt-4 flex-1 space-y-2 text-sm">
                {p.features.map((f) => <li key={f} className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-success" aria-hidden />{f}</li>)}
              </ul>
              <Button variant={p.highlighted ? 'primary' : 'secondary'} disabled={current} className="mt-5">
                {current ? 'Plan actual' : p.priceClp ? 'Elegir plan' : 'Hablar con ventas'}
              </Button>
            </Card>
          )
        })}
      </div>
      <Card className="flex items-center gap-3 p-4 text-sm">
        <Zap className="h-5 w-5 text-warning" aria-hidden />
        Paquetes extra: +{formatNumber(ADD_ONS.aiConversationsPack.amount)} conversaciones IA por {formatClp(ADD_ONS.aiConversationsPack.priceClp)} · usuarios adicionales {formatClp(ADD_ONS.extraUserClp)}/mes.
      </Card>
    </div>
  )
}
