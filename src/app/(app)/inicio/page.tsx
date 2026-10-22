import type { Metadata } from 'next'
import { HomeOverview } from '@/features/home/HomeOverview'
import { getCurrentUser, getRepository } from '@/lib/data'

export const metadata: Metadata = { title: 'Inicio' }

export default async function InicioPage() {
  const repo = await getRepository()
  const [[pipeline], analytics, user] = await Promise.all([repo.getPipelines(), repo.getAnalyticsSummary(), getCurrentUser()])
  const tickets = pipeline ? await repo.getTickets(pipeline.id) : []
  const userName = user?.name.split(/[\s@]/)[0] ?? 'Gaby'
  return <HomeOverview tickets={tickets} aiCoverage={analytics.aiCoverage.percent} userName={userName} />
}
