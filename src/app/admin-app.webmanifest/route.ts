/** Manifiesto de "Momo Control": se instala como una app aparte de la de las empresas. */
export function GET() {
  return Response.json({
    name: 'Momo Control',
    short_name: 'Control',
    description: 'Administración de Momo AI: empresas, ganancias y estadísticas.',
    id: '/admin',
    start_url: '/admin',
    scope: '/admin',
    display: 'standalone',
    orientation: 'portrait',
    lang: 'es-CL',
    theme_color: '#1E0F17',
    background_color: '#1E0F17',
    icons: [
      { src: '/icons/control-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/control-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/control-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }, { headers: { 'Content-Type': 'application/manifest+json', 'Cache-Control': 'public, max-age=3600' } })
}
