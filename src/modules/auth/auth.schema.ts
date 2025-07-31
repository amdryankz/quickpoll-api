import { z } from "zod";

export const registerSchema = z.object({
    email: z.email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    name: z.string().min(2, 'Name must be at least 2 characters long').optional(),
    role: z.enum(['admin', 'user'])
})

export const loginSchema = z.object({
    email: z.email('Invalid email address'),
    password: z.string().min(1, 'Password is required')
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>

// OpenAPI response
export const AuthSuccessResponseSchema = z.object({
    success: z.boolean(),
    user: z.object({
        id: z.number().openapi({ example: 1 }),
        email: z.email().openapi({ example: 'test@example.com' }),
        name: z.string().nullable().optional().openapi({ example: 'Test' }),
        role: z.enum(['admin', 'user']).openapi({ example: 'user' })
    }),
    token: z.string().openapi({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }),
})

export const ErrorResponseSchema = z.object({
    success: z.boolean().openapi({ example: false }),
    message: z.string().openapi({ example: 'Unauthorized' }),
    details: z.string().nullable().optional().openapi({ example: 'Invalid credentials' })
})