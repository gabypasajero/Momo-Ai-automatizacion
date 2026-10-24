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
  appleWebApp: { capable: true, title: 'Momo', statusBarStyle: 'default' },
  icons: { apple: '/icons/apple-touch-icon.png' },
}

export const viewport: Viewport = { themeColor: '#A8325E', width: 'device-width', initialScale: 1, viewportFit: 'cover' }

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const big = (await cookies()).get('momo_letra')?.value === 'grande'
  return (
    <html lang="es-CL" className={big ? 'letra-grande' : undefined}>
      <body className={`${nunito.variable} ${quicksand.variable} font-sans`}>{children}</body>
    </html>
  )
}
