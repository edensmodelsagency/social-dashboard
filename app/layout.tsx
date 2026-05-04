import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Social Analytics Dashboard',
  description: 'Ανάλυση Instagram & TikTok προφίλ',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="el" className="dark">
      <body>{children}</body>
    </html>
  )
}
