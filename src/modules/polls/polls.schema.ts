import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { options, polls } from '../../db/schema'
import z from 'zod'

export const insertPollSchema = createInsertSchema(polls, {
    question: (schema) => schema.min(5, 'Question must be at least 5 characters long').max(255, 'Question too long'),
    description: (schema) => schema.max(1000, 'Description too long').optional()
}).omit({ id: true, userId: true, createdAt: true, updatedAt: true })

export const selectPollSchema = createSelectSchema(polls)

export const insertOptionSchema = createInsertSchema(options, {
    text: (schema) => schema.min(1, 'Option text cannot be empty').max(255, 'Option text too long')
}).omit({ id: true, pollId: true })

export const selectOptionSchema = createSelectSchema(options)

export const createPollWithOptionSchema = z.object({
    question: insertPollSchema.shape.question,
    description: insertPollSchema.shape.description,
    options: z.array(insertOptionSchema).min(2, 'A poll must have at least 2 options').max(10, 'A poll cannot have more than 10 options')
})

export const updatePollSchema = z.object({
    question: insertPollSchema.shape.question.optional(),
    description: insertPollSchema.shape.description.optional(),
    isActive: insertPollSchema.shape.isActive.optional(),
    options: z.array(insertOptionSchema).min(2, 'A poll must have at least 2 options').max(10, 'A poll cannot have more than 10 options')
})

export const voteSchema = z.object({
    optionId: z.number().int('Option ID must be an integer').positive('Option ID must be positive')
})

export type CreatePollWithOption = z.infer<typeof createPollWithOptionSchema>
export type UpdatePollWithOption = z.infer<typeof updatePollSchema>

// OpenAPI response
const PollOptionResponseSchema = z.object({
    id: z.number().openapi({ example: 1 }),
    pollId: z.number().openapi({ example: 1 }),
    text: z.string().openapi({ example: 'Option A' }),
    votes: z.number().optional().openapi({ example: 0 }),
});

export const PollResponseSchema = z.object({
    id: z.number().openapi({ example: 1 }),
    question: z.string().openapi({ example: 'What is your favorite color?' }),
    description: z.string().nullable().openapi({ example: 'Choose wisely!' }),
    userId: z.number().openapi({ example: 101 }),
    isActive: z.boolean().openapi({ example: true }),
    createdAt: z.string().openapi({ example: '2023-10-27T10:00:00.000Z' }),
    updatedAt: z.string().nullable().openapi({ example: '2023-10-27T10:00:00.000Z' }),
    options: z.array(PollOptionResponseSchema).optional(),
    user: z.object({
        id: z.number().openapi({ example: 101 }),
        email: z.string().openapi({ example: 'creator@example.com' }),
        name: z.string().optional().nullable().openapi({ example: 'Poll Creator' }),
    }).optional(),
});

export const PollSuccessResponseSchema = z.object({
    success: z.boolean().openapi({ example: true }),
    poll: PollResponseSchema
})

export const ErrorResponseSchema = z.object({
    success: z.boolean().openapi({ example: false }),
    message: z.string().openapi({ example: 'Unauthorized' }),
    details: z.string().nullable().optional().openapi({ example: 'Invalid token' })
})

export const ParamsSchema = z.object({
    id: z.string().openapi({ param: { name: 'id', in: 'path', }, example: '1212121', }),
})

export const SuccessResponseSchema = z.object({
    success: z.boolean().openapi({ example: true }),
    message: z.string().optional().openapi({ example: 'Operation successful' }),
});

export const PollsListResponseSchema = z.object({
    success: z.boolean().openapi({ example: true }),
    polls: z.array(PollResponseSchema),
});