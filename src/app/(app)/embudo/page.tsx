import type { Metadata } from 'next'
import { PipelineBoard } from '@/features/pipeline/PipelineBoard'
import { getRepository } from '@/lib/data'

export const metadata: Metadata = { title: 'Embudo' }

export default async function EmbudoPage() {
  const repo = getRepository()
  const [pipeline] = await repo.getPipelines()
  const tickets = await repo.getTickets(pipeline.id)
  return <PipelineBoard pipeline={pipeline} initialTickets={tickets} />
}
