import 'dotenv/config'
import { db } from '../lib/db'
import { sql } from 'drizzle-orm'

async function main() {
  const result = await db.execute(sql`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `)
  console.log('Result:', JSON.stringify(result, null, 2))
}

main().catch(console.error)
