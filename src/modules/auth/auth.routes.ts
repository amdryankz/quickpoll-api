import { AuthService } from "./auth.service";
import { AuthSuccessResponseSchema, ErrorResponseSchema, loginSchema, registerSchema } from "./auth.schema";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi"

const authService = new AuthService()
export const authRoutes = new OpenAPIHono()

const registerRoute = createRoute({
    method: 'post',
    path: '/register',
    tags: ['Auth'],
    summary: 'Register a new user',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: registerSchema
                }
            },
            required: true
        }
    },
    responses: {
        201: {
            description: 'User registered successfully',
            content: {
                'application/json': {
                    schema: AuthSuccessResponseSchema
                }
            }
        },
        409: {
            description: 'Conflict - User already exists',
            content: {
                'application/json': {
                    schema: ErrorResponseSchema
                }
            }
        },
        400: {
            description: 'Bad request - Validation error',
            content: {
                'application/json': {
                    schema: ErrorResponseSchema
                }
            }
        }
    }
})

authRoutes.openapi(registerRoute, async (c) => {
    const data = c.req.valid('json')
    const { user, token } = await authService.register(data)
    return c.json({ success: true, user, token }, 201)
})

const loginRoute = createRoute({
    method: 'post',
    path: '/login',
    tags: ['Auth'],
    summary: 'Login an existing user',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: loginSchema,
                },
            },
            required: true,
        },
    },
    responses: {
        200: {
            description: 'User logged in successfully',
            content: {
                'application/json': {
                    schema: AuthSuccessResponseSchema,
                },
            },
        },
        401: {
            description: 'Unauthorized - Invalid credentials',
            content: {
                'application/json': {
                    schema: ErrorResponseSchema
                }
            },
        },
        400: {
            description: 'Bad Request - Validation error',
            content: {
                'application/json': {
                    schema: ErrorResponseSchema
                }
            },
        },
    },
});

authRoutes.openapi(loginRoute, async (c) => {
    const { email, password } = c.req.valid('json');
    const { user, token } = await authService.login(email, password);
    return c.json({ success: true, user, token }, 200);
});