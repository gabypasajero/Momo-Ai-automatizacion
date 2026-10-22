import { useMemo, useState } from 'react'
import {
  Home, Columns3, MessageCircle, Bot, Contact, Smartphone, BarChart3, Headphones, ShoppingBag,
  Workflow, CalendarDays, LayoutGrid, Settings, Search, Bell, ClipboardList, Check, X, ChevronDown,
  Plus, Filter, List, Megaphone, FileText, Mail, Link2, MoreVertical, FlaskConical, Gauge, ArrowRight,
  Send, Pause, Play, BookOpen, Puzzle, Code2, SlidersHorizontal, Eye, Pencil, Merge, Users, Ticket,
  Lightbulb, FileBarChart, Camera, MessageSquare, Music2, TrendingUp, Sparkles, Bookmark, Download,
  Upload, Tag, CreditCard, Zap, ShieldCheck,
} from 'lucide-react'

/* ------------------------------------------------------------------ */
/* Datos de prueba                                                     */
/* ------------------------------------------------------------------ */

const CHANNELS = {
  whatsapp: { label: 'WhatsApp', icon: MessageCircle, cls: 'bg-emerald-500' },
  instagram: { label: 'Instagram', icon: Camera, cls: 'bg-gradient-to-br from-amber-400 via-pink-500 to-purple-600' },
  messenger: { label: 'Messenger', icon: MessageSquare, cls: 'bg-gradient-to-br from-sky-400 to-blue-600' },
  tiktok: { label: 'TikTok', icon: Music2, cls: 'bg-slate-900' },
}

const STAGES = [
  { id: 'human', name: 'Asistencia humana', emoji: '🙋', tone: 'border-t-rose-400' },
  { id: 'standard', name: 'Asesoría muebles estándar', emoji: '🪑', tone: 'border-t-blue-500' },
  { id: 'kitchen', name: 'Proyecto cocina a medida', emoji: '🍳', tone: 'border-t-violet-500' },
  { id: 'quote', name: 'Revisión de cotización', emoji: '📄', tone: 'border-t-amber-400' },
]

const INITIAL_TICKETS = [
  { id: 1, name: 'Priscilla Olivares', channel: 'whatsapp', stage: 'human', ai: false, msg: 'Hola Priscilla, ya derivé tu caso para que te contacte un ejecutivo 🙏', time: '09:09', value: 0, status: 'open' },
  { id: 2, name: 'Eduardo Pérez', channel: 'whatsapp', stage: 'human', ai: false, msg: 'Mueble trato de repararlo el maestro pero se da no más', time: '08:35', value: 0, status: 'open' },
  { id: 3, name: 'Daniel Fernández', channel: 'whatsapp', stage: 'human', ai: false, msg: '📷 Imagen', time: '07:39', value: 0, status: 'open' },
  { id: 4, name: 'Karen Soto', channel: 'whatsapp', stage: 'standard', ai: true, msg: '¿Tienen el rack de TV en color nogal?', time: '16:40', value: 189990, status: 'open' },
  { id: 5, name: 'Armando Muebles', channel: 'whatsapp', stage: 'standard', ai: true, msg: 'Confirmación de datos para coordinar tu pedido: Mueble de cocina XL', time: '16:09', value: 459990, status: 'open' },
  { id: 6, name: 'Edgar Maldonado', channel: 'messenger', stage: 'standard', ai: true, msg: '¡Perfecto, Edgar! Te esperamos en Tupungato 9059, La Granja 😊', time: '15:51', value: 129990, status: 'open' },
  { id: 7, name: 'yoyita_28', channel: 'tiktok', stage: 'kitchen', ai: true, msg: '😍🙏', time: '15:10', value: 0, status: 'open' },
  { id: 8, name: 'Eric Bustos Moya', channel: 'instagram', stage: 'kitchen', ai: true, msg: '¿Te gustaría contarme qué mueble necesitas fabricar a medida y en qué espacio?', time: '14:56', value: 890000, status: 'open' },
  { id: 9, name: 'Stephanie Vejar', channel: 'instagram', stage: 'kitchen', ai: true, msg: '¡De nada! Te esperamos en la tienda cuando quieras 😊', time: '14:54', value: 1250000, status: 'open' },
  { id: 10, name: 'Marcela Rojas', channel: 'whatsapp', stage: 'quote', ai: false, msg: 'Ok hablaré con mi hija, muchas gracias', time: '16:31', value: 349990, status: 'open' },
  { id: 11, name: 'Iska Muñoz', channel: 'whatsapp', stage: 'quote', ai: false, msg: 'Reacción ❤️', time: '16:14', value: 0, status: 'open' },
  { id: 12, name: 'Valentina Cruz', channel: 'whatsapp', stage: 'quote', ai: true, msg: 'Gracias, Valentina. Anoté tus datos y el diseño que buscas.', time: '13:35', value: 279990, status: 'open' },
  { id: 13, name: 'Rodrigo Silva', channel: 'messenger', stage: 'standard', ai: true, msg: 'La próxima semana voy a ver si vamos', time: '15:42', value: 99990, status: 'won' },
]

const CHATS = [
  { id: 1, name: 'Beatriz', channel: 'whatsapp', time: '16:42', ai: true, unread: true, last: '¿Hoy?', messages: [
    { from: 'client', text: 'Hola, ¿tienen camas de 2 plazas?', time: '16:30' },
    { from: 'ai', text: '¡Hola Beatriz! 😊 Sí, tenemos base de cama 2 plazas desde $149.990. ¿Te envío fotos de los modelos?', time: '16:31' },
    { from: 'client', text: 'Sí porfa, ¿y pueden despachar?', time: '16:40' },
    { from: 'ai', text: 'Claro, despachamos en toda la RM. ¿Para qué comuna sería?', time: '16:41' },
    { from: 'client', text: '¿Hoy?', time: '16:42' },
  ] },
  { id: 2, name: 'Karlutty', channel: 'whatsapp', time: '16:35', ai: true, unread: true, last: 'Muchas gracias', messages: [
    { from: 'client', text: '¿Cuánto sale el mueble de cocina XL con horno?', time: '16:20' },
    { from: 'ai', text: 'El mueble de cocina XL con torre para horno está en $459.990, con despacho incluido en la RM.', time: '16:21' },
    { from: 'client', text: 'Muchas gracias', time: '16:35' },
  ] },
  { id: 3, name: 'Marcela', channel: 'whatsapp', time: '16:31', ai: false, unread: true, last: 'Ok hablaré con mi hija, muchas gracias', messages: [
    { from: 'human', text: 'Hola Marcela, te comparto la cotización del closet a medida: $349.990.', time: '16:10' },
    { from: 'client', text: 'Ok hablaré con mi hija, muchas gracias', time: '16:31' },
  ] },
  { id: 4, name: 'Isabel', channel: 'whatsapp', time: '16:19', ai: true, unread: false, last: '¡Gracias! Para base de cama de 2…', messages: [
    { from: 'client', text: '¡Gracias! Para base de cama de 2 plazas, ¿qué colores hay?', time: '16:19' },
  ] },
  { id: 5, name: 'Iska', channel: 'whatsapp', time: '16:14', ai: true, unread: false, last: 'Reacción', messages: [{ from: 'client', text: '❤️', time: '16:14' }] },
  { id: 6, name: 'Rodrigo', channel: 'messenger', time: '15:42', ai: true, unread: false, last: 'La próxima semana a ver si vamos', messages: [
    { from: 'ai', text: 'Nuestra tienda está en Tupungato 9059, La Granja. Abrimos de lunes a sábado de 10:00 a 19:00.', time: '15:40' },
    { from: 'client', text: 'La próxima semana a ver si vamos', time: '15:42' },
  ] },
  { id: 7, name: 'Marlit Asenjo', channel: 'instagram', time: '15:41', ai: false, unread: false, last: 'Audio', messages: [{ from: 'client', text: '🎤 Audio (0:24)', time: '15:41' }] },
  { id: 8, name: 'Martina', channel: 'instagram', time: '15:21', ai: true, unread: false, last: 'Mi idea es el mueble que vi en el post', messages: [
    { from: 'client', text: 'Mi idea es el mueble que vi en el post', time: '15:21' },
  ] },
  { id: 9, name: 'Uto', channel: 'messenger', time: '15:02', ai: true, unread: false, last: '¿Pueden cercar 2?', messages: [{ from: 'client', text: '¿Pueden cercar 2?', time: '15:02' }] },
  { id: 10, name: 'Anto Urrutia', channel: 'tiktok', time: '14:31', ai: true, unread: false, last: '¿Hacen envíos a regiones?', messages: [{ from: 'client', text: '¿Hacen envíos a regiones?', time: '14:31' }] },
]

const CUSTOMERS = [
  ['Yt', '56953306236', 'whatsapp', 'Nuevo'], ['Beatriz', '56962655512', 'whatsapp', 'Cotizando'],
  ['Karen', '56972139613', 'whatsapp', 'Cliente'], ['Jaime González', '56930282367', 'whatsapp', 'Nuevo'],
  ['Gabriel Esteban', '56985511261', 'whatsapp', 'Cliente'], ['jano26570', '—', 'tiktok', 'Nuevo'],
  ['Karlutty', '56949333534', 'whatsapp', 'Cotizando'], ['Marcela', '56942877327', 'whatsapp', 'Cotizando'],
  ['ema', '—', 'instagram', 'Nuevo'], ['m.andrea826', '—', 'tiktok', 'Nuevo'], ['Isabel', '56934262263', 'whatsapp', 'Cliente'],
]

const fmtCLP = (n) => '$' + n.toLocaleString('es-CL')

/* ------------------------------------------------------------------ */
/* Navegación                                                          */
/* ------------------------------------------------------------------ */

const MODULES = [
  { id: 'inicio', label: 'Inicio', icon: Home },
  { id: 'embudo', label: 'Embudo', icon: Columns3 },
  { id: 'chat', label: 'Chat', icon: MessageCircle },
  { id: 'asistente', label: 'Asistente', icon: Bot },
  { id: 'crm', label: 'CRM', icon: Contact },
  { id: 'canales', label: 'Canales', icon: Smartphone },
  { id: 'analitica', label: 'Analítica', icon: BarChart3 },
  { id: 'servicio', label: 'Servicio', icon: Headphones },
  { id: 'ecommerce', label: 'Ecommerce', icon: ShoppingBag },
  { id: 'workflows', label: 'Workflows', icon: Workflow },
  { id: 'agenda', label: 'Agenda', icon: CalendarDays },
  { id: 'mas', label: 'Más', icon: LayoutGrid },
]

const SUBMENUS = {
  asistente: { title: 'Asistente', groups: [
    ['Entrenar IA', [['Asistente', Bot], ['Conocimiento', BookOpen]]],
    ['Probar IA', [['Playground', FlaskConical], ['Evaluaciones', Pencil]]],
    ['Librerías', [['Bloques', Puzzle], ['Funciones', Code2]]],
    ['Ajustes', [['Ajustes de IA', SlidersHorizontal]]],
  ] },
  canales: { title: 'Canales', groups: [
    ['Principal', [['Canales', Smartphone], ['Campañas', Megaphone], ['Plantillas Mensajería', FileText], ['Plantillas Email', Mail]]],
    ['Extra', [['WhatsApp Flows', Workflow]]],
  ] },
  analitica: { title: 'Analítica', groups: [
    ['', [['Resumen', LayoutGrid], ['Conversaciones', MessageCircle], ['Tickets', Ticket], ['Insights', Lightbulb], ['Reportes', FileBarChart]]],
  ] },
  crm: { title: 'CRM', groups: [
    ['Información', [['Clientes', Users], ['Tickets', Ticket]]],
    ['Seguimiento', [['Tareas', ClipboardList]]],
    ['Ajustes', [['Campos', SlidersHorizontal], ['Etiquetas', Tag]]],
  ] },
  ajustes: { title: 'Ajustes', groups: [
    ['Cuenta', [['Plan y facturación', CreditCard], ['Usuarios', Users], ['Seguridad', ShieldCheck]]],
  ] },
}

/* ------------------------------------------------------------------ */
/* Componentes base                                                    */
/* ------------------------------------------------------------------ */

function ChannelIcon({ channel, size = 'sm' }) {
  const c = CHANNELS[channel]
  const Icon = c.icon
  const box = size === 'lg' ? 'h-10 w-10 rounded-xl' : 'h-5 w-5 rounded-md'
  return (
    <span title={c.label} className={`${box} ${c.cls} inline-flex shrink-0 items-center justify-center text-white`}>
      <Icon className={size === 'lg' ? 'h-5 w-5' : 'h-3 w-3'} />
    </span>
  )
}

const Card = ({ className = '', children }) => (
  <div className={`rounded-xl border border-slate-200 bg-white ${className}`}>{children}</div>
)

const Btn = ({ primary, className = '', children, ...p }) => (
  <button
    {...p}
    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
      primary ? 'bg-blue-600 text-white hover:bg-blue-700' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
    } ${className}`}
  >
    {children}
  </button>
)

const Avatar = ({ name, cls = 'bg-blue-600' }) => (
  <span className={`${cls} inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white`}>
    {name.slice(0, 1).toUpperCase()}
  </span>
)

function SearchBox({ value, onChange, placeholder, className = '' }) {
  return (
    <label className={`flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm ${className}`}>
      <Search className="h-4 w-4 text-slate-400" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-transparent outline-none placeholder:text-slate-400" />
    </label>
  )
}

/* ------------------------------------------------------------------ */
/* Vista: Embudo (Kanban)                                              */
/* ------------------------------------------------------------------ */

function PipelineView({ tickets, setTickets }) {
  const [query, setQuery] = useState('')
  const [channelFilter, setChannelFilter] = useState([])
  const [status, setStatus] = useState('open')
  const [mode, setMode] = useState('kanban')
  const [dragId, setDragId] = useState(null)

  const visible = tickets.filter((t) =>
    (status === 'all' || (status === 'open' ? t.status === 'open' : t.status !== 'open')) &&
    (!channelFilter.length || channelFilter.includes(t.channel)) &&
    t.name.toLowerCase().includes(query.toLowerCase()))

  const update = (id, patch) => setTickets((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)))
  const toggleChannel = (c) => setChannelFilter((f) => (f.includes(c) ? f.filter((x) => x !== c) : [...f, c]))

  return (
    <div className="flex h-full flex-col gap-3">
      <Card className="flex flex-wrap items-center gap-2 p-2">
        <button className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm">
          Ventas | Muebles y Hogar <ChevronDown className="h-4 w-4" />
        </button>
        <div className="flex rounded-lg border border-slate-200 p-0.5">
          {[['kanban', Columns3], ['list', List]].map(([m, I]) => (
            <button key={m} onClick={() => setMode(m)} className={`rounded-md p-1.5 ${mode === m ? 'bg-blue-50 text-blue-600' : 'text-slate-500'}`}><I className="h-4 w-4" /></button>
          ))}
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1">
          {['whatsapp', 'instagram', 'messenger'].map((c) => (
            <button key={c} onClick={() => toggleChannel(c)} className={`rounded-md transition ${channelFilter.length && !channelFilter.includes(c) ? 'opacity-30' : ''}`}>
              <ChannelIcon channel={c} />
            </button>
          ))}
        </div>
        <SearchBox value={query} onChange={setQuery} placeholder="Buscar contacto" className="w-56" />
        <div className="ml-auto flex rounded-lg border border-slate-200 p-0.5 text-sm">
          {[['open', 'Abiertos'], ['all', 'Todos'], ['closed', 'Cerrados']].map(([s, l]) => (
            <button key={s} onClick={() => setStatus(s)} className={`rounded-md px-3 py-1 ${status === s ? 'bg-blue-600 text-white' : 'text-slate-600'}`}>{l}</button>
          ))}
        </div>
      </Card>

      {mode === 'kanban' ? (
        <div className="scroll-thin flex flex-1 gap-3 overflow-x-auto pb-2">
          {STAGES.map((s) => {
            const items = visible.filter((t) => t.stage === s.id)
            const total = items.reduce((a, t) => a + t.value, 0)
            return (
              <div
                key={s.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => dragId && update(dragId, { stage: s.id })}
                className={`flex w-80 shrink-0 flex-col rounded-xl border border-t-4 border-slate-200 bg-slate-100/70 ${s.tone}`}
              >
                <div className="flex items-center justify-between px-3 py-2.5">
                  <div>
                    <p className="text-sm font-semibold">{s.emoji} {s.name}</p>
                    <p className="text-xs text-slate-500">{fmtCLP(total)} CLP · {items.length} tickets</p>
                  </div>
                  <Settings className="h-4 w-4 text-slate-400" />
                </div>
                <div className="scroll-thin flex flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2">
                  {items.map((t) => (
                    <div key={t.id} draggable onDragStart={() => setDragId(t.id)} onDragEnd={() => setDragId(null)}
                      className="cursor-grab rounded-lg border border-slate-200 bg-white p-3 shadow-sm active:cursor-grabbing">
                      <div className="flex items-center gap-2">
                        <ChannelIcon channel={t.channel} />
                        <span className="truncate text-sm font-semibold">{t.name}</span>
                        <span className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${t.ai ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>
                          {t.ai ? 'Atendido por IA' : 'No atendido'}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-xs text-slate-600">{t.msg}</p>
                      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                        <span>{t.time} · Hoy</span>
                        {t.status !== 'open' && <span className={t.status === 'won' ? 'text-emerald-600' : 'text-rose-500'}>{t.status === 'won' ? 'Ganado' : 'Perdido'}</span>}
                      </div>
                      <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
                        <span className="whitespace-nowrap text-sm font-semibold">{fmtCLP(t.value)}</span>
                        <div className="flex gap-1">
                          <button title="Venta ganada" onClick={() => update(t.id, { status: 'won' })} className="rounded p-1 text-emerald-600 hover:bg-emerald-50"><Check className="h-4 w-4" /></button>
                          <button title="Perdido" onClick={() => update(t.id, { status: 'lost' })} className="rounded p-1 text-rose-500 hover:bg-rose-50"><X className="h-4 w-4" /></button>
                          <select value={t.stage} onChange={(e) => update(t.id, { stage: e.target.value })} className="max-w-[110px] rounded border border-slate-200 text-[11px]">
                            {STAGES.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                  {!items.length && <p className="py-6 text-center text-xs text-slate-400">Arrastra tickets aquí</p>}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <Card className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr><th className="p-3">Cliente</th><th>Canal</th><th>Etapa</th><th>Estado IA</th><th>Valor</th><th>Hora</th></tr>
            </thead>
            <tbody>
              {visible.map((t) => (
                <tr key={t.id} className="border-t border-slate-100">
                  <td className="p-3 font-medium">{t.name}</td>
                  <td><ChannelIcon channel={t.channel} /></td>
                  <td>{STAGES.find((s) => s.id === t.stage).name}</td>
                  <td className={t.ai ? 'text-emerald-600' : 'text-rose-500'}>{t.ai ? 'Atendido por IA' : 'No atendido'}</td>
                  <td>{fmtCLP(t.value)}</td>
                  <td>{t.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Vista: Chat omnicanal                                               */
/* ------------------------------------------------------------------ */

function ChatView() {
  const [chats, setChats] = useState(CHATS)
  const [selected, setSelected] = useState(null)
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState('chat')
  const [open, setOpen] = useState('Canales')
  const [channel, setChannel] = useState(null)
  const [draft, setDraft] = useState('')

  const chat = chats.find((c) => c.id === selected)
  const list = chats.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()) && (!channel || c.channel === channel))

  const send = () => {
    if (!draft.trim()) return
    const now = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
    setChats((cs) => cs.map((c) => (c.id === selected ? { ...c, last: draft, time: now, messages: [...c.messages, { from: 'human', text: draft, time: now }] } : c)))
    setDraft('')
  }
  const toggleAI = () => setChats((cs) => cs.map((c) => (c.id === selected ? { ...c, ai: !c.ai } : c)))

  return (
    <div className="flex h-full gap-3">
      <Card className="hidden w-60 shrink-0 flex-col p-3 lg:flex">
        <p className="text-xs font-semibold uppercase text-slate-500">Filtros guardados</p>
        <button className="mt-2 flex items-center justify-between rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-500">
          No tienes filtros guardados <Bookmark className="h-3.5 w-3.5" />
        </button>
        <div className="mt-3 grid grid-cols-2 rounded-lg bg-slate-100 p-0.5 text-sm">
          {['chat', 'correos'].map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`rounded-md py-1 capitalize ${tab === t ? 'bg-white shadow-sm' : 'text-slate-500'}`}>{t}</button>
          ))}
        </div>
        <div className="mt-3 divide-y divide-slate-100 text-sm">
          {['Fecha', 'Principal', 'Orden', 'Embudo y etapa', 'Canales', 'Ejecutivos', 'Etiquetas', 'Estado del ticket'].map((f) => (
            <div key={f}>
              <button onClick={() => setOpen(open === f ? null : f)} className="flex w-full items-center justify-between py-2">
                {f} <ChevronDown className={`h-4 w-4 transition ${open === f ? 'rotate-180' : ''}`} />
              </button>
              {open === f && f === 'Canales' && (
                <div className="space-y-1 pb-2">
                  {Object.keys(CHANNELS).map((c) => (
                    <label key={c} className="flex items-center gap-2 text-xs">
                      <input type="radio" checked={channel === c} onChange={() => setChannel(c)} /> <ChannelIcon channel={c} /> {CHANNELS[c].label}
                    </label>
                  ))}
                  <button onClick={() => setChannel(null)} className="text-xs text-blue-600">Limpiar</button>
                </div>
              )}
              {open === f && f !== 'Canales' && <p className="pb-2 text-xs text-slate-400">Sin opciones seleccionadas</p>}
            </div>
          ))}
        </div>
      </Card>

      <Card className="flex w-80 shrink-0 flex-col">
        <div className="border-b border-slate-100 p-3"><SearchBox value={query} onChange={setQuery} placeholder="Buscar" /></div>
        <div className="scroll-thin flex-1 overflow-y-auto">
          {list.map((c) => (
            <button key={c.id} onClick={() => setSelected(c.id)} className={`flex w-full gap-3 border-b border-slate-100 p-3 text-left hover:bg-slate-50 ${selected === c.id ? 'bg-blue-50' : ''}`}>
              <Avatar name={c.name} cls="bg-slate-800" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <span className="truncate text-sm font-semibold">{c.name}</span>
                  {c.unread && <span className="h-2 w-2 rounded-full bg-blue-600" />}
                  <span className="ml-auto text-[11px] text-slate-400">{c.time}</span>
                </div>
                <p className="truncate text-xs text-slate-500">{c.last}</p>
                <div className="mt-1 flex items-center gap-1">
                  <ChannelIcon channel={c.channel} />
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${c.ai ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{c.ai ? 'IA activa' : 'IA pausada'}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </Card>

      <Card className="flex min-w-0 flex-1 flex-col">
        {!chat ? (
          <div className="m-auto text-center">
            <MessageCircle className="mx-auto h-12 w-12 text-blue-200" />
            <p className="mt-3 font-semibold text-blue-600">Selecciona un chat de la sección izquierda</p>
            <p className="text-sm text-slate-500">Elige una conversación de la lista para ver los mensajes aquí.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 border-b border-slate-100 p-3">
              <Avatar name={chat.name} cls="bg-slate-800" />
              <div><p className="font-semibold">{chat.name}</p><p className="flex items-center gap-1 text-xs text-slate-500"><ChannelIcon channel={chat.channel} /> {CHANNELS[chat.channel].label}</p></div>
              <Btn onClick={toggleAI} className="ml-auto">
                {chat.ai ? <><Pause className="h-4 w-4" /> Pausar IA</> : <><Play className="h-4 w-4" /> Activar IA</>}
              </Btn>
            </div>
            <div className="scroll-thin flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
              {chat.messages.map((m, i) => (
                <div key={i} className={`flex ${m.from === 'client' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-md rounded-2xl px-4 py-2 text-sm ${m.from === 'client' ? 'bg-white border border-slate-200' : m.from === 'ai' ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'}`}>
                    {m.from !== 'client' && <p className="mb-0.5 text-[10px] uppercase opacity-75">{m.from === 'ai' ? '✦ Asistente IA' : 'Ejecutivo'}</p>}
                    {m.text}
                    <p className="mt-1 text-right text-[10px] opacity-60">{m.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 border-t border-slate-100 p-3">
              <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder={chat.ai ? 'La IA está respondiendo. Escribe para intervenir…' : 'Escribe un mensaje…'}
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500" />
              <Btn primary onClick={send}><Send className="h-4 w-4" /> Enviar</Btn>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Vista: Asistentes                                                   */
/* ------------------------------------------------------------------ */

function AssistantView() {
  const [query, setQuery] = useState('')
  const [assistants, setAssistants] = useState([{ id: 1, name: 'Asistente Ventas', pipeline: 'Ventas | Muebles y Hogar', emoji: '🪑' }])
  const shown = assistants.filter((a) => a.name.toLowerCase().includes(query.toLowerCase()))
  const create = () => setAssistants((a) => [...a, { id: Date.now(), name: `Asistente Postventa ${a.length}`, pipeline: 'Servicio | Postventa', emoji: '🛠️' }])

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-center gap-3 p-3">
        <span className="rounded-lg bg-blue-600 p-2 text-white"><Bot className="h-5 w-5" /></span>
        <div><p className="font-semibold">Tus asistentes:</p><p className="text-sm text-slate-500">Mostrando {shown.length} asistente{shown.length !== 1 && 's'}</p></div>
        <div className="ml-auto flex flex-wrap gap-2">
          <Btn><Merge className="h-4 w-4" /> Fusionar asistentes</Btn>
          <SearchBox value={query} onChange={setQuery} placeholder="Buscar asistentes..." className="w-52" />
          <Btn><Filter className="h-4 w-4" /> Filtros</Btn>
          <Btn primary onClick={create}><Plus className="h-4 w-4" /> Crear</Btn>
        </div>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {shown.map((a) => (
          <Card key={a.id} className="p-4">
            <div className="flex items-center justify-between">
              <span className="rounded-md bg-blue-600 px-2 py-0.5 text-[11px] font-medium text-white">Escenarios</span>
              <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">100%</span>
            </div>
            <div className="mx-auto mt-3 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-3xl">{a.emoji}</div>
            <p className="mt-3 text-center font-semibold">{a.name}</p>
            <p className="text-center text-xs text-slate-500">Utilizado en 1 embudo</p>
            <p className="mx-auto mt-1 w-fit rounded bg-blue-50 px-2 py-0.5 text-[11px] text-blue-600">{a.pipeline}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Btn className="justify-center"><Eye className="h-4 w-4" /> Ver</Btn>
              <Btn className="justify-center"><Pencil className="h-4 w-4" /> Editar</Btn>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Vista: Canales                                                      */
/* ------------------------------------------------------------------ */

const ACCOUNTS = [
  { channel: 'whatsapp', name: 'Muebles y Hogar SPA', handle: '+56 9 3084 3636', api: true },
  { channel: 'instagram', name: 'Muebles y Hogar Spa', handle: '@mueblesyhogar.spa' },
  { channel: 'messenger', name: 'Muebles y Hogar SPA', handle: 'Página de Facebook' },
  { channel: 'tiktok', name: 'mueblesyhogarspa', handle: '@mueblesyhogarspa' },
]

function ChannelsView() {
  const [query, setQuery] = useState('')
  const [linked, setLinked] = useState(ACCOUNTS.map((a) => a.channel))
  const groups = Object.keys(CHANNELS)

  return (
    <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
      <Card className="flex flex-col p-4">
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-blue-600 p-2 text-white"><Smartphone className="h-5 w-5" /></span>
          <div><p className="font-semibold">Canales conectados</p><p className="text-sm text-slate-500">Administra tus canales conectados</p></div>
        </div>
        <SearchBox value={query} onChange={setQuery} placeholder="Buscar canal" className="mt-4" />
        <div className="mt-2 flex-1 space-y-3">
          {groups.map((g) => {
            const accs = ACCOUNTS.filter((a) => a.channel === g && a.name.toLowerCase().includes(query.toLowerCase()))
            if (!accs.length) return null
            return (
              <div key={g}>
                <p className="mt-3 text-xs font-semibold uppercase text-slate-500">{CHANNELS[g].label}</p>
                {accs.map((a) => (
                  <div key={a.handle} className="mt-2 flex items-center gap-3 rounded-lg p-2 hover:bg-slate-50">
                    <ChannelIcon channel={a.channel} size="lg" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{a.name} {a.api && <span className="ml-1 rounded bg-emerald-100 px-1 text-[10px] text-emerald-700">API</span>}</p>
                      <p className="truncate text-xs text-slate-500">{a.handle}</p>
                    </div>
                    <Link2 className="h-4 w-4 text-slate-400" /><MoreVertical className="h-4 w-4 text-slate-400" />
                  </div>
                ))}
              </div>
            )
          })}
        </div>
        <Btn primary className="mt-4 justify-center"><Plus className="h-4 w-4" /> Agregar canal</Btn>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-blue-600 p-2 text-white"><Columns3 className="h-5 w-5" /></span>
          <div><p className="font-semibold">Asocia canales a tus embudos</p><p className="text-sm text-slate-500">Vincula tus canales de comunicación con tus embudos.</p></div>
        </div>
        <div className="mt-4 rounded-xl border border-slate-200 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="mr-auto"><p className="text-sm font-semibold">Ventas | Muebles y Hogar</p><p className="text-xs text-slate-500">Canales asociados</p></div>
            <Btn><FlaskConical className="h-4 w-4" /> A/B Testing</Btn>
            <Btn><Gauge className="h-4 w-4" /> Límite</Btn>
            <Btn><ArrowRight className="h-4 w-4" /> Ir al embudo</Btn>
            <Btn primary onClick={() => setLinked(groups)}><Plus className="h-4 w-4" /> Asociar canal</Btn>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {ACCOUNTS.filter((a) => linked.includes(a.channel)).map((a) => (
              <div key={a.channel} className="rounded-lg border border-slate-200 p-3">
                <div className="flex justify-between">
                  <ChannelIcon channel={a.channel} size="lg" />
                  <button title="Desasociar" onClick={() => setLinked((l) => l.filter((x) => x !== a.channel))}><X className="h-4 w-4 text-slate-400" /></button>
                </div>
                <p className="mt-2 text-sm font-medium">{a.name}</p>
                <p className="text-xs text-slate-500">{a.handle}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Vista: Analítica                                                    */
/* ------------------------------------------------------------------ */

function Kpi({ label, value, delta = '+12%' }) {
  return (
    <Card className="p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <div className="mt-2 flex items-end justify-between">
        <p className="text-2xl font-bold">{value}</p>
        <span className="flex items-center gap-0.5 text-xs font-medium text-emerald-600"><TrendingUp className="h-3 w-3" />{delta}</span>
      </div>
    </Card>
  )
}

function StackBar({ title, total, parts }) {
  return (
    <div>
      <div className="flex justify-between text-xs font-semibold uppercase text-slate-500"><span>{title}</span><span>{total.toLocaleString('es-CL')}</span></div>
      <div className="mt-1.5 flex h-3 overflow-hidden rounded-full">
        {parts.map((p) => <div key={p.label} className={p.cls} style={{ width: `${p.pct}%` }} />)}
      </div>
      <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-slate-600">
        {parts.map((p) => <span key={p.label} className="flex items-center gap-1"><span className={`h-2 w-2 rounded-full ${p.cls}`} />{p.label} {p.value} ({p.pct}%)</span>)}
      </div>
    </div>
  )
}

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

function Heatmap() {
  // Tráfico pseudoaleatorio estable con picos entre 10:00 y 18:00
  const val = (d, h) => {
    const peak = h >= 10 && h <= 18 ? 1 : h >= 8 && h <= 21 ? 0.4 : 0.05
    return Math.round(peak * (12 + ((d * 7 + h * 13) % 12)) * (d < 5 ? 1 : 0.6))
  }
  return (
    <div className="overflow-x-auto">
      <div className="ml-16 flex text-[10px] text-slate-400">
        {Array.from({ length: 24 }, (_, h) => <span key={h} className="w-5 shrink-0 text-center">{h % 3 === 0 ? `${h % 12 || 12}${h < 12 ? 'am' : 'pm'}` : ''}</span>)}
      </div>
      {DAYS.map((d, di) => (
        <div key={d} className="mt-0.5 flex items-center">
          <span className="w-16 shrink-0 text-xs text-slate-500">{d}</span>
          {Array.from({ length: 24 }, (_, h) => {
            const v = val(di, h)
            return <span key={h} title={`${d} ${h}:00 · ${v} mensajes`} className="mr-0.5 h-4 w-[18px] shrink-0 rounded-sm bg-blue-600" style={{ opacity: Math.max(0.07, v / 24) }} />
          })}
        </div>
      ))}
    </div>
  )
}

function Donut({ ai = 61.1 }) {
  const r = 40, c = 2 * Math.PI * r
  return (
    <svg viewBox="0 0 100 100" className="mx-auto h-40 w-40 -rotate-90">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#10b981" strokeWidth="14" />
      <circle cx="50" cy="50" r={r} fill="none" stroke="#2563eb" strokeWidth="14" strokeDasharray={`${(ai / 100) * c} ${c}`} />
    </svg>
  )
}

function TicketFlow() {
  const from = { y: 90, h: 120 }
  const targets = [
    { label: 'Asesoría muebles', n: 48, color: '#2563eb' },
    { label: 'Asistencia humana', n: 38, color: '#f97316' },
    { label: 'Proyecto cocina', n: 27, color: '#8b5cf6' },
    { label: 'Cierre de venta', n: 18, color: '#10b981' },
    { label: 'Cliente perdido', n: 12, color: '#f43f5e' },
  ]
  let y = 10, fy = from.y
  const total = targets.reduce((a, t) => a + t.n, 0)
  return (
    <svg viewBox="0 0 520 300" className="w-full">
      <rect x="10" y={from.y} width="14" height={from.h} rx="3" fill="#1e40af" />
      <text x="30" y={from.y - 6} fontSize="11" fill="#475569">Inicial ({total})</text>
      {targets.map((t) => {
        const h = (t.n / total) * 230, fh = (t.n / total) * from.h
        const path = `M24 ${fy} C 200 ${fy}, 200 ${y}, 380 ${y} L380 ${y + h} C 200 ${y + h}, 200 ${fy + fh}, 24 ${fy + fh} Z`
        const el = (
          <g key={t.label}>
            <path d={path} fill={t.color} opacity="0.25" />
            <rect x="380" y={y} width="12" height={h} rx="3" fill={t.color} />
            <text x="398" y={y + h / 2 + 4} fontSize="11" fill="#334155">{t.label} · {t.n}</text>
          </g>
        )
        y += h + 12; fy += fh
        return el
      })}
    </svg>
  )
}

function AnalyticsView({ tickets }) {
  const won = tickets.filter((t) => t.status === 'won').length
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase text-slate-500">Conversaciones</p>
        <Btn><CalendarDays className="h-4 w-4" /> Últimos 30 días <ChevronDown className="h-4 w-4" /></Btn>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Kpi label="Mensajes enviados IA" value="968" delta="+38%" />
        <Kpi label="Mensajes recibidos" value="1.321" delta="+24%" />
        <Kpi label="Contactos creados" value="204" delta="+17%" />
        <Kpi label="Contactos activos" value="116" delta="+9%" />
        <Kpi label="Conversaciones totales" value="148" delta="+21%" />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="grid gap-6 p-5 md:grid-cols-[160px_1fr]">
          <div>
            <p className="text-sm text-slate-500">Cobertura de IA</p>
            <p className="mt-4 text-4xl font-bold text-blue-600">70.5%</p>
            <p className="text-sm font-medium">Mensajes IA</p>
            <p className="mt-1 text-xs text-slate-500">968 de 1.373 mensajes enviados por IA</p>
          </div>
          <div className="space-y-6 self-center">
            <StackBar title="Mensajes" total={1373} parts={[{ label: 'IA', value: 968, pct: 70.5, cls: 'bg-blue-600' }, { label: 'Humano', value: 405, pct: 29.5, cls: 'bg-orange-500' }]} />
            <StackBar title="Conversaciones" total={148} parts={[{ label: 'Solo IA', value: 60, pct: 40.5, cls: 'bg-blue-600' }, { label: 'Mixto', value: 70, pct: 47.3, cls: 'bg-emerald-500' }, { label: 'Solo humano', value: 18, pct: 12.2, cls: 'bg-orange-500' }]} />
          </div>
        </Card>
        <Card className="p-5">
          <p className="mb-3 text-sm font-medium">Mensajes recibidos por horario</p>
          <Heatmap />
        </Card>
      </div>

      <p className="pt-2 text-xs font-semibold uppercase text-slate-500">Tickets</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Total de oportunidades" value="143" />
        <Kpi label="Tickets creados" value="143" />
        <Kpi label="Tickets resueltos" value={72 + won} />
        <Kpi label="Tasa de éxito" value="29,17%" delta="+4%" />
      </div>
      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <Card className="p-5"><p className="mb-2 text-sm font-medium">Ruta del ticket</p><TicketFlow /></Card>
        <Card className="p-5">
          <p className="mb-2 text-sm font-medium">Resolución humano vs IA</p>
          <Donut />
          <div className="mt-3 flex justify-center gap-4 text-sm">
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-blue-600" /> IA 61,1%</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Humano 38,9%</span>
          </div>
        </Card>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Vista: CRM                                                          */
/* ------------------------------------------------------------------ */

function CrmView() {
  const [query, setQuery] = useState('')
  const rows = CUSTOMERS.filter((c) => c[0].toLowerCase().includes(query.toLowerCase()) || c[1].includes(query))
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-3">
        <div className="mr-auto"><p className="font-semibold">Clientes</p><p className="text-sm text-slate-500">Mostrando {rows.length} de 274 clientes</p></div>
        <Btn><Megaphone className="h-4 w-4" /> Enviar campaña</Btn>
        <Btn><Merge className="h-4 w-4" /> Fusionar clientes</Btn>
        <Btn><Upload className="h-4 w-4" /> Importar</Btn>
        <Btn><Download className="h-4 w-4" /> Exportar</Btn>
        <SearchBox value={query} onChange={setQuery} placeholder="Buscar clientes..." className="w-52" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr><th className="p-3">Cliente</th><th>Canal</th><th>Etiqueta</th><th>Responsable</th><th /></tr>
          </thead>
          <tbody>
            {rows.map(([name, phone, ch, tag]) => (
              <tr key={name} className="border-t border-slate-100">
                <td className="flex items-center gap-3 p-3"><Avatar name={name} /><div><p className="font-medium">{name}</p><p className="text-xs text-slate-500">{phone}</p></div></td>
                <td><ChannelIcon channel={ch} /></td>
                <td><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{tag}</span></td>
                <td className="text-slate-400">—</td>
                <td className="pr-3 text-right"><Btn className="mr-1"><MessageCircle className="h-3.5 w-3.5" /> Chat</Btn><Btn><Eye className="h-3.5 w-3.5" /> Ver</Btn></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/* Vista: Inicio                                                       */
/* ------------------------------------------------------------------ */

function HomeView({ tickets, go }) {
  const pipelineValue = tickets.filter((t) => t.status === 'open').reduce((a, t) => a + t.value, 0)
  const pending = tickets.filter((t) => !t.ai && t.status === 'open')
  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-center gap-4 bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
        <div className="mr-auto">
          <p className="text-sm opacity-80">Hola, Gaby 👋</p>
          <p className="text-2xl font-bold">Tu IA respondió el 70,5% de los mensajes este mes</p>
          <p className="mt-1 text-sm opacity-80">Eso equivale a ~32 horas de atención ahorradas.</p>
        </div>
        <button onClick={() => go('analitica')} className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-blue-700">Ver analítica</button>
      </Card>
      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi label="Valor en embudo (CLP)" value={fmtCLP(pipelineValue)} />
        <Kpi label="Tickets abiertos" value={tickets.filter((t) => t.status === 'open').length} />
        <Kpi label="Ventas ganadas hoy" value={tickets.filter((t) => t.status === 'won').length} />
      </div>
      <Card className="p-4">
        <p className="font-semibold">Requieren atención humana ({pending.length})</p>
        <div className="mt-2 divide-y divide-slate-100">
          {pending.map((t) => (
            <button key={t.id} onClick={() => go('embudo')} className="flex w-full items-center gap-3 py-2 text-left hover:bg-slate-50">
              <ChannelIcon channel={t.channel} /><span className="text-sm font-medium">{t.name}</span>
              <span className="truncate text-xs text-slate-500">{t.msg}</span><ArrowRight className="ml-auto h-4 w-4 shrink-0 text-slate-400" />
            </button>
          ))}
        </div>
      </Card>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Vista: Ajustes > Plan y facturación                                 */
/* ------------------------------------------------------------------ */

const PLANS = [
  { name: 'Emprende', price: 49990, desc: 'Para negocios que parten con WhatsApp', features: ['1 canal', '2 usuarios', '500 conversaciones IA/mes', 'Embudo Kanban'] },
  { name: 'Pyme', price: 149990, desc: 'El más elegido por tiendas y servicios', popular: true, features: ['3 canales (WhatsApp, IG, Messenger)', '5 usuarios', '2.000 conversaciones IA/mes', 'CRM + campañas', 'Analítica completa'] },
  { name: 'Empresa', price: 299990, desc: 'Equipos de venta con varios embudos', features: ['Canales ilimitados + TikTok', '15 usuarios', '8.000 conversaciones IA/mes', 'Workflows y API', 'Soporte prioritario'] },
  { name: 'Corporativo', price: null, desc: 'Multi-marca, agencias y marca blanca', features: ['Todo ilimitado', 'Marca blanca', 'SLA y ejecutivo dedicado', 'Integraciones a medida'] },
]

function BillingView() {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xl font-bold">Elige tu plan</p>
        <p className="text-sm text-slate-500">Precios mensuales en CLP + IVA. Implementación guiada disponible desde $150.000 (pago único).</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {PLANS.map((p) => (
          <Card key={p.name} className={`relative flex flex-col p-5 ${p.popular ? 'border-2 border-blue-600' : ''}`}>
            {p.popular && <span className="absolute -top-3 left-5 rounded-full bg-blue-600 px-3 py-0.5 text-xs font-semibold text-white">Más popular</span>}
            <p className="font-semibold">{p.name}</p>
            <p className="text-xs text-slate-500">{p.desc}</p>
            <p className="mt-4 text-3xl font-bold">{p.price ? fmtCLP(p.price) : 'A medida'}</p>
            {p.price && <p className="text-xs text-slate-500">/mes</p>}
            <ul className="mt-4 flex-1 space-y-2 text-sm">
              {p.features.map((f) => <li key={f} className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-emerald-500" />{f}</li>)}
            </ul>
            <Btn primary={p.popular} className="mt-5 justify-center">{p.price ? 'Elegir plan' : 'Hablar con ventas'}</Btn>
          </Card>
        ))}
      </div>
      <Card className="flex items-center gap-3 p-4 text-sm">
        <Zap className="h-5 w-5 text-amber-500" /> Paquetes extra: +1.000 conversaciones IA por $29.990 · usuarios adicionales $9.990/mes.
      </Card>
    </div>
  )
}

function ComingSoon({ module }) {
  const m = MODULES.find((x) => x.id === module) ?? { label: 'Ajustes', icon: Settings }
  const Icon = m.icon
  return (
    <Card className="mx-auto mt-10 max-w-lg p-10 text-center">
      <Icon className="mx-auto h-10 w-10 text-blue-600" />
      <p className="mt-3 text-lg font-semibold">{m.label}</p>
      <p className="mt-1 text-sm text-slate-500">Este módulo está en el roadmap. Aquí vivirán las funciones de {m.label.toLowerCase()} conectadas al backend.</p>
      <span className="mt-4 inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-600"><Sparkles className="h-3 w-3" /> Próximamente</span>
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/* App                                                                 */
/* ------------------------------------------------------------------ */

const TITLES = { inicio: 'Inicio', embudo: 'Embudo', chat: 'Chat', asistente: 'Asistente', crm: 'CRM', canales: 'Canales', analitica: 'Analítica', ajustes: 'Ajustes' }
const CRUMBS = { embudo: ['Embudo', 'Ventas | Muebles y Hogar', 'Tickets'], asistente: ['Asistente', 'Asistentes'], analitica: ['Analítica', 'Resumen'], canales: ['Canales'], crm: ['CRM', 'Clientes'], ajustes: ['Ajustes', 'Plan y facturación'] }

export default function App() {
  const [module, setModule] = useState('embudo')
  const [tickets, setTickets] = useState(INITIAL_TICKETS)
  const sub = SUBMENUS[module]
  const [subItem, setSubItem] = useState({})
  const crumbs = CRUMBS[module] ?? [TITLES[module] ?? MODULES.find((m) => m.id === module)?.label]

  const view = useMemo(() => {
    switch (module) {
      case 'inicio': return <HomeView tickets={tickets} go={setModule} />
      case 'embudo': return <PipelineView tickets={tickets} setTickets={setTickets} />
      case 'chat': return <ChatView />
      case 'asistente': return <AssistantView />
      case 'crm': return <CrmView />
      case 'canales': return <ChannelsView />
      case 'analitica': return <AnalyticsView tickets={tickets} />
      case 'ajustes': return <BillingView />
      default: return <ComingSoon module={module} />
    }
  }, [module, tickets])

  const RailButton = ({ id, label, icon: Icon }) => (
    <button onClick={() => setModule(id)} className={`flex w-full flex-col items-center gap-0.5 rounded-lg py-1.5 text-[10px] transition ${module === id ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-100'}`}>
      <Icon className="h-5 w-5" />{label}
    </button>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <aside className="scroll-thin flex w-20 shrink-0 flex-col items-center gap-1 overflow-y-auto border-r border-slate-200 bg-white px-2 py-3">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white">M</div>
        {MODULES.map((m) => <RailButton key={m.id} {...m} />)}
        <div className="mt-auto w-full pt-2"><RailButton id="ajustes" label="Ajustes" icon={Settings} /></div>
      </aside>

      {sub && (
        <aside className="hidden w-56 shrink-0 border-r border-slate-200 bg-white p-3 md:block">
          <p className="px-2 text-xs font-bold uppercase tracking-wide text-slate-700">{sub.title}</p>
          {sub.groups.map(([group, items]) => (
            <div key={group} className="mt-4">
              {group && <p className="px-2 text-[11px] font-semibold uppercase text-slate-400">{group}</p>}
              {items.map(([label, Icon], i) => {
                const active = (subItem[module] ?? sub.groups[0][1][0][0]) === label
                return (
                  <button key={label + i} onClick={() => setSubItem((s) => ({ ...s, [module]: label }))}
                    className={`mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm ${active ? 'bg-blue-50 font-medium text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}>
                    <Icon className="h-4 w-4" />{label}
                  </button>
                )
              })}
            </div>
          ))}
        </aside>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-4">
          <nav className="flex items-center gap-1 text-sm text-slate-500">
            {crumbs.map((c, i) => (
              <span key={c} className="flex items-center gap-1">
                {i > 0 && <span className="text-slate-300">›</span>}
                <span className={i === crumbs.length - 1 ? 'font-medium text-slate-800' : ''}>{c}</span>
              </span>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <span className="mr-2 hidden text-sm font-semibold sm:block">momo<span className="text-blue-600">.ai</span></span>
            {[MessageCircle, ClipboardList, Bell].map((I, i) => (
              <button key={i} className="relative rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50">
                <I className="h-4 w-4" />{I === Bell && <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-rose-500" />}
              </button>
            ))}
            <span className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">GP</span>
          </div>
        </header>
        <main className="scroll-thin min-h-0 flex-1 overflow-auto p-4">{view}</main>
      </div>
    </div>
  )
}
