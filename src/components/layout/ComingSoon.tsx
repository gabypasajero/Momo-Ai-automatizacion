import { Sparkles, type LucideIcon } from 'lucide-react'
import { Mascot } from '@/components/brand'
import { Card } from '@/components/ui'

export function ComingSoon({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <Card className="mx-auto mt-10 max-w-lg p-10 text-center">
      <Mascot variant="full" className="mx-auto h-24 w-auto" title="" />
      <Icon className="mx-auto mt-2 h-6 w-6 text-brand-600" aria-hidden />
      <h2 className="mt-3 text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted">{description}</p>
      <span className="mt-4 inline-flex items-center gap-1 rounded-full bg-brand-100 px-3 py-1 text-xs text-brand-700">
        <Sparkles className="h-3 w-3" aria-hidden /> En el roadmap
      </span>
    </Card>
  )
}
