import type { Metadata, Viewport } from 'next'
import { Nunito, Quicksand } from 'next/font/google'
import { cookies } from 'next/headers'
import './globals.css'

// Mismas tipografías que detoditooutlet.cl: Nunito para texto y Quicksand para títulos.
const nunito = Nunito({ subsets: ['latin'], display: 'swap', variable: '--font-sans' })
const quicksand = Quicksand({ subsets: ['latin'], weight: ['600', '700'], display: 'swap', variable: '--font-display' })

export const metadata: Metadata = {
  title: { default: 'Momo AI', template: '%s · Momo AI' },
  description: 'CRM omnicanal con IA para vender por Facebook, WhatsApp, Instagram y TikTok.',
  applicationName: 'Momo AI',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'Momo', statusBarStyle: 'default' },
  icons: { apple: '/icons/apple-touch-icon.png' },
}

export const viewport: Viewport = { themeColor: '#A8325E', width: 'device-width', initialScale: 1, viewportFit: 'cover' }

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const big = (await cookies()).get('momo_letra')?.value === 'grande'
  return (
    <html lang="es-CL" className={big ? 'letra-grande' : undefined}>
      <body className={`${nunito.variable} ${quicksand.variable} font-sans`}>
        {/* Chrome ofrece instalar una sola vez al cargar: lo guardamos para mostrar el botón en cualquier pantalla. */}
        <script dangerouslySetInnerHTML={{ __html: "window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__momoInstall=e;window.dispatchEvent(new Event('momo-install'))})" }} />
        {children}
      </body>
    </html>
  )
}
