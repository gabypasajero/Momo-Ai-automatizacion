import { Input, TextArea } from '@/components/ui'

/** Campos del cliente (crear y editar). */
export function ContactFields({ contact }: {
  contact?: { name: string; phone: string | null; email: string | null; comuna: string | null; tags: string[]; notes: string | null }
}) {
  return (
    <div className="space-y-4">
      <Input label="Nombre" name="name" defaultValue={contact?.name} required maxLength={120} autoComplete="off" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Teléfono" hint="opcional" name="phone" type="tel" inputMode="tel" defaultValue={contact?.phone ?? ''} maxLength={40} placeholder="+56 9 1234 5678" />
        <Input label="Correo" hint="opcional" name="email" type="email" defaultValue={contact?.email ?? ''} maxLength={160} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Comuna" hint="opcional" name="comuna" defaultValue={contact?.comuna ?? ''} maxLength={80} />
        <Input label="Etiquetas" hint="separadas por coma" name="tags" defaultValue={contact?.tags.join(', ') ?? ''} maxLength={300} placeholder="frecuente, mayorista" />
      </div>
      <TextArea label="Notas" hint="opcional" name="notes" defaultValue={contact?.notes ?? ''} rows={3} maxLength={2000} />
    </div>
  )
}
