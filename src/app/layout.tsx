import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { getServerSession } from 'next-auth'
import { OPTIONS } from './api/auth/[...nextauth]/route'
import SharedListSessionProvider from '@/components/providers/SharedListSessionProvider'
import { AblyProvider } from 'ably/react'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Shared List Manager',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  const session = await getServerSession(OPTIONS)
  return (
    <html lang="en">
      <body className={inter.className}>
        <SharedListSessionProvider session={session}>
          <AblyProvider>
            <div>
              {children}
            </div>
          </AblyProvider>
        </SharedListSessionProvider>
      </body>
    </html>
  )
}
