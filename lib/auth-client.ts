import { createAuthClient } from 'better-auth/react'
import { emailOTPClient, jwtClient } from 'better-auth/client/plugins'

export const authClient = createAuthClient({
  baseURL:
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL,
  plugins: [emailOTPClient(), jwtClient()],
})
