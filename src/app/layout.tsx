import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { getServerSession } from 'next-auth'
import { OPTIONS } from './api/auth/[...nextauth]/route'
import SharedListSessionProvider from '@/components/providers/SharedListSessionProvider'
import { AblyClientProvider } from '@/components/providers/AblyClientProvider'
import styles from './layout.module.css'
import { DynamicListChannelProvider } from '@/components/providers/DynamicListChannelProvider'
import { useState } from 'storybook/internal/preview-api'

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
  const [listId, setListId] = useState<string | null>(null)


  return (
    <html lang="en" className={styles["root-html"]}>
      <body className={inter.className}>
        <SharedListSessionProvider session={session}>
          <AblyClientProvider>
            <DynamicListChannelProvider>
              <div className={styles['layout']}>
                {children}
              </div>
            </DynamicListChannelProvider>
          </AblyClientProvider>
        </SharedListSessionProvider>
      </body>
    </html>
  )
}
