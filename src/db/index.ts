import 'dotenv/config'
import { drizzle } from 'drizzle-orm/singlestore/driver'
import { Pool } from 'pg'
import * as schema from './schema'

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set in the environment variables!')
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
})

export const db = drizzle(pool, { schema, logger: process.env.NODE_ENV === 'development' })