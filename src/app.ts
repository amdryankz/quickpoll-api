import { prettyJSON } from "hono/pretty-json"
import { HTTPException } from "hono/http-exception"
import { OpenAPIHono } from "@hono/zod-openapi"
import 'dotenv/config'

import { authRoutes } from "./modules/auth/auth.routes"
import { userRoutes } from "./modules/users/users.routes"
import { pollRoutes } from "./modules/polls/polls.routes"
import { swaggerUI } from "@hono/swagger-ui"
import { pinoLogger } from "./middlewares/logger"

const app = new OpenAPIHono()

app.use(pinoLogger)
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
app.route('/polls', pollRoutes)

app.openAPIRegistry.registerComponent('securitySchemes', 'Bearer', {
    type: 'http',
    scheme: 'bearer'
})

app.doc('/openapi', {
    openapi: '3.0.0',
    info: {
        version: '1.0.0',
        title: 'QuickPoll API',
        description: 'API for creating and participating in polls with user authentication and roles.'
    },
    servers: [{
        url: 'http://localhost:3000',
        description: 'Local Development Server'
    }],
})

app.get('/docs', swaggerUI({ url: '/openapi' }))

export default app