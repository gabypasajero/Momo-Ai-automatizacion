import 'server-only'
import { WON_STEPS } from '@/config/sales'
import type { Session } from '@/lib/session'
import { runAgent } from './engine'

/**
 * "Momo aprende": revisa la semana (conversaciones reales, entrenamientos y dudas) y entrega
 * un resumen con lo que más preguntan, las objeciones, lo que funcionó y políticas sugeridas.
 */

export interface LearningReport {
  resumen: string
  preguntas_frecuentes: { pregunta: string; veces: number; tiene_respuesta: boolean }[]
  objeciones: { objecion: string; como_responder: string }[]
  lo_que_funciono: { situacion: string; respuesta: string }[]
  politicas_sugeridas: { titulo: string; contenido: string; por_que: string }[]
  datos: { conversaciones: number; mensajes: number; entrenamientos: number; ventas: number; dudas: number }
}

const SYSTEM = `Eres el analista de ventas de Momo, el asistente de ventas por chat de una pyme chilena.
Revisas las conversaciones de la semana y entregas un informe breve y accionable para el dueño, en español de Chile y sin tecnicismos.
Reglas:
- No inventes datos del negocio. Si una política sugerida necesita un dato que no aparece (precio, plazo, sí/no), escríbelo como [definir: …] para que el dueño lo complete.
- No incluyas nombres, teléfonos ni datos personales de clientes.
- Prioriza lo que más se repite y lo que más ayuda a vender.
Responde SOLO con un JSON válido (sin texto antes ni después) con esta forma:
{"resumen": "2 o 3 frases",
 "preguntas_frecuentes": [{"pregunta": "...", "veces": 3, "tiene_respuesta": true}],
 "objeciones": [{"objecion": "...", "como_responder": "..."}],
 "lo_que_funciono": [{"situacion": "...", "respuesta": "..."}],
 "politicas_sugeridas": [{"titulo": "...", "contenido": "...", "por_que": "..."}]}
Máximo 6 elementos por lista.`

function parseReport(text: string) {
  const raw = text.replace(/^[\s\S]*?(\{)/, '$1').replace(/\}[^}]*$/, '}')
  const json = JSON.parse(raw) as Partial<LearningReport>
  const list = <T,>(v: unknown) => (Array.isArray(v) ? (v as T[]).slice(0, 6) : [])
  return {
    resumen: String(json.resumen ?? '').slice(0, 800),
    preguntas_frecuentes: list<LearningReport['preguntas_frecuentes'][number]>(json.preguntas_frecuentes)
      .map((p) => ({ pregunta: String(p.pregunta ?? '').slice(0, 300), veces: Number(p.veces) || 1, tiene_respuesta: Boolean(p.tiene_respuesta) })).filter((p) => p.pregunta),
    objeciones: list<LearningReport['objeciones'][number]>(json.objeciones)
      .map((o) => ({ objecion: String(o.objecion ?? '').slice(0, 300), como_responder: String(o.como_responder ?? '').slice(0, 600) })).filter((o) => o.objecion),
    lo_que_funciono: list<LearningReport['lo_que_funciono'][number]>(json.lo_que_funciono)
      .map((l) => ({ situacion: String(l.situacion ?? '').slice(0, 300), respuesta: String(l.respuesta ?? '').slice(0, 800) })).filter((l) => l.situacion),
    politicas_sugeridas: list<LearningReport['politicas_sugeridas'][number]>(json.politicas_sugeridas)
      .map((p) => ({ titulo: String(p.titulo ?? '').slice(0, 120), contenido: String(p.contenido ?? '').slice(0, 2000), por_que: String(p.por_que ?? '').slice(0, 300) })).filter((p) => p.titulo && p.contenido),
  }
}

export async function buildLearningReport(session: Session, days = 7) {
  const { db, org } = session
  const end = new Date()
  const start = new Date(end.getTime() - days * 86_400_000)
  const since = start.toISOString()

  const [convs, training, gaps, policies] = await Promise.all([
    db.from('conversations').select('id, channel, tickets(step)').eq('organization_id', org.id).gte('last_message_at', since).order('last_message_at', { ascending: false }).limit(40),
    db.from('training_sessions').select('messages').eq('organization_id', org.id).gte('updated_at', since).order('updated_at', { ascending: false }).limit(20),
    db.from('knowledge_gaps').select('question').eq('organization_id', org.id).eq('status', 'pendiente').limit(30),
    db.from('knowledge_entries').select('title').eq('organization_id', org.id).limit(80),
  ])
  for (const r of [convs, training, gaps, policies]) if (r.error) throw r.error

  const ids = (convs.data ?? []).map((c) => c.id as string)
  const { data: msgs, error: msgError } = ids.length
    ? await db.from('messages').select('conversation_id, author, body').in('conversation_id', ids).order('sent_at').limit(1500)
    : { data: [], error: null }
  if (msgError) throw msgError

  const who = { client: 'Cliente', ai: 'Momo', human: 'Vendedor', system: 'Sistema' } as Record<string, string>
  let sales = 0
  const blocks: string[] = []
  ;(convs.data ?? []).forEach((c, i) => {
    const steps = ((c.tickets as unknown as { step: string }[] | null) ?? []).map((t) => t.step)
    const won = steps.some((s) => (WON_STEPS as string[]).includes(s))
    if (won) sales++
    const lines = (msgs ?? []).filter((m) => m.conversation_id === c.id && m.body).slice(-30).map((m) => `${who[m.author as string] ?? m.author}: ${String(m.body).slice(0, 400)}`)
    if (lines.length) blocks.push(`### Conversación ${i + 1} (${c.channel}${won ? ', TERMINÓ EN VENTA' : ''})\n${lines.join('\n')}`)
  })
  ;(training.data ?? []).forEach((t, i) => {
    const lines = ((t.messages as { author: string; body: string }[]) ?? []).filter((m) => m.author !== 'note').slice(-20).map((m) => `${m.author === 'client' ? 'Cliente (práctica)' : 'Momo'}: ${String(m.body).slice(0, 400)}`)
    if (lines.length) blocks.push(`### Entrenamiento ${i + 1}\n${lines.join('\n')}`)
  })

  const datos = {
    conversaciones: ids.length,
    mensajes: (msgs ?? []).length,
    entrenamientos: (training.data ?? []).length,
    ventas: sales,
    dudas: (gaps.data ?? []).length,
  }
  if (blocks.length === 0 && datos.dudas === 0) {
    return { empty: true as const, datos }
  }

  const material = `Empresa: ${org.name}. Periodo: últimos ${days} días.
Políticas que Momo ya conoce: ${(policies.data ?? []).map((p) => p.title).join(', ') || 'ninguna'}.
Dudas pendientes (Momo no supo responder): ${(gaps.data ?? []).map((g) => `«${g.question}»`).join('; ') || 'ninguna'}.

${blocks.join('\n\n').slice(0, 45_000)}`

  const result = await runAgent(session, {
    feature: 'asistente_interno', system: SYSTEM, effort: 'medium', tools: [],
    messages: [{ role: 'user', text: material }],
  })
  const report: LearningReport = { ...parseReport(result.text), datos }
  const { data: saved, error } = await db.from('learning_reports')
    .insert({ organization_id: org.id, period_start: since, period_end: end.toISOString(), data: report })
    .select('id, created_at').single()
  if (error) throw error
  return { empty: false as const, report, id: saved.id as string }
}

export async function latestLearningReport(session: Session) {
  const { data, error } = await session.db.from('learning_reports').select('id, data, period_start, period_end, created_at')
    .eq('organization_id', session.org.id).order('created_at', { ascending: false }).limit(1).maybeSingle()
  if (error) throw error
  return data as { id: string; data: LearningReport; period_start: string; period_end: string; created_at: string } | null
}
