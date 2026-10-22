import { MOMO_URL_PREDETERMINADA } from './config.js'

const $ = (id) => document.getElementById(id)
const enviar = (msg) => chrome.runtime.sendMessage(msg)

function textoEstado(embudo) {
  if (!embudo) return 'Cargando…'
  if (embudo.estado === 'error') return embudo.mensaje
  if (embudo.estado !== 'ok') return ''
  const esperan = embudo.chats.filter((c) => c.etapa?.humano || !c.iaActiva).length
  return `${embudo.chats.length} chats recientes · ${esperan} esperan a una persona`
}

async function pintar() {
  const { sesion, embudo, burbujaVisible, momoUrl } = await chrome.storage.local.get(['sesion', 'embudo', 'burbujaVisible', 'momoUrl'])
  $('ingreso').hidden = Boolean(sesion)
  $('cuenta').hidden = !sesion
  if (sesion) {
    $('correo').textContent = sesion.email ?? ''
    $('estado').textContent = textoEstado(embudo)
  }
  $('visible').checked = burbujaVisible !== false
  $('momoUrl').value = momoUrl || MOMO_URL_PREDETERMINADA
}

$('ingreso').addEventListener('submit', async (e) => {
  e.preventDefault()
  const datos = new FormData(e.target)
  const boton = e.target.querySelector('button')
  boton.disabled = true; boton.textContent = 'Ingresando…'; $('error').hidden = true
  const r = await enviar({ tipo: 'ingresar', email: datos.get('email'), password: datos.get('password') })
  boton.disabled = false; boton.textContent = 'Ingresar'
  if (!r?.ok) { $('error').textContent = 'Correo o contraseña incorrectos.'; $('error').hidden = false; return }
  pintar()
})
$('abrir').addEventListener('click', () => { enviar({ tipo: 'abrirEmbudo' }); window.close() })
$('actualizar').addEventListener('click', async () => { $('estado').textContent = 'Actualizando…'; await enviar({ tipo: 'actualizar' }); pintar() })
$('salir').addEventListener('click', async () => { await enviar({ tipo: 'salir' }); pintar() })
$('visible').addEventListener('change', (e) => chrome.storage.local.set({ burbujaVisible: e.target.checked }))
$('guardarUrl').addEventListener('click', async () => {
  const valor = $('momoUrl').value.trim()
  try { new URL(valor) } catch { $('momoUrl').focus(); return }
  await chrome.storage.local.set({ momoUrl: valor.replace(/\/+$/, '') })
  $('guardarUrl').textContent = 'Guardado ✓'
})

pintar()
