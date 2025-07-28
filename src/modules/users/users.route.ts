import { Context, Hono } from "hono";
import { UserService } from "./users.service";
import { authMiddleware } from "../../middlewares/auth";

const userService = new UserService()
export const userRoutes = new Hono()

userRoutes.use('*', authMiddleware)

userRoutes.get('/me', async (c: Context) => {
    const userId = c.get('userId')
    const user = await userService.getUserById(userId)
    return c.json({
        success: true,
        user
    })
})