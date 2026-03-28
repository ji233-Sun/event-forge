import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as authSchema from './auth-schema'
import * as surveySchema from './survey-schema'

// Supabase Transaction Pool mode — prepare must be disabled
const client = postgres(process.env.DATABASE_URL!, { prepare: false })

export const db = drizzle({ client, schema: { ...authSchema, ...surveySchema } })
