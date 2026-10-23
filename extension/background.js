// Service worker: sesión con Supabase, lectura de las conversaciones y apertura de chats en Momo.
import { MINUTOS_ACTUALIZACION, MOMO_URL_PREDETERMINADA, SUPABASE_KEY, SUPABASE_URL } from './config.js'

const ALARMA = 'momo-actualizar'

// ---------- Sesión ----------

async function guardarSesion(s) {
  const sesion = { access_token: s.access_token, refresh_token: s.refresh_token, expires_at: s.expires_at, email: s.user?.email ?? null }
  await chrome.storage.local.set({ sesion })
  return sesion
}

async function pedirToken(grant, cuerpo) {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=${grant}`, {
    method: 'POST',
    headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo),
  })
  const datos = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(datos.error_description || datos.msg || 'No se pudo iniciar sesión')
  return guardarSesion(datos)
}

/** Devuelve un access token vigente, renovándolo si vence en menos de un minuto. */
async function tokenVigente() {
  const { sesion } = await chrome.storage.local.get('sesion')
  if (!sesion) return null
  if (sesion.expires_at * 1000 - Date.now() > 60_000) return sesion.access_token
  try {
    return (await pedirToken('refresh_token', { refresh_token: sesion.refresh_token })).access_token
  } catch {
    await chrome.storage.local.remove('sesion')
    return null
  }
}

// ---------- Datos del embudo ----------

const SELECT = [
  'id', 'channel', 'last_message_at', 'last_message_preview', 'last_message_author', 'ai_enabled', 'unread_count',
  'contacto:contacts(name)',
  'tickets(step,status,design)',
].join(',')

/** Etiqueta de la venta, igual que en la bandeja de Momo. */
function etiqueta(venta) {
  if (!venta) return { nombre: 'Consulta', orden: 1 }
  if (venta.status === 'lost') return { nombre: 'Perdida', orden: 6 }
  if (venta.design && venta.status === 'open') return { nombre: 'Área de Diseño', orden: 0 }
  if (venta.step === 'despachado') return { nombre: 'Despachada', orden: 5 }
  if (venta.step === 'pagado') return { nombre: 'Pagada', orden: 4 }
  if (venta.step === 'cotizado') return { nombre: 'Cotizada', orden: 2 }
  return { nombre: 'Consulta', orden: 1 }
}

async function leerEmbudo() {
  const token = await tokenVigente()
  if (!token) return { estado: 'sin-sesion' }

  const params = new URLSearchParams({
    select: SELECT,
    status: 'eq.open',
    order: 'last_message_at.desc.nullslast',
    limit: '30',
  })
  const r = await fetch(`${SUPABASE_URL}/rest/v1/conversations?${params}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}`, 'Accept-Profile': 'momo' },
  })
  if (r.status === 401) { await chrome.storage.local.remove('sesion'); return { estado: 'sin-sesion' } }
  if (!r.ok) {
    const e = await r.json().catch(() => ({}))
    return { estado: 'error', mensaje: e.code === 'PGRST106' ? 'Falta habilitar el esquema "momo" en Supabase (Data API).' : 'No se pudieron leer las conversaciones.' }
  }

  const filas = await r.json()
  const chats = filas.map((c) => {
    const e = etiqueta(c.tickets?.[0])
    return {
      id: c.id,
      nombre: c.contacto?.name ?? 'Sin nombre',
      canal: c.channel ?? 'marketplace',
      ultimo: c.last_message_preview ?? '',
      autor: c.last_message_author ?? null,
      fecha: c.last_message_at,
      iaActiva: c.ai_enabled,
      noLeidos: c.unread_count,
      // "Te espera": la atiende una persona y el último mensaje es del cliente.
      espera: !c.ai_enabled && c.last_message_author === 'client',
      etapa: { nombre: e.nombre, emoji: '', orden: e.orden },
    }
  })
  return { estado: 'ok', chats, actualizado: new Date().toISOString() }
}

async function actualizar() {
  const embudo = await leerEmbudo().catch(() => ({ estado: 'error', mensaje: 'Sin conexión.' }))
  await chrome.storage.local.set({ embudo })
  const pendientes = embudo.estado === 'ok' ? embudo.chats.filter((c) => c.espera).length : 0
  await chrome.action.setBadgeText({ text: pendientes ? String(pendientes) : '' })
  await chrome.action.setBadgeBackgroundColor({ color: '#A3262A' })
  return embudo
}

// ---------- Abrir chats sin acumular ventanas ----------

async function momoUrl() {
  const { momoUrl } = await chrome.storage.local.get('momoUrl')
  return (momoUrl || MOMO_URL_PREDETERMINADA).replace(/\/+$/, '')
}

/** Reutiliza la pestaña de Momo si existe; si no, abre una sola pestaña en la ventana actual. */
async function abrirEnMomo(ruta) {
  const base = await momoUrl()
  const url = base + ruta
  const [existente] = await chrome.tabs.query({ url: base + '/*' })
  if (existente) {
    await chrome.tabs.update(existente.id, { url, active: true })
    await chrome.windows.update(existente.windowId, { focused: true })
  } else {
    await chrome.tabs.create({ url })
  }
}

// ---------- Mensajes desde el popup y la burbuja ----------

chrome.runtime.onMessage.addListener((msg, _sender, responder) => {
  const tareas = {
    ingresar: async () => { await pedirToken('password', { email: msg.email, password: msg.password }); return actualizar() },
    salir: async () => { await chrome.storage.local.remove(['sesion', 'embudo']); await chrome.action.setBadgeText({ text: '' }); return { estado: 'sin-sesion' } },
    actualizar: () => actualizar(),
    abrirChat: () => abrirEnMomo(`/conversaciones?c=${encodeURIComponent(msg.id)}`),
    abrirEmbudo: () => abrirEnMomo('/conversaciones?f=esperan'),
  }
  const tarea = tareas[msg.tipo]
  if (!tarea) return false
  tarea().then((r) => responder({ ok: true, r }), (e) => responder({ ok: false, error: e.message }))
  return true // respuesta asíncrona
})

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create(ALARMA, { periodInMinutes: MINUTOS_ACTUALIZACION })
  actualizar()
})
chrome.runtime.onStartup.addListener(() => actualizar())
chrome.alarms.onAlarm.addListener((a) => { if (a.name === ALARMA) actualizar() })
