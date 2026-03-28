import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { emailOTP, jwt } from 'better-auth/plugins'
import nodemailer from 'nodemailer'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/auth-schema'

const SMTP_TIMEOUTS = {
  connection: 10_000,
  greeting: 10_000,
  socket: 15_000,
} as const

type SmtpConfig = {
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
  from: string
}

function getRequiredEnv(name: 'SMTP_HOST' | 'SMTP_USER' | 'SMTP_PASS' | 'EMAIL_FROM') {
  const value = process.env[name]?.trim()

  if (!value) {
    throw new Error(`${name} 未配置`)
  }

  return value
}

function getSmtpPort(value: string | undefined) {
  const port = Number(value ?? '465')

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error('SMTP_PORT 必须是有效端口')
  }

  return port
}

function getSmtpSecure(value: string | undefined, port: number) {
  if (!value) {
    return port === 465
  }

  const normalized = value.trim().toLowerCase()

  if (['true', '1', 'yes'].includes(normalized)) {
    return true
  }

  if (['false', '0', 'no'].includes(normalized)) {
    return false
  }

  throw new Error('SMTP_SECURE 仅支持 true/false/1/0/yes/no')
}

function maskEmail(email: string) {
  const [localPart, domainPart] = email.split('@')

  if (!localPart || !domainPart) {
    return '***'
  }

  const visibleLength = Math.min(2, localPart.length)
  const visiblePart = localPart.slice(0, visibleLength)
  const maskedLength = Math.max(1, localPart.length - visibleLength)

  return `${visiblePart}${'*'.repeat(maskedLength)}@${domainPart}`
}

function getSmtpConfig(): SmtpConfig {
  const port = getSmtpPort(process.env.SMTP_PORT)

  return {
    host: getRequiredEnv('SMTP_HOST'),
    port,
    secure: getSmtpSecure(process.env.SMTP_SECURE, port),
    user: getRequiredEnv('SMTP_USER'),
    pass: getRequiredEnv('SMTP_PASS'),
    from: getRequiredEnv('EMAIL_FROM'),
  }
}

const smtpConfig = getSmtpConfig()

const transporter = nodemailer.createTransport({
  host: smtpConfig.host,
  port: smtpConfig.port,
  secure: smtpConfig.secure,
  connectionTimeout: SMTP_TIMEOUTS.connection,
  greetingTimeout: SMTP_TIMEOUTS.greeting,
  socketTimeout: SMTP_TIMEOUTS.socket,
  auth: {
    user: smtpConfig.user,
    pass: smtpConfig.pass,
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
        const sanitizedEmail = maskEmail(email)

        console.log('[emailOTP] sendVerificationOTP called', {
          type,
          email: sanitizedEmail,
        })

        try {
          await transporter.sendMail({
            from: smtpConfig.from,
            to: email,
            subject: `你的${label}验证码`,
            text: `验证码：${otp}\n\n此验证码 5 分钟内有效，请勿泄露给他人。`,
          })

          console.log('[emailOTP] SMTP send success', {
            type,
            email: sanitizedEmail,
          })
        } catch (error) {
          console.error('[emailOTP] SMTP send failed', {
            type,
            email: sanitizedEmail,
            error,
          })
          throw new Error('邮件发送失败')
        }
      },
    }),
    jwt(),
  ],
})
