// apps/web/app/layout.tsx
// Root layout for Next.js 15 App Router
// Wraps all pages with global providers, fonts, and metadata

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { SessionProvider } from '@/components/providers/SessionProvider'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'DIETER PRO - AI Music Studio',
  description: 'Create professional AI-generated music tracks in seconds',
  keywords: ['AI music', 'music generator', 'beat maker', 'audio AI'],
  openGraph: {
    title: 'DIETER PRO - AI Music Studio',
    description: 'Create professional AI-generated music tracks in seconds',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-gray-950 text-white`}>
        <SessionProvider>
          <div className="flex h-screen overflow-hidden">
            {/* Left sidebar navigation */}
            <Sidebar />
            
            {/* Main content area */}
            <div className="flex flex-col flex-1 overflow-hidden">
              <Header />
              <main className="flex-1 overflow-auto">
                {children}
              </main>
            </div>
          </div>
        </SessionProvider>
      </body>
    </html>
  )
}
