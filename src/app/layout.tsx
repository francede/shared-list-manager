import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { getServerSession } from 'next-auth'
import { OPTIONS } from './api/auth/[...nextauth]/route'
import SharedListSessionProvider from '@/components/providers/SharedListSessionProvider'
import styles from './layout.module.css'
import { AblyClientProvider } from '@/components/providers/AblyClientProvider'
import { UserSettingsProvider } from '@/components/providers/SettingsProvider'
import { TranslationProvider } from '@/components/providers/TranslationProvider'

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
      <head>
        <link
          rel="preload"
          href="/fonts/MaterialSymbolsOutlined.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/Nunito-VariableFont_wght.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/PoltawskiNowy-VariableFont_wght.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        <link rel="icon" type="image/svg+xml" href="favicon.svg"></link>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.3.2/css/flag-icons.min.css" />
      </head>
      <body className={inter.className}>
        <SharedListSessionProvider session={session}>
          <AblyClientProvider>
            <UserSettingsProvider>
              <TranslationProvider>
              <div className={styles['layout']}>
                {children}
              </div>
              </TranslationProvider>
            </UserSettingsProvider>
          </AblyClientProvider>
        </SharedListSessionProvider>
      </body>
    </html>
  )
}
