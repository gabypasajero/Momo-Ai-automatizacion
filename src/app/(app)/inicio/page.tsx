import type { Metadata } from 'next'
import { HomeOverview } from '@/features/home/HomeOverview'
import { getRepository } from '@/lib/data'

export const metadata: Metadata = { title: 'Inicio' }

export default async function InicioPage() {
  const repo = getRepository()
  const [pipeline] = await repo.getPipelines()
  const [tickets, analytics] = await Promise.all([repo.getTickets(pipeline.id), repo.getAnalyticsSummary()])
  return <HomeOverview tickets={tickets} aiCoverage={analytics.aiCoverage.percent} userName="Gaby" />
}
