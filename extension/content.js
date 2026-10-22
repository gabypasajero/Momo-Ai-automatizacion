// Burbuja de Momo en la esquina superior izquierda de cada página.
// Lee el embudo que guarda el service worker y abre los chats en la pestaña de Momo.
(() => {
  if (window.top !== window || document.getElementById('momo-burbuja-raiz')) return

  const CANALES = {
    messenger: { nombre: 'Messenger', color: '#1f8ef1' },
    whatsapp: { nombre: 'WhatsApp', color: '#25D366' },
    instagram: { nombre: 'Instagram', color: '#d6249f' },
    tiktok: { nombre: 'TikTok', color: '#111827' },
  }

  const raiz = document.createElement('div')
  raiz.id = 'momo-burbuja-raiz'
  const sombra = raiz.attachShadow({ mode: 'closed' })
  sombra.innerHTML = `
    <style>
      :host { all: initial; }
      * { box-sizing: border-box; font-family: Nunito, system-ui, -apple-system, Segoe UI, sans-serif; }
      .caja { position: fixed; top: 12px; left: 12px; z-index: 2147483647; color: #3A2A33; }
      .boton { width: 48px; height: 48px; border: 2px solid #F0BCCD; border-radius: 16px; cursor: pointer; padding: 0;
        background: #F7D9E2; box-shadow: 0 6px 18px rgba(168, 50, 94, .3); position: relative; display: grid; place-items: center; }
      .boton:hover { background: #F0BCCD; }
      .boton:focus-visible, button:focus-visible, .chat:focus-visible { outline: 2px solid #8E6CC9; outline-offset: 2px; }
      .contador { position: absolute; top: -6px; right: -6px; min-width: 20px; height: 20px; padding: 0 5px; border-radius: 10px;
        background: #A3262A; color: #fff; font-size: 11px; line-height: 20px; font-weight: 700; border: 2px solid #fff; }
      .panel { margin-top: 8px; width: 340px; max-height: min(560px, calc(100vh - 80px)); display: flex; flex-direction: column;
        background: #fff; border: 1px solid #F2DCE1; border-radius: 16px; box-shadow: 0 12px 36px rgba(31, 43, 73, .18); overflow: hidden; }
      .cabeza { display: flex; align-items: center; gap: 8px; padding: 12px 14px; border-bottom: 1px solid #F2DCE1; }
      .cabeza h2 { margin: 0; font-size: 14px; font-weight: 700; flex: 1; }
      .mini { border: 1px solid #F2DCE1; background: #fff; border-radius: 8px; padding: 4px 8px; font-size: 12px; cursor: pointer; color: #3A2A33; }
      .mini:hover { background: #FFF8F6; }
      .etapas { display: flex; gap: 6px; padding: 10px 14px; overflow-x: auto; border-bottom: 1px solid #F2DCE1; }
      .etapa { flex: none; border: 1px solid #F2DCE1; background: #FFF8F6; border-radius: 999px; padding: 4px 10px; font-size: 12px; cursor: pointer; color: #3A2A33; }
      .etapa[aria-pressed="true"] { background: #A8325E; border-color: #A8325E; color: #fff; }
      .lista { overflow-y: auto; margin: 0; padding: 0; list-style: none; }
      .chat { width: 100%; display: flex; gap: 10px; text-align: left; padding: 10px 14px; border: 0; border-bottom: 1px solid #F7E8EC; background: #fff; cursor: pointer; }
      .chat:hover { background: #FFF3F6; }
      .avatar { flex: none; width: 34px; height: 34px; border-radius: 50%; background: #3A2A33; color: #fff; display: grid; place-items: center; font-weight: 700; font-size: 13px; position: relative; }
      .canal { position: absolute; right: -2px; bottom: -2px; width: 12px; height: 12px; border-radius: 50%; border: 2px solid #fff; }
      .cuerpo { min-width: 0; flex: 1; }
      .fila { display: flex; align-items: center; gap: 6px; }
      .nombre { font-weight: 600; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .hora { margin-left: auto; font-size: 11px; color: #705663; flex: none; }
      .texto { font-size: 12px; color: #705663; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin: 2px 0 4px; }
      .sello { font-size: 10px; font-weight: 600; border-radius: 999px; padding: 1px 7px; }
      .humano { background: #fff0f1; color: #A3262A; }
      .ia { background: #DDF2E6; color: #1E7A4C; }
      .tag { background: #F7D9E2; color: #8C2950; }
      .punto { width: 8px; height: 8px; border-radius: 50%; background: #A8325E; flex: none; }
      .aviso { padding: 18px 14px; font-size: 13px; color: #705663; line-height: 1.45; }
      .pie { padding: 8px 14px; font-size: 11px; color: #705663; border-top: 1px solid #F2DCE1; }
      [hidden] { display: none !important; }
    </style>
    <div class="caja">
      <button class="boton" type="button" aria-expanded="false" aria-label="Abrir embudo de Momo" title="Embudo de Momo"><svg width="36" height="27" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 8 64 48"><g><path d="M21 31 C11 32 2 25 2 13 C11 10 23 16 28 25 Z" fill="#FBF3EA" stroke="#3A2A33" stroke-width="1.6" stroke-linejoin="round"></path><path d="M20 28 C12 28 6 22 6 16 C12 15 20 19 24 25 Z" fill="#E393AE"></path><path d="M43 31 C53 32 62 25 62 13 C53 10 41 16 36 25 Z" fill="#FBF3EA" stroke="#3A2A33" stroke-width="1.6" stroke-linejoin="round"></path><path d="M44 28 C52 28 58 22 58 16 C52 15 44 19 40 25 Z" fill="#E393AE"></path><ellipse cx="32" cy="38" rx="17" ry="15.5" fill="#FBF3EA" stroke="#3A2A33" stroke-width="1.6"></ellipse><path d="M28 24 Q32 19 36 24 Q32 22.5 28 24 Z" fill="#EEDFCF"></path><ellipse cx="21" cy="44" rx="3.6" ry="2.4" fill="#F2B8C9"></ellipse><ellipse cx="43" cy="44" rx="3.6" ry="2.4" fill="#F2B8C9"></ellipse><circle cx="25" cy="37" r="5.6" fill="#fff" stroke="#3A2A33" stroke-width="1.3"></circle><circle cx="39" cy="37" r="5.6" fill="#fff" stroke="#3A2A33" stroke-width="1.3"></circle><circle cx="25.6" cy="37.6" r="3.6" fill="#8E6CC9"></circle><circle cx="38.4" cy="37.6" r="3.6" fill="#8E6CC9"></circle><circle cx="25.8" cy="38" r="1.9" fill="#3A2A33"></circle><circle cx="38.2" cy="38" r="1.9" fill="#3A2A33"></circle><circle cx="24.3" cy="36.1" r="1.1" fill="#fff"></circle><circle cx="36.9" cy="36.1" r="1.1" fill="#fff"></circle><path d="M32 44.2 C30.6 42.8 29.6 43.9 30.4 44.9 L32 46.4 L33.6 44.9 C34.4 43.9 33.4 42.8 32 44.2 Z" fill="#A8325E"></path><path d="M29 48 Q32 50.6 35 48" fill="none" stroke="#3A2A33" stroke-width="1.3" stroke-linecap="round"></path></g></svg><span class="contador" hidden></span></button>
      <section class="panel" hidden aria-label="Embudo de Momo">
        <div class="cabeza">
          <h2>Momo · Embudo</h2>
          <button class="mini" data-accion="actualizar" type="button" title="Actualizar ahora">↻</button>
          <button class="mini" data-accion="embudo" type="button">Ver embudo</button>
        </div>
        <div class="etapas" role="group" aria-label="Filtrar por etapa"></div>
        <ul class="lista"></ul>
        <p class="aviso" hidden></p>
        <div class="pie"></div>
      </section>
    </div>`

  const $ = (s) => sombra.querySelector(s)
  const boton = $('.boton'), panel = $('.panel'), contador = $('.contador')
  const etapasEl = $('.etapas'), lista = $('.lista'), aviso = $('.aviso'), pie = $('.pie')
  let filtro = null
  let embudo = null

  const hace = (iso) => {
    if (!iso) return ''
    const min = Math.round((Date.now() - new Date(iso)) / 60000)
    if (min < 1) return 'ahora'
    if (min < 60) return `${min} min`
    if (min < 1440) return `${Math.round(min / 60)} h`
    return new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
  }
  const esperaHumano = (c) => Boolean(c.etapa?.humano) || !c.iaActiva

  function el(tag, clase, texto) {
    const e = document.createElement(tag)
    if (clase) e.className = clase
    if (texto != null) e.textContent = texto
    return e
  }

  function pintar() {
    lista.replaceChildren(); etapasEl.replaceChildren()
    aviso.hidden = true

    if (!embudo || embudo.estado === 'sin-sesion') {
      etapasEl.hidden = true
      aviso.hidden = false
      aviso.textContent = 'Inicia sesión haciendo clic en el ícono de Momo en la barra de Chrome (arriba a la derecha).'
      contador.hidden = true; pie.textContent = ''
      return
    }
    if (embudo.estado === 'error') {
      etapasEl.hidden = true
      aviso.hidden = false; aviso.textContent = embudo.mensaje
      return
    }

    const chats = embudo.chats
    const pendientes = chats.filter(esperaHumano).length
    contador.hidden = !pendientes
    contador.textContent = String(pendientes)
    boton.setAttribute('aria-label', pendientes ? `Abrir embudo de Momo: ${pendientes} esperan a una persona` : 'Abrir embudo de Momo')

    // Etapas ordenadas como en el Kanban, con su cantidad de chats.
    const etapas = new Map()
    for (const c of chats) {
      const k = c.etapa?.nombre ?? 'Sin etapa'
      const e = etapas.get(k) ?? { nombre: k, emoji: c.etapa?.emoji ?? '', orden: c.etapa?.orden ?? 99, n: 0 }
      e.n += 1; etapas.set(k, e)
    }
    etapasEl.hidden = false
    const chip = (nombre, texto) => {
      const b = el('button', 'etapa', texto)
      b.type = 'button'
      b.setAttribute('aria-pressed', String(filtro === nombre))
      b.addEventListener('click', () => { filtro = filtro === nombre ? null : nombre; pintar() })
      return b
    }
    etapasEl.append(chip(null, `Todos ${chats.length}`))
    ;[...etapas.values()].sort((a, b) => a.orden - b.orden)
      .forEach((e) => etapasEl.append(chip(e.nombre, `${e.emoji} ${e.nombre} ${e.n}`.trim())))

    const visibles = chats
      .filter((c) => !filtro || (c.etapa?.nombre ?? 'Sin etapa') === filtro)
      .sort((a, b) => Number(esperaHumano(b)) - Number(esperaHumano(a))) // primero los que esperan a una persona
    if (!visibles.length) { aviso.hidden = false; aviso.textContent = 'No hay chats en esta etapa.' }

    for (const c of visibles) {
      const li = el('li')
      const b = el('button', 'chat'); b.type = 'button'
      b.title = `Abrir el chat de ${c.nombre} en Momo`
      const av = el('span', 'avatar', c.nombre.trim().charAt(0).toUpperCase())
      const canal = el('span', 'canal'); canal.style.background = (CANALES[c.canal] ?? CANALES.messenger).color
      canal.title = (CANALES[c.canal] ?? CANALES.messenger).nombre
      av.append(canal)
      const cuerpo = el('span', 'cuerpo')
      const f1 = el('span', 'fila')
      if (c.noLeidos > 0) f1.append(el('span', 'punto'))
      f1.append(el('span', 'nombre', c.nombre), el('span', 'hora', hace(c.fecha)))
      const prefijo = c.autor === 'ai' ? 'IA: ' : c.autor === 'human' ? 'Tú: ' : ''
      const f2 = el('span', 'texto', prefijo + (c.ultimo || 'Sin mensajes'))
      f2.style.display = 'block'
      const f3 = el('span', 'fila')
      f3.append(esperaHumano(c) ? el('span', 'sello humano', 'Espera a una persona') : el('span', 'sello ia', 'IA respondiendo'))
      if (c.etapa) f3.append(el('span', 'sello tag', c.etapa.nombre))
      cuerpo.append(f1, f2, f3)
      b.append(av, cuerpo)
      b.addEventListener('click', () => chrome.runtime.sendMessage({ tipo: 'abrirChat', id: c.id }))
      li.append(b); lista.append(li)
    }
    pie.textContent = `Actualizado ${hace(embudo.actualizado)} · se renueva cada minuto`
  }

  function abrir(abierto) {
    panel.hidden = !abierto
    boton.setAttribute('aria-expanded', String(abierto))
    chrome.storage.local.set({ burbujaAbierta: abierto })
  }

  boton.addEventListener('click', () => abrir(panel.hidden))
  sombra.addEventListener('keydown', (e) => { if (e.key === 'Escape') { abrir(false); boton.focus() } })
  $('[data-accion="actualizar"]').addEventListener('click', () => chrome.runtime.sendMessage({ tipo: 'actualizar' }))
  $('[data-accion="embudo"]').addEventListener('click', () => chrome.runtime.sendMessage({ tipo: 'abrirEmbudo' }))

  async function iniciar() {
    const datos = await chrome.storage.local.get(['embudo', 'burbujaVisible', 'burbujaAbierta', 'momoUrl'])
    // No se muestra dentro de Momo ni si el usuario la ocultó desde el popup.
    const momo = (datos.momoUrl || 'https://momo-ai-automatizacion.vercel.app').replace(/\/+$/, '')
    if (location.origin === new URL(momo).origin || datos.burbujaVisible === false) return
    embudo = datos.embudo ?? null
    document.documentElement.append(raiz)
    pintar()
    abrir(Boolean(datos.burbujaAbierta))
  }

  chrome.storage.onChanged.addListener((cambios) => {
    if (cambios.embudo) { embudo = cambios.embudo.newValue ?? null; pintar() }
    if (cambios.burbujaVisible) {
      if (cambios.burbujaVisible.newValue === false) raiz.remove()
      else if (!raiz.isConnected) iniciar()
    }
  })

  iniciar()
})()
