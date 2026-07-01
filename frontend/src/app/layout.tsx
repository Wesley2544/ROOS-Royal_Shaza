import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Providers from '@/components/Providers'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title:       'Royal Shaza Suites',
  description: 'QR Restaurant Ordering System',
  manifest:    '/manifest.json',
  icons: {
    icon:     [
      { url: '/favicon.ico' },
      { url: '/icon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple:    '/icon-180x180.png',
  },
}

export const viewport = {
  themeColor: '#FDC700',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-[#F5F5F5] text-[#0A0A0A]`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}