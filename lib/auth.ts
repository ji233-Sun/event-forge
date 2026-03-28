import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { emailOTP, jwt } from 'better-auth/plugins'
import { Resend } from 'resend'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/auth-schema'

const resend = new Resend(process.env.RESEND_API_KEY)

const OTP_LABELS: Record<string, string> = {
  'sign-in': '登录',
  'email-verification': '邮箱验证',
  'forget-password': '重置密码',
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        const label = OTP_LABELS[type] ?? type
        const from = process.env.EMAIL_FROM ?? 'onboarding@resend.dev'

        console.log('[emailOTP] sendVerificationOTP called', {
          email,
          type,
          from,
          hasResendKey: !!process.env.RESEND_API_KEY,
          resendKeyPrefix: process.env.RESEND_API_KEY?.slice(0, 8),
        })

        const { data, error } = await resend.emails.send({
          from,
          to: email,
          subject: `你的${label}验证码`,
          text: `验证码：${otp}\n\n此验证码 5 分钟内有效，请勿泄露给他人。`,
        })

        if (error) {
          console.error('[emailOTP] Resend send failed', { email, type, error })
          throw new Error(`邮件发送失败: ${error.message}`)
        }

        console.log('[emailOTP] Resend send success', { email, type, messageId: data?.id })
      },
    }),
    jwt(),
  ],
})
