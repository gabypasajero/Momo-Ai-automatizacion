import { Columns3 } from 'lucide-react'
import type { Metadata } from 'next'
import { EmptyState } from '@/components/ui'
import { PipelineBoard } from '@/features/pipeline/PipelineBoard'
import { getRepository } from '@/lib/data'

export const metadata: Metadata = { title: 'Embudo' }

export default async function EmbudoPage() {
  const repo = await getRepository()
  const [pipeline] = await repo.getPipelines()
  if (!pipeline) return <EmptyState icon={Columns3} title="Aún no hay embudos" description="Crea un embudo de ventas para empezar a ordenar tus conversaciones." />
  return <PipelineBoard pipeline={pipeline} initialTickets={await repo.getTickets(pipeline.id)} />
}
