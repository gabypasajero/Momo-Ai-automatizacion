import type { Metadata } from 'next'
import { ChatInbox } from '@/features/chat/ChatInbox'
import { getRepository } from '@/lib/data'

export const metadata: Metadata = { title: 'Chat' }

export default async function ChatPage() {
  const repo = await getRepository()
  return <ChatInbox initialConversations={await repo.getConversations()} />
}
