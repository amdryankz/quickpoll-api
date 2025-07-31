import z from "zod"

export const GetUserSuccessResponseSchema = z.object({
    success: z.boolean(),
    user: z.object({
        id: z.number().openapi({ example: 1 }),
        name: z.string().nullable().optional().openapi({ example: 'Test' }),
        email: z.email().openapi({ example: 'test@example.com' }),
        role: z.enum(['admin', 'user']).openapi({ example: 'user' }),
        createdAt: z.date().openapi({ example: new Date() })
    })
})

export const ErrorResponseSchema = z.object({
    success: z.boolean().openapi({ example: false }),
    message: z.string().openapi({ example: 'Unauthorized' }),
    details: z.string().nullable().optional().openapi({ example: 'Invalid token' })
})