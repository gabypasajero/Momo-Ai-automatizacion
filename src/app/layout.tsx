import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  title: { default: 'Momo AI', template: '%s · Momo AI' },
  description: 'CRM omnicanal con IA para vender por Facebook, WhatsApp, Instagram y TikTok.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CL">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
