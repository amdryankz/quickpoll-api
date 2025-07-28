import { Hono } from "hono";
import { PollsService } from "./polls.service";
import { authMiddleware, authorize } from "../../middlewares/auth";
import { zValidator } from "@hono/zod-validator";
import { createPollWithOptionSchema, updatePollSchema, voteSchema } from "./polls.schema";
import { z } from "zod/v4";

const pollsService = new PollsService()
export const pollRoutes = new Hono()

pollRoutes.use('*', authMiddleware)

pollRoutes.post('/',
    authorize('admin'),
    zValidator('json', createPollWithOptionSchema),
    async (c) => {
        const jwtPayload = c.get('jwtPayload')
        const userId = jwtPayload.id
        const data = c.req.valid('json')
        const newPoll = await pollsService.createPoll(userId, data)
        return c.json({
            success: true,
            poll: newPoll
        }, 201)
    }
)

pollRoutes.put('/:id',
    authorize('admin'),
    zValidator('json', updatePollSchema),
    async (c) => {
        const pollId = Number(c.req.param('id'))
        const data = c.req.valid('json')
        const updatedPoll = await pollsService.updatePoll(pollId, data)
        return c.json({
            success: true,
            poll: updatedPoll
        })
    }
)

pollRoutes.delete('/:id',
    authorize('admin'),
    async (c) => {
        const pollId = Number(c.req.param('id'))
        const result = await pollsService.deletePoll(pollId)
        return c.json({
            success: true,
            message: result.message
        }, 200)
    }
)

pollRoutes.patch('/:id/status',
    authorize('admin'),
    zValidator('json', z.object({ isActive: z.boolean() })),
    async (c) => {
        const pollId = Number(c.req.param('id'))
        const { isActive } = c.req.valid('json')
        const updatedPoll = await pollsService.updatePoll(pollId, { isActive })
        return c.json({
            success: true,
            poll: updatedPoll
        })
    }
)

pollRoutes.get('/',
    async (c) => {
        let polls
        const jwtPayload = c.get('jwtPayload')
        const userRole = jwtPayload.role
        if (userRole === 'admin') {
            polls = await pollsService.getPolls()
        } else {
            polls = await pollsService.getActivePolls()
        }
        return c.json({
            success: true,
            polls
        })
    }
)

pollRoutes.get('/:id',
    async (c) => {
        const pollId = Number(c.req.param('id'))
        const poll = await pollsService.getPollById(pollId)
        return c.json({
            success: true,
            poll
        })
    }
)

pollRoutes.post('/:id/vote',
    zValidator('json', voteSchema),
    async (c) => {
        const pollId = Number(c.req.param('id'))
        const jwtPayload = c.get('jwtPayload')
        const userId = jwtPayload.id
        const { optionId } = c.req.valid('json')
        const result = await pollsService.submitVote(userId, pollId, optionId)
        return c.json({
            success: true,
            message: result.message
        }, 201)
    }
)