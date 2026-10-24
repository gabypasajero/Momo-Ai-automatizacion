import { Pencil, Plus, Sparkles, Trash2 } from 'lucide-react'
import type { Metadata } from 'next'
import { ActionForm, Badge, ButtonLink, CancelButton, Card, CardTitle, Checkbox, ConfirmAction, EmptyState, Input, Modal, PageTitle, SearchForm, SubmitButton, Tabs, TextArea, buttonClass } from '@/components/ui'
import { addGap, deletePolicy, savePersonality, savePolicy, saveProduct, setProductActive } from '@/features/conocimiento/actions'
import { GapCard } from '@/features/conocimiento/GapCard'
import { PRODUCTS_PAGE, getAssistant, knowledgeCounts, listGaps, listPolicies, listProducts, type Policy, type ProductRow } from '@/features/conocimiento/queries'
import { TestMomo } from '@/features/conocimiento/TestMomo'
import { isAiConfigured } from '@/lib/env'
import { formatClp, formatNumber, formatShortDate } from '@/lib/format'
import { canEdit, canManage, getSession } from '@/lib/session'

export const metadata: Metadata = { title: 'Lo que Momo sabe' }

type Tab = 'politicas' | 'productos' | 'dudas' | 'personalidad'
const TABS: { id: Tab; label: string }[] = [
  { id: 'politicas', label: 'Políticas' },
  { id: 'productos', label: 'Productos' },
  { id: 'dudas', label: 'Dudas' },
  { id: 'personalidad', label: 'Personalidad' },
]

function PolicyForm({ policy }: { policy?: Policy }) {
  return (
    <ActionForm action={savePolicy} closeOnSuccess className="space-y-4">
      {policy && <input type="hidden" name="id" value={policy.id} />}
      <Input label="Título" name="title" defaultValue={policy?.title} required maxLength={120} placeholder="Despacho a regiones" />
      <TextArea label="Qué debe saber Momo" name="content" defaultValue={policy?.content} required rows={6} maxLength={4000}
        placeholder="Despachamos a todo Chile. A regiones el costo se cotiza según comuna y llega en 7 a 10 días hábiles." />
      <div className="flex justify-end gap-2"><CancelButton /><SubmitButton>{policy ? 'Guardar cambios' : 'Agregar política'}</SubmitButton></div>
    </ActionForm>
  )
}

function ProductForm({ product }: { product?: ProductRow }) {
  return (
    <ActionForm action={saveProduct} closeOnSuccess className="space-y-4">
      {product && <input type="hidden" name="id" value={product.id} />}
      <Input label="Nombre" name="name" defaultValue={product?.name} required maxLength={160} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Categoría" hint="opcional" name="category" defaultValue={product?.category ?? ''} maxLength={80} placeholder="Dormitorio" />
        <Input label="Medidas" hint="opcional" name="dimensions" defaultValue={product?.dimensions ?? ''} maxLength={120} placeholder="180 x 120 x 50 cm" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Precio" name="price_clp" inputMode="numeric" defaultValue={product?.price_clp ?? ''} required placeholder="189990" />
        <Input label="Precio oferta" hint="opcional" name="sale_price_clp" inputMode="numeric" defaultValue={product?.sale_price_clp ?? ''} placeholder="169990" />
      </div>
      <TextArea label="Descripción" hint="opcional" name="description" defaultValue={product?.description ?? ''} rows={4} maxLength={2000} />
      <Checkbox label="Personalizable" description="Se puede hacer con diseño propio (adhesivo ploteado)." name="customizable" defaultChecked={product?.customizable ?? false} />
      <Checkbox label="Activo" description="Momo lo ofrece y aparece al buscar productos." name="active" defaultChecked={product?.active ?? true} />
      <div className="flex justify-end gap-2"><CancelButton /><SubmitButton>{product ? 'Guardar cambios' : 'Agregar producto'}</SubmitButton></div>
    </ActionForm>
  )
}

export default async function ConocimientoPage({ searchParams }: { searchParams: Promise<{ t?: string; q?: string; p?: string; inactivos?: string }> }) {
  const params = await searchParams
  const session = await getSession()
  const tab: Tab = TABS.some((t) => t.id === params.t) ? (params.t as Tab) : 'politicas'
  const q = params.q?.trim() || undefined
  const editable = canEdit(session.role)
  const manager = canManage(session.role)
  const counts = await knowledgeCounts(session)

  let content: React.ReactNode
  if (tab === 'politicas') {
    const policies = await listPolicies(session, q)
    content = (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <SearchForm action="/conocimiento" defaultValue={q} placeholder="Buscar en las políticas" keep={{ t: 'politicas' }} className="min-w-0 flex-[1_1_300px]" />
          {editable && <Modal trigger={<><Plus className="h-4 w-4" aria-hidden />Agregar política</>} triggerVariant="primary" title="Nueva política" size="lg"
            description="Escríbela como se la explicarías a un cliente: Momo la usará tal cual."><PolicyForm /></Modal>}
        </div>
        {policies.length === 0 ? (
          <EmptyState title={q ? 'Sin resultados' : 'Aún no hay políticas'} description={q ? `Ninguna política menciona "${q}".` : 'Agrega despacho, formas de pago, garantías y horarios para que Momo responda sin inventar.'} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {policies.map((p) => (
              <Card key={p.id} className="flex flex-col gap-2 p-5">
                <h2 className="font-display text-lg font-bold">{p.title}</h2>
                <p className="flex-1 whitespace-pre-line text-sm text-muted">{p.content}</p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="mr-auto text-xs text-muted">Actualizada {formatShortDate(p.updated_at)}</span>
                  {editable && <Modal trigger={<><Pencil className="h-4 w-4" aria-hidden />Editar</>} triggerSize="sm" title="Editar política" size="lg"><PolicyForm policy={p} /></Modal>}
                  {manager && <ConfirmAction action={deletePolicy} fields={{ id: p.id }} trigger={<Trash2 className="h-4 w-4" aria-hidden />} triggerLabel={`Eliminar ${p.title}`}
                    triggerVariant="ghost" triggerSize="sm" title="¿Eliminar esta política?" description={`Momo dejará de saber "${p.title}".`} confirmLabel="Eliminar" />}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    )
  } else if (tab === 'productos') {
    const page = Math.max(1, Number(params.p) || 1)
    const inactive = params.inactivos === '1'
    const { rows, total } = await listProducts(session, { q, page, inactive })
    const pages = Math.max(1, Math.ceil(total / PRODUCTS_PAGE))
    const href = (p: number) => `/conocimiento?t=productos${q ? `&q=${encodeURIComponent(q)}` : ''}${inactive ? '&inactivos=1' : ''}&p=${p}`
    content = (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <SearchForm action="/conocimiento" defaultValue={q} placeholder="Buscar productos" keep={{ t: 'productos', inactivos: inactive ? '1' : undefined }} className="min-w-0 flex-[1_1_300px]" />
          <ButtonLink href={inactive ? '/conocimiento?t=productos' : '/conocimiento?t=productos&inactivos=1'} variant="secondary">{inactive ? 'Ver activos' : 'Ver inactivos'}</ButtonLink>
          {editable && <Modal trigger={<><Plus className="h-4 w-4" aria-hidden />Agregar producto</>} triggerVariant="primary" title="Nuevo producto" size="lg"><ProductForm /></Modal>}
        </div>
        <p className="text-sm text-muted">{formatNumber(total)} {inactive ? 'productos inactivos' : 'productos activos'}. Los productos de la tienda se sincronizan con su precio actual.</p>
        {rows.length === 0 ? (
          <EmptyState title="Sin productos" description={q ? `No hay productos con "${q}".` : 'Agrega tu primer producto o pide que sincronicemos tu tienda.'} />
        ) : (
          <div className="relative overflow-x-auto rounded-3xl border border-line bg-white">
            <table className="w-full min-w-[640px] text-sm">
              <caption className="sr-only">Productos</caption>
              <thead className="bg-surface text-left text-xs uppercase tracking-wide text-muted">
                <tr><th scope="col" className="p-3">Producto</th><th scope="col" className="p-3">Categoría</th><th scope="col" className="p-3 text-right">Precio</th><th scope="col" className="p-3"><span className="sr-only">Acciones</span></th></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((p) => (
                  <tr key={p.id}>
                    <td className="p-3"><p className="font-bold">{p.name}</p><p className="text-xs text-muted">{[p.dimensions, p.customizable ? 'Personalizable' : null].filter(Boolean).join(' · ')}</p></td>
                    <td className="p-3 text-muted">{p.category ?? '—'}</td>
                    <td className="p-3 text-right">
                      {p.sale_price_clp ? <><span className="font-extrabold text-success">{formatClp(p.sale_price_clp)}</span><span className="block text-xs text-muted line-through">{formatClp(p.price_clp)}</span></> : <span className="font-extrabold">{formatClp(p.price_clp)}</span>}
                    </td>
                    <td className="p-3">
                      {editable && (
                        <div className="flex justify-end gap-1">
                          <Modal trigger={<Pencil className="h-4 w-4" aria-hidden />} triggerLabel={`Editar ${p.name}`} triggerVariant="ghost" triggerSize="sm" title="Editar producto" size="lg"><ProductForm product={p} /></Modal>
                          <form action={setProductActive}>
                            <input type="hidden" name="id" value={p.id} />
                            <input type="hidden" name="active" value={p.active ? 'false' : 'true'} />
                            <button type="submit" className={buttonClass('ghost', 'sm')}>{p.active ? 'Desactivar' : 'Activar'}</button>
                          </form>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pages > 1 && (
          <nav aria-label="Páginas de productos" className="flex items-center justify-center gap-2">
            {page > 1 && <ButtonLink href={href(page - 1)} variant="secondary" size="sm">Anterior</ButtonLink>}
            <span className="text-sm font-bold text-muted">Página {page} de {pages}</span>
            {page < pages && <ButtonLink href={href(page + 1)} variant="secondary" size="sm">Siguiente</ButtonLink>}
          </nav>
        )}
      </div>
    )
  } else if (tab === 'dudas') {
    const gaps = await listGaps(session)
    content = (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <p className="min-w-0 flex-1 text-muted">Preguntas de clientes que Momo no supo responder. Al enseñarle, la respuesta queda como política.</p>
          {editable && (
            <Modal trigger={<><Plus className="h-4 w-4" aria-hidden />Anotar duda</>} triggerVariant="secondary" title="Anotar una duda frecuente"
              description="¿Hay algo que los clientes preguntan seguido y Momo aún no sabe? Anótalo para responderlo después.">
              <ActionForm action={addGap} closeOnSuccess className="space-y-4">
                <TextArea label="Pregunta del cliente" name="question" rows={3} required maxLength={300} placeholder="¿Hacen despacho a Rancagua?" />
                <div className="flex justify-end gap-2"><CancelButton /><SubmitButton>Anotar</SubmitButton></div>
              </ActionForm>
            </Modal>
          )}
        </div>
        {gaps.length === 0
          ? <EmptyState title="Sin dudas pendientes" description="Cuando Momo no sepa responder algo, lo anotará aquí para que se lo enseñes." />
          : <div className="space-y-3">{gaps.map((g) => <GapCard key={g.id} gap={g} compact editable={editable} />)}</div>}
      </div>
    )
  } else {
    const assistant = await getAssistant(session)
    content = (
      <div className="grid items-start gap-5 lg:grid-cols-2">
        <Card className="space-y-4 p-5">
          <div className="flex items-center justify-between gap-2"><CardTitle>Cómo atiende Momo</CardTitle><Badge tone="accent">IA de ventas</Badge></div>
          {!assistant ? <p className="text-sm text-muted">Esta empresa aún no tiene asistente configurado. Escríbenos para activarlo.</p> : manager ? (
            <ActionForm action={savePersonality} className="space-y-4">
              <input type="hidden" name="assistant_id" value={assistant.id} />
              <Input label="Nombre del asistente" name="name" defaultValue={assistant.name} required maxLength={60} />
              <TextArea label="Instrucciones" hint="tono, reglas del negocio, qué derivar" name="system_prompt" defaultValue={assistant.system_prompt} rows={14} required maxLength={8000} />
              <p className="text-xs text-muted">Momo además conoce tus {counts.politicas} políticas y busca en tus {formatNumber(counts.productos)} productos. Última edición {formatShortDate(assistant.updated_at)}.</p>
              <SubmitButton>Guardar instrucciones</SubmitButton>
            </ActionForm>
          ) : (
            <>
              <p className="font-bold">{assistant.name}</p>
              <p className="whitespace-pre-line text-sm text-muted">{assistant.system_prompt}</p>
              <p className="text-xs text-muted">Solo el dueño o un administrador puede cambiar las instrucciones.</p>
            </>
          )}
        </Card>
        <Card id="probar" className="scroll-mt-6 space-y-4 p-5 lg:order-first">
          <CardTitle>Probar a Momo</CardTitle>
          <p className="text-sm text-muted">Escribe como si fueras un cliente. Momo responde con tus políticas y tu catálogo; la prueba no se guarda.</p>
          <TestMomo aiReady={isAiConfigured()} />
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <PageTitle title="Lo que Momo sabe" description="Todo lo que Momo usa para responder a tus clientes, sin inventar."
        actions={<ButtonLink href="/conocimiento?t=personalidad#probar" variant="primary"><Sparkles className="h-4 w-4" aria-hidden />Probar a Momo</ButtonLink>} />
      <Tabs label="Secciones" active={tab} items={TABS.map((t) => ({
        id: t.id, label: t.label, href: `/conocimiento?t=${t.id}`,
        count: t.id === 'politicas' ? counts.politicas : t.id === 'productos' ? counts.productos : t.id === 'dudas' ? counts.dudas : undefined,
      }))} />
      {content}
    </div>
  )
}
