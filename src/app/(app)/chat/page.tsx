import type { Metadata } from 'next'
import { ChatInbox } from '@/features/chat/ChatInbox'
import { getRepository } from '@/lib/data'

export const metadata: Metadata = { title: 'Chat' }

export default async function ChatPage() {
  return <ChatInbox initialConversations={await getRepository().getConversations()} />
}
