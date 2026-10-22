import { Columns3 } from 'lucide-react'
import type { Metadata } from 'next'
import { EmptyState } from '@/components/ui'
import { ChannelsManager } from '@/features/channels/ChannelsManager'
import { getRepository } from '@/lib/data'

export const metadata: Metadata = { title: 'Canales' }

export default async function CanalesPage() {
  const repo = await getRepository()
  const [accounts, [pipeline]] = await Promise.all([repo.getChannelAccounts(), repo.getPipelines()])
  if (!pipeline) return <EmptyState icon={Columns3} title="Aún no hay embudos" description="Crea un embudo antes de conectar canales." />
  return <ChannelsManager accounts={accounts} pipeline={pipeline} />
}
