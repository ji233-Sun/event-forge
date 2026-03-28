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
    <div className="studio-bg min-h-screen">
      <Navbar />
      <main className="flex-1 pt-16">
        <MultimediaStudio />
      </main>
      <Footer />
    </div>
  )
}
