import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sewanee Shuttle Admin Dashboard',
  description: 'Administrative dashboard for the Sewanee shuttle tracking system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}
