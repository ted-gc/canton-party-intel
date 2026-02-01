import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Canton Party Intelligence',
  description: 'Look up any Canton Network party ID across all explorers',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-black text-white antialiased">
        {children}
      </body>
    </html>
  )
}
