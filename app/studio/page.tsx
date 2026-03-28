import type { Metadata } from 'next'

import { Footer } from '@/components/landing/footer'
import { Navbar } from '@/components/landing/navbar'
import { MultimediaStudio } from '@/components/multimedia/multimedia-studio'

export const metadata: Metadata = {
  title: 'Multimedia Studio | EventForge',
  description:
    'Generate an event poster, soundtrack preview, and social launch copy from one brief.',
}

export default function StudioPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.12),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(249,250,251,1))]">
      <Navbar />
      <main className="flex-1 pt-16">
        <MultimediaStudio />
      </main>
      <Footer />
    </div>
  )
}
