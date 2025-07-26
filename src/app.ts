import { Hono } from "hono"
import { logger } from "hono/logger"
import { prettyJSON } from "hono/pretty-json"
import { HTTPException } from "hono/http-exception"
import 'dotenv/config'

export type AppBindings = {
    DATABASE_URL: string
    JWT_SECRET: string
}

type Variables = {
    userId: number
    userRole: 'admin' | 'user'
}

const app = new Hono<{ Bindings: AppBindings; Variables: Variables }>()

app.use(logger())
app.use(prettyJSON())

app.onError((err, c) => {
    if (err instanceof HTTPException) {
        return c.json({
            success: false,
            message: err.message,
            details: err.cause instanceof Error ? err.cause.message : err.cause
        }, err.status)
    }

    console.error(`Unexpected Error: ${err}`)
    return c.json({
        success: false,
        message: 'Internal Server Error',
        details: 'An unexpected error occurred. Please try again later.'
    }, 500);
})

app.get('/', (c) => {
    return c.json({ message: 'QuickPoll API is running!', status: 'OK' })
})

export default app