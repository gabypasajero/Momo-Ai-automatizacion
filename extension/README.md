# Extensión de Chrome · Momo AI Embudo

Una burbuja **M** en la esquina superior izquierda de cualquier página muestra tu embudo:
cuántos chats hay por etapa y los últimos chats, con los que **esperan a una persona** primero.
Un clic abre ese chat en Momo **reutilizando la misma pestaña** (no abre ventanas nuevas).

## Instalar (modo desarrollador, mientras no esté en la Chrome Web Store)

1. Descarga y descomprime `momo-extension.zip` (o usa esta carpeta `extension/`).
2. En Chrome abre `chrome://extensions` y activa **Modo de desarrollador** (arriba a la derecha).
3. Clic en **Cargar descomprimida** y elige la carpeta `extension`.
4. Fija el ícono **M** (pieza de rompecabezas → chincheta).
5. Clic en el ícono **M** → ingresa con tu cuenta de Momo.

## Uso

- **Burbuja M**: clic para abrir o cerrar el embudo. El número rojo = chats que esperan a una persona.
- **Chips de etapa**: filtran la lista.
- **Clic en un chat**: abre `/chat?c=<id>` en tu pestaña de Momo.
- **Ícono de la barra**: sesión, actualizar, abrir el embudo y ocultar la burbuja.
- Se actualiza sola cada minuto.

## Cómo funciona

- `background.js` (service worker): inicia sesión en Supabase Auth, renueva el token, lee
  `momo.conversations` cada minuto y guarda el resultado en `chrome.storage.local`.
  La seguridad la dan las políticas RLS: cada usuario ve solo su empresa.
- `content.js`: dibuja la burbuja dentro de un Shadow DOM para que ningún sitio la desarme.
- `popup.html/js`: ingreso y ajustes. La dirección de Momo se puede cambiar en **Ajustes**.

Requiere que el esquema `momo` esté expuesto en Supabase (ver `docs/puesta-en-marcha.md`).
