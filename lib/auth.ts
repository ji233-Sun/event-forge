import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { emailOTP, jwt } from 'better-auth/plugins'
import nodemailer from 'nodemailer'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/auth-schema'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 465),
  secure: process.env.SMTP_SECURE !== 'false',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

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
    requireEmailVerification: true,
  },
  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        const label = OTP_LABELS[type] ?? type

        console.log('[emailOTP] sendVerificationOTP called', { type })

        await transporter.sendMail({
          from: process.env.EMAIL_FROM,
          to: email,
          subject: `你的${label}验证码`,
          text: `验证码：${otp}\n\n此验证码 5 分钟内有效，请勿泄露给他人。`,
        })

        console.log('[emailOTP] SMTP send success')
      },
    }),
    jwt(),
  ],
})
