import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getProfileData } from './actions'
import { ProfileContent } from './profile-content'

export default async function ProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/login')

  const data = await getProfileData()

  return (
    <ProfileContent
      user={{
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        createdAt: session.user.createdAt,
      }}
      data={data}
    />
  )
}
