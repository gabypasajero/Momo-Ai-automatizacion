import type { Metadata } from 'next'
import { AnalyticsDashboard } from '@/features/analytics/AnalyticsDashboard'
import { getRepository } from '@/lib/data'

export const metadata: Metadata = { title: 'Analítica' }

export default async function AnaliticaPage() {
  return <AnalyticsDashboard summary={await getRepository().getAnalyticsSummary()} />
}
