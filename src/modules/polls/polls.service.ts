import { HTTPException } from "hono/http-exception";
import { db } from "../../db";
import { options, polls, votes } from "../../db/schema";
import { CreatePollWithOption } from "./polls.schema";
import { and, count, eq } from "drizzle-orm";

export class PollsService {
    async createPoll(userId: number, data: CreatePollWithOption) {
        const [newPoll] = await db.insert(polls).values({
            question: data.question,
            description: data.description,
            userId: userId
        }).returning()

        if (!newPoll) {
            throw new HTTPException(500, { message: 'Failed to create poll.' })
        }

        const optionToInsert = data.options.map(opt => ({
            pollId: newPoll.id,
            text: opt.text
        }))
        const newOptions = await db.insert(options).values(optionToInsert).returning()

        return {
            ...newPoll,
            options: newOptions
        }
    }

    async getActivePolls() {
        const pollsWithInfo = await db.query.polls.findMany({
            where: eq(polls.isActive, true),
            with: {
                options: true,
                user: {
                    columns: {
                        id: true,
                        email: true,
                        name: true
                    }
                }
            },
            orderBy: polls.createdAt
        })

        const pollsWithCounts = await Promise.all(pollsWithInfo.map(async (poll) => {
            const optionCounts = await db
                .select({
                    optionId: votes.optionId,
                    count: count(votes.optionId).as('count')
                })
                .from(votes)
                .where(eq(votes.pollId, poll.id))
                .groupBy(votes.optionId)

            const optionWithCounts = poll.options.map(option => ({
                ...option,
                votes: optionCounts.find(oc => oc.optionId === option.id)?.count || 0
            }))

            return { ...poll, options: optionWithCounts }
        }))

        return pollsWithCounts
    }

    async getPollById(pollId: number) {
        const pollWithInfo = await db.query.polls.findFirst({
            where: eq(polls.id, pollId),
            with: {
                options: true,
                user: {
                    columns: {
                        id: true,
                        email: true,
                        name: true
                    }
                }
            }
        })

        if (!pollWithInfo) {
            throw new HTTPException(404, { message: 'Poll not found.' })
        }

        const optionCounts = await db
            .select({
                optionId: votes.optionId,
                count: count(votes.optionId).as('count')
            })
            .from(votes)
            .where(eq(votes.pollId, pollId))
            .groupBy(votes.optionId)

        const optionWithCounts = pollWithInfo.options.map(option => ({
            ...option,
            votes: optionCounts.find(oc => oc.optionId === option.id)?.count || 0
        }))

        return { ...pollWithInfo, option: optionWithCounts }
    }

    async updatePoll(pollId: number, data: Partial<typeof polls.$inferInsert>) {
        const [updatedPoll] = await db.update(polls)
            .set({
                question: data.question,
                description: data.description,
                isActive: data.isActive,
                updatedAt: new Date()
            })
            .where(eq(polls.id, pollId))
            .returning()

        if (!updatedPoll) {
            throw new HTTPException(404, { message: 'Poll not found or no changes made' })
        }

        return updatedPoll
    }

    async deletePoll(pollId: number) {
        const [deletedPoll] = await db.delete(polls).where(eq(polls.id, pollId)).returning({ id: polls.id })

        if (!deletedPoll) {
            throw new HTTPException(404, { message: 'Poll not found.' })
        }

        return { message: 'Poll deleted successfully.' }
    }

    async submitVote(userId: number, pollId: number, optionId: number) {
        const poll = await db.query.polls.findFirst({
            where: and(eq(polls.id, pollId), eq(polls.isActive, true))
        })

        if (!poll) {
            throw new HTTPException(404, { message: 'Poll not found or is not active for voting.' })
        }

        const option = await db.query.options.findFirst({
            where: and(eq(options.id, optionId), eq(options.pollId, pollId))
        })

        if (!option) {
            throw new HTTPException(400, { message: 'Invalid option for this poll.' })
        }

        const existingVote = await db.query.votes.findFirst({
            where: and(eq(votes.userId, userId), eq(votes.pollId, pollId))
        })

        if (existingVote) {
            throw new HTTPException(409, { message: 'You have already voted on this poll.' })
        }

        const newVote = db.insert(votes).values({
            userId: userId,
            optionId: optionId,
            pollId: pollId
        }).returning()

        if (!newVote) {
            throw new HTTPException(500, { message: 'Failed to submit vote.' })
        }

        return { message: 'Vote submitted successfully.' }
    }
}