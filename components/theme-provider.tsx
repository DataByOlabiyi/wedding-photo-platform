'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

const DARK_PREFIXES = ['/dashboard', '/superadmin', '/onboarding']

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isDark = DARK_PREFIXES.some((prefix) => pathname.startsWith(prefix))

  if (isDark) {
    return (
      <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        {children}
      </NextThemesProvider>
    )
  }

  return (
    <NextThemesProvider attribute="class" forcedTheme="light">
      {children}
    </NextThemesProvider>
  )
}
