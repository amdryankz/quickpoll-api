import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { options, polls } from '../../db/schema'
import z from 'zod/v4'

export const insertPollSchema = createInsertSchema(polls, {
    question: z.string().min(5, 'Question must be at least 5 characters long').max(255, 'Question too long'),
    description: z.string().max(1000, 'Description too long').optional()
}).omit({ id: true, userId: true, createdAt: true, updatedAt: true })

export const selectPollSchema = createSelectSchema(polls)

export const insertOptionSchema = createInsertSchema(options, {
    text: z.string().min(1, 'Option text cannot be empty').max(255, 'Option text too long')
}).omit({ id: true, pollId: true })

export const selectOptionSchema = createInsertSchema(options)

export const createPollWithOptionSchema = z.object({
    question: insertPollSchema.shape.question,
    description: insertPollSchema.shape.description,
    options: z.array(insertOptionSchema).min(2, 'A poll must have at least 2 options').max(10, 'A poll cannot have more than 10 options')
})

export const updatePollSchema = z.object({
    question: insertPollSchema.shape.question,
    description: insertPollSchema.shape.description,
})

export const voteSchema = z.object({
    optionId: z.number().int('Option ID must be an integer').positive('Option ID must be positive')
})

export type CreatePollWithOption = z.infer<typeof createPollWithOptionSchema>