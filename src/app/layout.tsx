import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { getServerSession } from 'next-auth'
import { OPTIONS } from './api/auth/[...nextauth]/route'
import SharedListSessionProvider from '@/components/providers/SharedListSessionProvider'
import { AblyClientProvider } from '@/components/providers/AblyClientProvider'
import styles from './layout.module.css'
import { DynamicListChannelProvider } from '@/components/providers/DynamicListChannelProvider'

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
    <html lang="en" className={styles["root-html"]}>
      <body className={inter.className}>
        <SharedListSessionProvider session={session}>
          <AblyClientProvider>
              <div className={styles['layout']}>
                {children}
              </div>
          </AblyClientProvider>
        </SharedListSessionProvider>
      </body>
    </html>
  )
}
