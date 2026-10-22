import type { Metadata } from 'next'
import { CustomersTable } from '@/features/crm/CustomersTable'
import { getRepository } from '@/lib/data'

export const metadata: Metadata = { title: 'Clientes' }

export default async function CrmPage() {
  const { items, total } = await getRepository().getContacts()
  return <CustomersTable contacts={items} total={total} />
}
