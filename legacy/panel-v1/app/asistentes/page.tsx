import type { Metadata } from 'next'
import { AssistantGallery } from '@/features/assistants/AssistantGallery'
import { getRepository } from '@/lib/data'

export const metadata: Metadata = { title: 'Asistentes' }

export default async function AsistentesPage() {
  const repo = await getRepository()
  return <AssistantGallery assistants={await repo.getAssistants()} />
}
