import { UserService } from "./users.service";
import { authMiddleware } from "../../middlewares/auth";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { ErrorResponseSchema, GetUserSuccessResponseSchema } from "./users.schema";

const userService = new UserService()
export const userRoutes = new OpenAPIHono()

userRoutes.use('*', authMiddleware)

const getUserRoute = createRoute({
    method: "get",
    path: '/profile',
    tags: ['Users'],
    summary: 'Get current user profile',
    security: [{ Bearer: [] }],
    responses: {
        200: {
            description: 'Successfully retrieval of user profile',
            content: {
                'application/json': {
                    schema: GetUserSuccessResponseSchema
                }
            }
        },
        401: {
            description: 'Unauthorized',
            content: {
                'application/json': {
                    schema: ErrorResponseSchema
                }
            }
        },
        500: {
            description: 'Internal Server Error',
            content: {
                'application/json': {
                    schema: ErrorResponseSchema
                }
            }
        }
    }
})

userRoutes.openapi(getUserRoute, async (c) => {
    const jwtPayload = c.get('jwtPayload')
    const userId = jwtPayload.id
    const user = await userService.getUserById(userId)
    return c.json({ success: true, user }, 200)
})