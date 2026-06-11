import type { Metadata } from 'next'
import Providers from '@/components/Providers'
import './globals.css'

export const metadata: Metadata = {
  title:       'Royal Shaza Suites',
  description: 'QR Restaurant Ordering System',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}