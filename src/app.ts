import { Variables, Env, Hono } from "hono"
import { logger } from "hono/logger"
import { prettyJSON } from "hono/pretty-json"
import { HTTPException } from "hono/http-exception"
import 'dotenv/config'

import { authRoutes } from "./modules/auth/auth.routes"
import { userRoutes } from "./modules/users/users.route"

type Bindings = {
    DATABASE_URL: string;
    JWT_SECRET: string;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

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

app.route('/auth', authRoutes)
app.route('/users', userRoutes)

export default app