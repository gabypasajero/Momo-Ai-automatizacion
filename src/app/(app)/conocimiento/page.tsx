import { Pencil, Plus, Sparkles, Trash2 } from 'lucide-react'
import type { Metadata } from 'next'
import { ActionForm, Badge, ButtonLink, CancelButton, Card, CardTitle, Checkbox, ConfirmAction, EmptyState, Input, Modal, PageTitle, SearchForm, SubmitButton, Tabs, TextArea, buttonClass } from '@/components/ui'
import { addGap, deletePolicy, forgetMemory, savePersonality, savePolicy, saveProduct, setProductActive } from '@/features/conocimiento/actions'
import { AnalyzeWeek } from '@/features/conocimiento/AnalyzeWeek'
import { GapCard } from '@/features/conocimiento/GapCard'
import { latestLearningReport } from '@/lib/ai/learning'
import { PRODUCTS_PAGE, getAssistant, knowledgeCounts, listGaps, listMemory, listPolicies, listProducts, listTrainingSessions, type Policy, type ProductRow } from '@/features/conocimiento/queries'
import { TrainMomo } from '@/features/conocimiento/TrainMomo'
import { isAiConfigured } from '@/lib/env'
import { formatClp, formatNumber, formatShortDate } from '@/lib/format'
import { canEdit, canManage, getSession } from '@/lib/session'

export const metadata: Metadata = { title: 'Lo que Momo sabe' }

type Tab = 'probar' | 'memoria' | 'politicas' | 'productos' | 'dudas' | 'personalidad'
const TABS: { id: Tab; label: string }[] = [
  { id: 'probar', label: 'Entrenar a Momo' },
  { id: 'memoria', label: 'Aprendizaje' },
  { id: 'politicas', label: 'Políticas' },
  { id: 'productos', label: 'Productos' },
  { id: 'dudas', label: 'Dudas' },
  { id: 'personalidad', label: 'Personalidad' },
]

function PolicyForm({ policy }: { policy?: Partial<Policy> & { title: string; content: string } }) {
  return (
    <ActionForm action={savePolicy} closeOnSuccess className="space-y-4">
      {policy?.id && <input type="hidden" name="id" value={policy.id} />}
      <Input label="Título" name="title" defaultValue={policy?.title} required maxLength={120} placeholder="Despacho a regiones" />
      <TextArea label="Qué debe saber Momo" name="content" defaultValue={policy?.content} required rows={6} maxLength={4000}
        placeholder="Despachamos a todo Chile. A regiones el costo se cotiza según comuna y llega en 7 a 10 días hábiles." />
      <div className="flex justify-end gap-2"><CancelButton /><SubmitButton>{policy?.id ? 'Guardar cambios' : 'Agregar política'}</SubmitButton></div>
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
  if (tab === 'probar') {
    content = (
      <div className="mx-auto max-w-3xl space-y-3">
        <p className="text-sm text-muted">Conversa con Momo como si fueras un cliente. Si responde bien, toca <b>Bien</b>; si no, toca <b>Corregir</b> y escribe cómo debió responder: queda guardado. Lo que no sepa lo anotará en <b>Dudas</b> para que se lo enseñes.</p>
        <TrainMomo aiReady={isAiConfigured()} />
      </div>
    )
  } else if (tab === 'memoria') {
    const [memory, sessions, report] = await Promise.all([listMemory(session), listTrainingSessions(session), latestLearningReport(session)])
    const r = report?.data
    content = (
      <div className="space-y-5">
        <Card className="space-y-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <CardTitle>Lo que Momo aprendió esta semana</CardTitle>
              <p className="text-sm text-muted">{report ? `Análisis del ${formatShortDate(report.period_start)} al ${formatShortDate(report.period_end)}` : 'Momo revisa las conversaciones, entrenamientos y dudas de los últimos 7 días y te dice qué mejorar.'}</p>
            </div>
            {editable && <AnalyzeWeek hasReport={Boolean(report)} aiReady={isAiConfigured()} />}
          </div>
          {r && (
            <div className="space-y-5">
              <p className="rounded-2xl bg-brand-50 p-4">{r.resumen}</p>
              <ul className="flex flex-wrap gap-2 text-sm">
                {[[r.datos.conversaciones, 'conversaciones'], [r.datos.entrenamientos, 'entrenamientos'], [r.datos.ventas, 'ventas cerradas'], [r.datos.dudas, 'dudas pendientes']].map(([n, l]) => (
                  <li key={l} className="rounded-full bg-surface px-3 py-1.5 ring-1 ring-line"><b>{n}</b> {l}</li>
                ))}
              </ul>
              {r.preguntas_frecuentes.length > 0 && (
                <section className="space-y-2"><h3 className="font-extrabold">Lo que más preguntan</h3>
                  <ul className="space-y-1.5">{r.preguntas_frecuentes.map((p) => (
                    <li key={p.pregunta} className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="min-w-0 flex-1">{p.pregunta}</span>
                      <span className="text-xs text-muted">{p.veces} {p.veces === 1 ? 'vez' : 'veces'}</span>
                      <Badge tone={p.tiene_respuesta ? 'success' : 'danger'}>{p.tiene_respuesta ? 'Momo sabe' : 'Falta enseñarle'}</Badge>
                    </li>))}</ul>
                </section>
              )}
              {r.objeciones.length > 0 && (
                <section className="space-y-2"><h3 className="font-extrabold">Objeciones de los clientes</h3>
                  <ul className="space-y-2">{r.objeciones.map((o) => (
                    <li key={o.objecion} className="rounded-2xl bg-surface p-3 text-sm"><p className="font-bold">«{o.objecion}»</p><p className="mt-1 text-muted">Cómo responder: {o.como_responder}</p></li>))}</ul>
                </section>
              )}
              {r.lo_que_funciono.length > 0 && (
                <section className="space-y-2"><h3 className="font-extrabold">Lo que funcionó</h3>
                  <ul className="space-y-2">{r.lo_que_funciono.map((l) => (
                    <li key={l.situacion} className="rounded-2xl bg-success-soft p-3 text-sm"><p className="font-bold text-success">{l.situacion}</p><p className="mt-1">{l.respuesta}</p></li>))}</ul>
                </section>
              )}
              {r.politicas_sugeridas.length > 0 && (
                <section className="space-y-2"><h3 className="font-extrabold">Políticas que Momo te sugiere agregar</h3>
                  <p className="text-xs text-muted">Revisa cada una y completa lo que diga [definir: …] antes de guardarla.</p>
                  <ul className="space-y-2">{r.politicas_sugeridas.map((p) => (
                    <li key={p.titulo} className="flex flex-wrap items-start gap-3 rounded-2xl border border-line p-3 text-sm">
                      <div className="min-w-0 flex-[1_1_240px]"><p className="font-bold">{p.titulo}</p><p className="mt-1 whitespace-pre-line">{p.contenido}</p><p className="mt-1 text-xs text-muted">Por qué: {p.por_que}</p></div>
                      {editable && <Modal trigger={<><Plus className="h-4 w-4" aria-hidden />Revisar y agregar</>} triggerSize="sm" title="Agregar política sugerida" size="lg"
                        description="Ajusta el texto y completa lo que falte. Momo la usará tal cual."><PolicyForm policy={{ title: p.titulo, content: p.contenido }} /></Modal>}
                    </li>))}</ul>
                </section>
              )}
            </div>
          )}
        </Card>
        <h2 className="pt-2 font-display text-xl font-bold">Memoria de Momo</h2>
        <p className="max-w-3xl text-sm text-muted">Cada vez que en el entrenamiento tocas <b>Bien</b> o <b>Corregir</b>, la respuesta queda aquí. Momo usa las 25 más recientes como ejemplo para responder a tus clientes; las corregidas pesan más.</p>
        {memory.length === 0 ? (
          <EmptyState title="Momo aún no tiene recuerdos" description="Entrénalo en la pestaña “Entrenar a Momo” y marca sus respuestas con Bien o Corregir." />
        ) : (
          <ul className="space-y-3">
            {memory.map((m) => (
              <li key={m.id}><Card className="space-y-2 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={m.kind === 'corregida' ? 'brand' : 'success'}>{m.kind === 'corregida' ? 'Corregida' : 'Aprobada'}</Badge>
                  <span className="text-xs text-muted">{m.source === 'conversacion' ? 'De una conversación real' : 'Del entrenamiento'} · {formatShortDate(m.created_at)}</span>
                  {editable && <span className="ml-auto"><ConfirmAction action={forgetMemory} fields={{ memory_id: m.id }} trigger={<Trash2 className="h-4 w-4" aria-hidden />} triggerLabel="Olvidar esta respuesta"
                    triggerVariant="ghost" triggerSize="sm" title="¿Olvidar esta respuesta?" description="Momo dejará de usarla como ejemplo." confirmLabel="Olvidar" /></span>}
                </div>
                <p className="text-sm"><span className="font-bold">Cliente:</span> {m.question}</p>
                <p className="whitespace-pre-line text-sm"><span className="font-bold">Momo:</span> {m.answer}</p>
              </Card></li>
            ))}
          </ul>
        )}
        <Card className="space-y-3 p-5">
          <CardTitle>Últimos entrenamientos</CardTitle>
          {sessions.length === 0 ? <p className="text-sm text-muted">Aún no hay conversaciones de entrenamiento guardadas.</p> : (
            <ul className="divide-y divide-line">
              {sessions.map((t) => (
                <li key={t.id} className="py-2">
                  <details>
                    <summary className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold">
                      {t.messages.find((m) => m.author === 'client')?.body.slice(0, 70) || 'Conversación'}<span className="ml-auto shrink-0 text-xs font-normal text-muted">{t.turns} {t.turns === 1 ? 'mensaje' : 'mensajes'} · {formatShortDate(t.updated_at)}</span>
                    </summary>
                    <div className="mt-2 space-y-1.5 rounded-2xl bg-surface p-3 text-sm">
                      {t.messages.map((m, i) => (
                        <p key={i} className={m.author === 'note' ? 'text-xs text-warning' : ''}><span className="font-bold">{m.author === 'client' ? 'Cliente' : m.author === 'ai' ? 'Momo' : 'Aviso'}:</span> {m.body}</p>
                      ))}
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    )
  } else if (tab === 'politicas') {
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
      <div className="grid items-start gap-5">
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
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <PageTitle title="Lo que Momo sabe" description="Todo lo que Momo usa para responder a tus clientes, sin inventar."
        actions={<ButtonLink href="/conocimiento?t=probar" variant="primary"><Sparkles className="h-4 w-4" aria-hidden />Entrenar a Momo</ButtonLink>} />
      <Tabs label="Secciones" active={tab} items={TABS.map((t) => ({
        id: t.id, label: t.label, href: `/conocimiento?t=${t.id}`,
        count: t.id === 'memoria' ? counts.memoria : t.id === 'politicas' ? counts.politicas : t.id === 'productos' ? counts.productos : t.id === 'dudas' ? counts.dudas : undefined,
      }))} />
      {content}
    </div>
  )
}
