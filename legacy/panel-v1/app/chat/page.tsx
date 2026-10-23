import type { Metadata } from 'next'
import { ChatInbox } from '@/features/chat/ChatInbox'
import { getRepository } from '@/lib/data'

export const metadata: Metadata = { title: 'Chat' }

export default async function ChatPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const [{ c }, repo] = await Promise.all([searchParams, getRepository()])
  return <ChatInbox initialConversations={await repo.getConversations()} initialSelectedId={c ?? null} />
}
