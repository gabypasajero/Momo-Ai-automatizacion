import type { NextConfig } from 'next'

/** Rutas del panel anterior (tipo Vambe) → secciones del concepto actual. Mantiene vivos enlaces guardados y la extensión. */
const LEGACY_ROUTES: [string, string][] = [
  ['/inicio', '/hoy'],
  ['/chat', '/conversaciones'],
  ['/embudo', '/conversaciones'],
  ['/crm', '/clientes'],
  ['/asistentes', '/conocimiento?t=personalidad'],
  ['/asistentes/conocimiento', '/conocimiento'],
  ['/analitica', '/resultados'],
  ['/canales', '/ajustes?t=canales'],
  ['/ajustes/facturacion', '/ajustes?t=plan'],
  ['/servicio', '/hoy'],
  ['/ecommerce', '/hoy'],
  ['/workflows', '/hoy'],
  ['/agenda', '/hoy'],
]

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Las fotos del entrenamiento viajan reducidas (≈ 300 KB c/u); hasta 3 por mensaje.
  experimental: { serverActions: { bodySizeLimit: '4mb' } },
  async redirects() {
    return [
      // /chat?c=<id> (extensión de Chrome anterior) conserva la conversación.
      { source: '/chat', has: [{ type: 'query', key: 'c', value: '(?<c>.*)' }], destination: '/conversaciones?c=:c', permanent: false },
      ...LEGACY_ROUTES.map(([source, destination]) => ({ source, destination, permanent: false })),
    ]
  },
}

export default nextConfig
