import type { Metadata } from 'next'
import { PlanGrid } from '@/features/billing/PlanGrid'
import { getRepository } from '@/lib/data'

export const metadata: Metadata = { title: 'Plan y facturación' }

export default async function FacturacionPage() {
  const repo = await getRepository()
  const organization = await repo.getOrganization()
  return <PlanGrid currentPlan={organization.plan} />
}
