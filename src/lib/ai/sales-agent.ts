import 'server-only'
import { z } from 'zod'
import { CHANNELS, type Channel } from '@/config/sales'
import { formatClp } from '@/lib/format'
import type { Session } from '@/lib/session'
import { describeHits, searchCatalog, type CatalogHit, type ProductPhoto } from './catalog'
import { LETRAS, MODELOS, MODELO_IDS, TINTAS, type DesignSpec } from '@/features/disenador/modelos'
import { defineTool, runAgent, type AgentImage } from './engine'
import { modelFor } from './runtime'

/**
 * Momo vendedor: escribe la próxima respuesta para el cliente final con el catálogo y las
 * políticas reales de la empresa. En las conversaciones con "Momo atiende" responde solo
 * (autoReply); en el resto sugiere y una persona decide.
 * Lo que no sabe lo registra como "duda" para que el equipo se lo enseñe.
 */

interface Transcript {
  author: 'client' | 'ai' | 'human' | 'system'
  body: string | null
  /** El cliente adjuntó una foto en este mensaje. */
  photo?: boolean
}

interface Context {
  channel: Channel
  customer: string
  comuna: string | null
  sale: { title: string | null; value_clp: number; delivery_clp: number } | null
  messages: Transcript[]
  conversationId: string | null
  /** Fotos recientes del cliente (referencias o imágenes para un mueble personalizado). */
  images?: AgentImage[]
}

async function businessPrompt(session: Session) {
  const { db, org } = session
  const [assistant, knowledge, memory] = await Promise.all([
    db.from('ai_assistants').select('name, system_prompt, model').eq('organization_id', org.id).eq('active', true).order('created_at').limit(1).maybeSingle(),
    db.from('knowledge_entries').select('title, content').eq('organization_id', org.id).order('updated_at').limit(80),
    db.from('momo_memory').select('kind, question, answer').eq('organization_id', org.id).order('created_at', { ascending: false }).limit(25),
  ])
  if (assistant.error) throw assistant.error
  if (knowledge.error) throw knowledge.error

  const policies = (knowledge.data ?? []).map((k) => `### ${k.title}\n${k.content}`).join('\n\n') || 'Aún no hay políticas cargadas.'
  // Memoria: respuestas que el equipo aprobó o corrigió. Las correcciones pesan más que las políticas generales.
  const examples = (memory.data ?? []).map((m) => `Cliente: ${m.question}\nRespuesta ${m.kind === 'corregida' ? 'correcta (corregida por el equipo)' : 'aprobada'}: ${m.answer}`).join('\n\n')
  const handoff = org.handoffContacts.map((c) => `${c.label} (${c.phone})`).join(' o ') || 'una persona del equipo'

  const system = `${assistant.data?.system_prompt || `Eres Momo, el asistente de ventas de ${org.name}.`}

## Cómo trabajas en Momo
- Escribes la próxima respuesta para el cliente y se le envía tal cual: eres tú quien atiende.
- Responde SOLO con el texto del mensaje para el cliente: sin comillas, sin explicaciones, sin notas internas.
- Habla como una vendedora chilena cercana y con buena onda, no como un robot: natural, cálida y segura de lo que dice. Mensajes breves (1 a 4 frases), como en un chat de verdad.
- Conecta con lo que te cuenta el cliente: si es para su hija, para su primer depa o un regalo, coméntalo con cariño (por ejemplo "¡A tu hija le va a encantar!"). Muestra empatía si algo salió mal.
- Varía tus frases: no repitas siempre la misma pregunta al final ni el mismo saludo. Si ya sabes qué busca, no le preguntes "¿qué mueble buscas?".
- Un toque de gracia de vez en cuando se agradece (una frase simpática, un emoji 😊✨🛏️), sin exagerar y nunca en reclamos.
- Usa chilenismos suaves cuando calcen ("al tiro", "te tinca", "bacán"), pero sin forzarlos y adaptándote al tono del cliente: si escribe formal, responde más formal.
- Si te preguntan si eres un bot o una persona, responde con simpatía la verdad: eres Momo, el asistente virtual de la tienda, y si prefiere puede hablar con una persona del equipo.
- Para precios, medidas y productos usa buscar_productos. Cuando hables de un producto concreto (o el cliente pida fotos, colores o "cómo es"), muéstraselo con enviar_fotos usando el código [foto: …] que trae la búsqueda (máximo 3). Las fotos se envían junto a tu mensaje: no pegues enlaces en el texto. Nunca inventes precios, medidas, plazos, stock ni políticas.
- Si el cliente pregunta algo que no está en las políticas ni en el catálogo, usa registrar_duda con la pregunta y responde que lo confirmas en breve. No afirmes ni niegues cosas que las políticas no digan (por ejemplo crédito, descuentos, pago contra entrega o factura con condiciones especiales): eso también es una duda.
- Para colores, tamaños o variantes, busca en el catálogo (los nombres de los productos traen el color) en vez de suponer.
- Si el cliente reclama por un producto dañado o con falla, aplica la política de garantía: explica qué hacer paso a paso (fotos, plazo para avisar) y ofrece derivar con una persona.
- Saluda solo en tu primer mensaje y hazlo corto y natural, por ejemplo "¡Hola! Soy Momo de ${org.name} 😊 ¿En qué te ayudo?". Nunca digas "te habla el asistente". Después ve directo al punto y no repitas felicitaciones o comentarios que ya hiciste.
- Si el cliente escribe formal (usted, "requiero", "cotizar para una empresa"), responde con usted, cordial y profesional, sin chilenismos ni emojis.
- Copia los precios exactamente como vienen del catálogo (por ejemplo $159.990, nunca $159.000 ni "aprox.").
- Si pide algo a medida o fuera de catálogo (por ejemplo cocinas a medida), ofrece derivarlo con ${handoff}.
- Si el cliente envía una foto: mírala y coméntala con cariño (qué se ve, colores, personaje). Si es para un mueble personalizado, di si sirve para imprimir (nítida y de buen tamaño; si se ve pixelada, pide una de mejor calidad), pregunta en qué mueble la quiere y ofrece el diseñador de la web para ver la vista previa. Si es una foto de un espacio o de un mueble de referencia, úsala para entender medidas y estilo y deriva lo que sea a medida.
- Diseños: si el cliente quiere un mueble personalizado (clóset, cómoda, velador, mudador) y ya mandó su imagen o te dio un nombre, usa crear_diseno para mostrarle cómo quedaría. Si pide un personaje (por ejemplo Stitch) y no ha mandado imagen, pídele con cariño que te envíe la imagen que más le guste de ese personaje (o el nombre) para armarle la vista previa al tiro. Aclara que es una vista referencial.
- Lee al cliente y adapta tu estilo: si es directo y va al grano ("precio?", "tienen?"), responde corto, concreto y sin adornos; si es una mamá, papá o alguien que cuenta para quién es o se emociona, sé más cariñosa y conversadora; si duda o compara, guíala con 2 opciones claras; si está molesto, empatía primero y solución concreta.
- Avanza la venta: confirma lo que falta (modelo, color, medidas, comuna), entrega el total si lo conoces y explica cómo pagar.

## Políticas del negocio (de la más antigua a la más reciente; si dos se contradicen, manda la más reciente)
${policies}${examples ? `

## Memoria: respuestas que el equipo aprobó o corrigió
Úsalas como ejemplo de tono y contenido. Si el cliente pregunta algo parecido, responde en la misma línea (adaptado a la conversación); si una corrección contradice lo que pensabas responder, manda la corrección.

${examples}` : ''}`

  return { system, model: modelFor(assistant.data?.model), assistantName: assistant.data?.name ?? 'Momo' }
}

function transcriptText(ctx: Context) {
  const who = { client: 'Cliente', ai: 'Momo', human: 'Equipo', system: 'Sistema' } as const
  const lines = ctx.messages.filter((m) => m.body || m.photo).slice(-30).map((m) => `${who[m.author]}: ${m.photo ? '[envió una foto] ' : ''}${m.body ?? ''}`.trim())
  const sale = ctx.sale?.title
    ? `\nInterés registrado: ${ctx.sale.title}${ctx.sale.value_clp ? ` · ${formatClp(ctx.sale.value_clp)}` : ''}${ctx.sale.delivery_clp ? ` + despacho ${formatClp(ctx.sale.delivery_clp)}` : ''}`
    : ''
  return `Conversación por ${CHANNELS[ctx.channel].label} con ${ctx.customer}${ctx.comuna ? ` (${ctx.comuna})` : ''}.${sale}

${lines.join('\n') || '(sin mensajes todavía)'}

Escribe la próxima respuesta para el cliente.`
}

export type ReplyResult = ({ text: string; error?: undefined } | { error: string; text?: undefined }) & { gaps?: string[]; photos?: ProductPhoto[]; designs?: DesignSpec[] }

async function reply(session: Session, ctx: Context, { allowGaps }: { allowGaps: boolean }): Promise<ReplyResult> {
  const { system, model } = await businessPrompt(session)
  const gaps: string[] = []
  const seen = new Map<string, CatalogHit>()
  let lastHits: CatalogHit[] = []
  const photos: ProductPhoto[] = []
  const designs: DesignSpec[] = []

  const buscarProductos = defineTool({
    name: 'buscar_productos',
    description: 'Busca productos del catálogo por texto (nombre, categoría, medidas, diseño). Devuelve hasta 8 con precio y oferta.',
    schema: z.object({ consulta: z.string().min(1).max(120) }),
    run: async ({ consulta }) => {
      const hits = await searchCatalog(session, consulta)
      for (const h of hits) seen.set(h.id.slice(0, 8), h)
      if (hits.length) lastHits = hits
      return describeHits(consulta, hits)
    },
  })

  const enviarFotos = defineTool({
    name: 'enviar_fotos',
    description: 'Envía al cliente fotos de referencia de productos del catálogo (máximo 3), usando el código [foto: …] que entrega buscar_productos.',
    schema: z.object({ codigos: z.array(z.string().min(4).max(40)).min(1).max(3) }),
    run: async ({ codigos }) => {
      const sent: string[] = []
      for (const raw of codigos) {
        const hit = seen.get(raw.replace(/[^0-9a-f]/gi, '').slice(0, 8))
        if (!hit?.image_url || photos.some((p) => p.image === hit.image_url) || photos.length >= 3) continue
        photos.push({ name: hit.name, image: hit.image_url, url: hit.source_url, price: hit.sale_price_clp ?? hit.price_clp })
        sent.push(hit.name)
      }
      return sent.length ? `Fotos listas para enviar: ${sent.join(', ')}.` : 'No encontré esas fotos; busca el producto primero con buscar_productos.'
    },
  })

  const crearDiseno = defineTool({
    name: 'crear_diseno',
    description: `Crea una vista previa del mueble personalizado (como el diseñador de la web) con la foto que mandó el cliente y/o un nombre. Modelos: ${MODELOS.map((m) => `${m.id} = ${m.etiqueta}`).join('; ')}.`,
    schema: z.object({
      modelo: z.enum(MODELO_IDS),
      nombre: z.string().max(18).optional().describe('Nombre a poner en el mueble, si el cliente lo pidió'),
      letra: z.enum(LETRAS.map((l) => l.id) as [string, ...string[]]).optional(),
      tinta: z.enum(Object.keys(TINTAS) as [string, ...string[]]).optional().describe('Color del nombre'),
      con_foto: z.boolean().describe('true para usar la última foto que envió el cliente'),
    }),
    run: async ({ modelo, nombre, letra, tinta, con_foto }) => {
      const m = MODELOS.find((x) => x.id === modelo)!
      const conFoto = con_foto && (ctx.images?.length ?? 0) > 0
      if (!conFoto && !nombre) return 'El cliente aún no envía su imagen: pídele que mande la foto o el personaje que quiere (o un nombre) para crear la vista previa.'
      if (designs.length >= 2) return 'Ya creaste vistas previas en este mensaje.'
      const { data } = await session.db.from('products').select('price_clp, sale_price_clp, name').eq('organization_id', session.org.id).eq('active', true)
        .ilike('name', `${m.prefijo}%`).order('name').limit(5)
      const prod = (data ?? []).find((p) => /personalizable/i.test(String(p.name))) ?? data?.[0]
      designs.push({ modelo, nombre: nombre?.trim() || undefined, letra: letra as DesignSpec['letra'], tinta: tinta as DesignSpec['tinta'], conFoto, precio: prod ? (prod.sale_price_clp ?? prod.price_clp) as number : null })
      return `Vista previa creada: ${m.etiqueta}${nombre ? ` con el nombre ${nombre}` : ''}${conFoto ? ' con la imagen del cliente' : ''}. Se envía junto a tu mensaje; dile que es una vista referencial.`
    },
  })

  const registrarDuda = defineTool({
    name: 'registrar_duda',
    description: 'Anota una pregunta del cliente que no puedes responder con el catálogo ni las políticas, para que el equipo te la enseñe.',
    schema: z.object({ pregunta: z.string().min(5).max(300).describe('La pregunta, escrita de forma general (sin datos personales)') }),
    run: async ({ pregunta }) => {
      const { db, org } = session
      const { data: existing } = await db.from('knowledge_gaps').select('id').eq('organization_id', org.id).eq('status', 'pendiente').ilike('question', pregunta.replace(/[%_]/g, ' ')).limit(1)
      if (!existing?.length) {
        await db.from('knowledge_gaps').insert({ organization_id: org.id, question: pregunta, conversation_id: ctx.conversationId })
      }
      gaps.push(pregunta)
      return 'Duda anotada. Responde al cliente que lo confirmas en breve.'
    },
  })

  const result = await runAgent(session, {
    feature: 'vendedor', system, claudeModel: model, effort: 'medium',
    tools: allowGaps ? [buscarProductos, enviarFotos, crearDiseno, registrarDuda] : [buscarProductos, enviarFotos, crearDiseno],
    messages: [{ role: 'user', text: transcriptText(ctx), images: ctx.images }],
  })
  if (result.refused) return { error: 'Momo no puede responder este mensaje. Respóndelo tú.' }
  // Algunos modelos escriben el código [foto: …] en el texto en vez de usar enviar_fotos:
  // se convierte en foto adjunta y se quita del mensaje.
  for (const [, code] of result.text.matchAll(/\[foto:\s*([0-9a-f]{6,})\]/gi)) {
    const hit = seen.get(code!.slice(0, 8))
    if (hit?.image_url && photos.length < 3 && !photos.some((p) => p.image === hit.image_url)) {
      photos.push({ name: hit.name, image: hit.image_url, url: hit.source_url, price: hit.sale_price_clp ?? hit.price_clp })
    }
  }
  // Si el cliente pidió ver el producto y el modelo no adjuntó nada, van las fotos de lo último que buscó.
  const lastClient = [...ctx.messages].reverse().find((m) => m.author === 'client')?.body ?? ''
  if (photos.length === 0 && /foto|imagen|ver(lo|la|los|las)?\b|c[oó]mo (es|son|queda)|colou?r|modelo/i.test(lastClient)) {
    for (const hit of lastHits.filter((h) => h.image_url).slice(0, 2)) {
      photos.push({ name: hit.name, image: hit.image_url!, url: hit.source_url, price: hit.sale_price_clp ?? hit.price_clp })
    }
  }
  const text = result.text.replace(/\s*\[foto:\s*[0-9a-f]+\]/gi, '').replace(/\n{3,}/g, '\n\n').trim()
  return text ? { text, gaps, photos, designs } : { error: 'Momo no encontró qué responder. Intenta de nuevo.', gaps }
}

/** Sugerencia de respuesta para una conversación registrada. */
export async function suggestReply(session: Session, conversationId: string): Promise<ReplyResult> {
  const { db, org } = session
  const { data: conversation, error } = await db.from('conversations')
    .select('id, channel, contact:contacts(name, comuna), tickets(title, value_clp, delivery_clp)')
    .eq('organization_id', org.id).eq('id', conversationId).maybeSingle()
  if (error) throw error
  if (!conversation) return { error: 'Esa conversación ya no existe.' }
  const { data: messages, error: msgError } = await db.from('messages').select('author, body').eq('conversation_id', conversationId).order('sent_at').limit(300)
  if (msgError) throw msgError

  const contact = conversation.contact as unknown as { name: string; comuna: string | null } | null
  const tickets = conversation.tickets as unknown as Context['sale'][] | null
  return reply(session, {
    channel: conversation.channel as Channel,
    customer: contact?.name ?? 'el cliente',
    comuna: contact?.comuna ?? null,
    sale: tickets?.[0] ?? null,
    messages: (messages ?? []) as Transcript[],
    conversationId,
  }, { allowGaps: true })
}

/**
 * Entrenar a Momo: conversación de práctica completa (no se guarda). Lo que Momo no sabe
 * queda anotado en "Dudas" para que el equipo se lo enseñe.
 */
export async function trainReply(session: Session, messages: { author: 'client' | 'ai'; body: string; photo?: boolean }[], images: AgentImage[] = []) {
  return reply(session, {
    channel: 'marketplace', customer: 'un cliente de práctica', comuna: null, sale: null,
    messages, conversationId: null, images,
  }, { allowGaps: true })
}

/** "Probar a Momo": cómo respondería a una pregunta de prueba (no anota dudas). */
export async function testReply(session: Session, question: string) {
  return reply(session, {
    channel: 'marketplace', customer: 'un cliente de prueba', comuna: null, sale: null,
    messages: [{ author: 'client', body: question }], conversationId: null,
  }, { allowGaps: false })
}

/**
 * Modo automático: si la conversación tiene "Momo atiende", Momo escribe y guarda su respuesta
 * apenas llega un mensaje del cliente. Nunca lanza error: si falla, la conversación queda en
 * "Te esperan" para que responda una persona.
 */
export async function autoReply(session: Session, conversationId: string) {
  try {
    const { data } = await session.db.from('conversations').select('ai_enabled, status').eq('organization_id', session.org.id).eq('id', conversationId).maybeSingle()
    if (!data?.ai_enabled || data.status === 'closed') return
    const result = await suggestReply(session, conversationId)
    if (!result.text) return
    await session.db.from('messages').insert({ organization_id: session.org.id, conversation_id: conversationId, author: 'ai', body: result.text, attachments: result.photos ?? [] })
  } catch (error) {
    console.error('Momo automático: no pudo responder', error)
  }
}
