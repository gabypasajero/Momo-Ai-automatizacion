import type { Metadata } from 'next'
import { ChannelsManager } from '@/features/channels/ChannelsManager'
import { getRepository } from '@/lib/data'

export const metadata: Metadata = { title: 'Canales' }

export default async function CanalesPage() {
  const repo = getRepository()
  const [accounts, [pipeline]] = await Promise.all([repo.getChannelAccounts(), repo.getPipelines()])
  return <ChannelsManager accounts={accounts} pipeline={pipeline} />
}
