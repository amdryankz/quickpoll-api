import { Env, Hono, Variables } from "hono";
import { AuthService } from "./auth.service";
import { zValidator } from "@hono/zod-validator"
import { loginSchema, registerSchema } from "./auth.schema";

const authService = new AuthService()
export const authRoutes = new Hono<{ Env: Env; Variables: Variables }>()

authRoutes.post('/register', zValidator('json', registerSchema), async (c) => {
    const data = c.req.valid('json')
    const { user, token } = await authService.register(data)
    return c.json({ success: true, user, token }, 201)
})

authRoutes.post('/login', zValidator('json', loginSchema), async (c) => {
    const { email, password } = c.req.valid('json')
    const { user, token } = await authService.login(email, password)
    return c.json({ success: true, user, token })
})