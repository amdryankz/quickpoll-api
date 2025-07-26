import { defineConfig } from 'drizzle-kit'
import 'dotenv/config'

export default defineConfig({
    schema: './src/db/schema.ts',
    out: './drizzle',
    verbose: true,
    strict: true,
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL!
    }
})