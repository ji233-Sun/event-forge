import { getUserDecks } from './actions'
import { SlidesPageClient } from './slide-studio-client'

export const metadata = { title: 'Slide Studio' }

export default async function SlidesPage() {
  const decks = await getUserDecks()
  return <SlidesPageClient initialDecks={decks} />
}
