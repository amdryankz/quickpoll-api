import { Hono } from "hono";
import { UserService } from "./users.service";
import { authMiddleware } from "../../middlewares/auth";

const userService = new UserService()
export const userRoutes = new Hono()

userRoutes.use('*', authMiddleware)

userRoutes.get('/me', async (c) => {
    const jwtPayload = c.get('jwtPayload')
    const userId = jwtPayload.id
    const user = await userService.getUserById(userId)
    return c.json({
        success: true,
        user
    })
})