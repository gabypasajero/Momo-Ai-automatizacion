import { redirect } from 'next/navigation'

// TODO: reemplazar por la landing pública cuando exista el sitio comercial.
export default function RootPage() {
  redirect('/inicio')
}
