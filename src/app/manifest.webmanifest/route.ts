/** Manifiesto de la app de las empresas. Se sirve a mano para que Momo Control pueda usar el suyo. */
export function GET() {
  return Response.json({
    id: '/hoy',
    name: 'Momo AI',
    short_name: 'Momo',
    description: 'Tu asistente de ventas: responde clientes y ordena tus ventas desde el teléfono.',
    start_url: '/hoy',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    lang: 'es-CL',
    theme_color: '#A8325E',
    background_color: '#FFF8F6',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }, { headers: { 'Content-Type': 'application/manifest+json', 'Cache-Control': 'public, max-age=3600' } })
}
