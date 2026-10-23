'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { EDITORS, MANAGERS, attempt, fail, ok, optionalText, requireRole, text, uuid, type ActionState } from '@/lib/actions'

function contactValues(form: FormData) {
  const tags = text(form, 'tags', 300).split(',').map((t) => t.trim()).filter(Boolean).slice(0, 12)
  return {
    name: text(form, 'name', 120),
    phone: optionalText(form, 'phone', 40),
    email: optionalText(form, 'email', 160),
    comuna: optionalText(form, 'comuna', 80),
    notes: optionalText(form, 'notes', 2000),
    tags: [...new Set(tags)],
  }
}

function validate(values: ReturnType<typeof contactValues>) {
  if (values.name.length < 2) return 'Escribe el nombre del cliente.'
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) return 'El correo no parece válido.'
  return null
}

export async function createContact(_prev: ActionState, form: FormData): Promise<ActionState> {
  let id = ''
  const result = await attempt(async () => {
    const session = await requireRole(EDITORS)
    const values = contactValues(form)
    const problem = validate(values)
    if (problem) return fail(problem)
    const { data, error } = await session.db.from('contacts').insert({ organization_id: session.org.id, ...values }).select('id').single()
    if (error) throw error
    id = data.id as string
    return ok()
  })
  if (!result.ok) return result
  revalidatePath('/clientes')
  redirect(`/clientes/${id}`)
}

export async function updateContact(_prev: ActionState, form: FormData): Promise<ActionState> {
  return attempt(async () => {
    const session = await requireRole(EDITORS)
    const id = uuid(form, 'id')
    const values = contactValues(form)
    const problem = validate(values)
    if (problem) return fail(problem)
    const { error } = await session.db.from('contacts').update(values).eq('organization_id', session.org.id).eq('id', id)
    if (error) throw error
    revalidatePath('/clientes')
    revalidatePath(`/clientes/${id}`)
    revalidatePath('/conversaciones')
    return ok('Cliente actualizado.')
  })
}

export async function deleteContact(_prev: ActionState, form: FormData): Promise<ActionState> {
  const result = await attempt(async () => {
    const session = await requireRole(MANAGERS)
    const { error } = await session.db.from('contacts').delete().eq('organization_id', session.org.id).eq('id', uuid(form, 'id'))
    if (error) throw error
    return ok()
  })
  if (!result.ok) return result
  revalidatePath('/clientes')
  revalidatePath('/conversaciones')
  revalidatePath('/hoy')
  redirect('/clientes')
}
