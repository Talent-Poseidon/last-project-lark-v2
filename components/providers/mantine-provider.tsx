'use client'

import React from "react"

import { MantineProvider, createTheme } from '@mantine/core'
import { Notifications } from '@mantine/notifications'

const theme = createTheme({
  primaryColor: 'blue',
  fontFamily: 'var(--font-geist-sans), sans-serif',
  defaultRadius: 'md',
  colors: {
    blue: [
      '#e7f0ff',
      '#cfdeff',
      '#9dbaff',
      '#6894ff',
      '#3b73fe',
      '#1f5efe',
      '#0d53ff',
      '#0044e4',
      '#003ccc',
      '#0033b4',
    ],
  },
})

export function MantineAppProvider({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider theme={theme} defaultColorScheme="light">
      <Notifications position="top-right" />
      {children}
    </MantineProvider>
  )
}
