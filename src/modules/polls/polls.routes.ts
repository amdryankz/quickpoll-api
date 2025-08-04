import { PollsService } from "./polls.service";
import { authMiddleware, authorize } from "../../middlewares/auth";
import { zValidator } from "@hono/zod-validator";
import { PollSuccessResponseSchema, createPollWithOptionSchema, ErrorResponseSchema, ParamsSchema, updatePollSchema, voteSchema, SuccessResponseSchema, PollsListResponseSchema } from "./polls.schema";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";

const pollsService = new PollsService()
export const pollRoutes = new OpenAPIHono()

pollRoutes.use('*', authMiddleware)

const createPollRoute = createRoute({
    method: 'post',
    path: '/',
    tags: ['Polls (Admin)'],
    summary: 'Create a new poll',
    security: [{ Bearer: [] }],
    middleware: [authorize('admin'), zValidator('json', createPollWithOptionSchema)] as const,
    request: {
        body: {
            content: {
                'application/json': {
                    schema: createPollWithOptionSchema
                }
            },
            required: true
        }
    },
    responses: {
        201: {
            description: 'Poll created successfully',
            content: {
                'application/json': {
                    schema: PollSuccessResponseSchema
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
        },
        401: {
            description: 'Unauthorized - Invalid token',
            content: {
                'application/json': {
                    schema: ErrorResponseSchema
                }
            }
        },
        403: {
            description: 'Forbidden - Admin access required',
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
    },
})

pollRoutes.openapi(createPollRoute, async (c) => {
    const jwtPayload = c.get('jwtPayload')
    const userId = jwtPayload.id
    const data = c.req.valid('json')
    const newPoll = await pollsService.createPoll(userId, data)
    return c.json({ success: true, poll: newPoll }, 201)
})

const updatePollRoute = createRoute({
    method: 'put',
    path: '/{id}',
    tags: ['Polls (Admin)'],
    summary: 'Update an existing poll',
    security: [{ Bearer: [] }],
    middleware: [authorize('admin'), zValidator('json', updatePollSchema)] as const,
    request: {
        params: ParamsSchema,
        body: {
            content: {
                'application/json': {
                    schema: updatePollSchema
                }
            },
            required: true
        }
    },
    responses: {
        200: {
            description: 'Poll updated successfully',
            content: {
                'application/json': {
                    schema: PollSuccessResponseSchema
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
        },
        401: {
            description: 'Unauthorized - Invalid token',
            content: {
                'application/json': {
                    schema: ErrorResponseSchema
                }
            }
        },
        403: {
            description: 'Forbidden - Admin access required',
            content: {
                'application/json': {
                    schema: ErrorResponseSchema
                }
            }
        },
        404: {
            description: 'Not found - Invalid Id',
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

pollRoutes.openapi(updatePollRoute, async (c) => {
    const pollId = Number(c.req.param('id'))
    const data = c.req.valid('json')
    const updatedPoll = await pollsService.updatePoll(pollId, data)
    return c.json({ success: true, poll: updatedPoll }, 200)
})

const updateStatusPollRoute = createRoute({
    method: 'patch',
    path: '/{id}/status',
    tags: ['Polls (Admin)'],
    summary: 'Activate or deactivate a poll',
    security: [{ Bearer: [] }],
    middleware: [authorize('admin'), zValidator('json', z.object({ isActive: z.boolean() }))] as const,
    request: {
        params: ParamsSchema,
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        isActive: z.boolean().openapi({ example: false }),
                    }),
                }
            },
            required: true
        }
    },
    responses: {
        200: {
            description: 'Poll updated successfully',
            content: {
                'application/json': {
                    schema: PollSuccessResponseSchema
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
        },
        401: {
            description: 'Unauthorized - Invalid token',
            content: {
                'application/json': {
                    schema: ErrorResponseSchema
                }
            }
        },
        403: {
            description: 'Forbidden - Admin access required',
            content: {
                'application/json': {
                    schema: ErrorResponseSchema
                }
            }
        },
        404: {
            description: 'Not found - Invalid Id',
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

pollRoutes.openapi(updateStatusPollRoute, async (c) => {
    const pollId = Number(c.req.param('id'))
    const { isActive } = c.req.valid('json')
    const updatedPoll = await pollsService.updateStatusPoll(pollId, { isActive })
    return c.json({ success: true, poll: updatedPoll }, 200)
})

const deletePollRoute = createRoute({
    method: 'delete',
    path: '/{id}',
    tags: ['Polls (Admin)'],
    summary: 'Delete a poll',
    security: [{ Bearer: [] }],
    middleware: [authorize('admin')] as const,
    request: {
        params: ParamsSchema,
    },
    responses: {
        200: {
            description: 'Poll deleted successfully',
            content: {
                'application/json': {
                    schema: SuccessResponseSchema
                }
            }
        },
        401: {
            description: 'Unauthorized - Invalid token',
            content: {
                'application/json': {
                    schema: ErrorResponseSchema
                }
            }
        },
        403: {
            description: 'Forbidden - Admin access required',
            content: {
                'application/json': {
                    schema: ErrorResponseSchema
                }
            }
        },
        404: {
            description: 'Not found - Invalid Id',
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

pollRoutes.openapi(deletePollRoute, async (c) => {
    const pollId = Number(c.req.param('id'))
    const result = await pollsService.deletePoll(pollId)
    return c.json({ success: true, message: result.message }, 200)
})

const getAllPollsRoute = createRoute({
    method: 'get',
    path: '/',
    tags: ['Polls (Public)'],
    summary: 'Get a list of all polls with current results',
    security: [{ Bearer: [] }],
    responses: {
        200: {
            description: 'List of all polls retrieved successfully',
            content: {
                'application/json': {
                    schema: PollsListResponseSchema
                }
            }
        },
        401: {
            description: 'Unauthorized - Invalid token',
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

pollRoutes.openapi(getAllPollsRoute, async (c) => {
    let pollsResult
    const jwtPayload = c.get('jwtPayload')
    const userRole = jwtPayload.role
    if (userRole === 'admin') {
        pollsResult = await pollsService.getAllPolls()
    } else {
        pollsResult = await pollsService.getActivePolls()
    }
    return c.json({ success: true, polls: pollsResult }, 200)
})

const getPollByIdRoute = createRoute({
    method: 'get',
    path: '/{id}',
    tags: ['Polls (Public)'],
    summary: 'Get details of a specific poll by ID, including results',
    security: [{ Bearer: [] }],
    request: {
        params: ParamsSchema
    },
    responses: {
        200: {
            description: 'Poll details retrieved successfully',
            content: {
                'application/json': {
                    schema: PollSuccessResponseSchema
                }
            }
        },
        401: {
            description: 'Unauthorized - Invalid token',
            content: {
                'application/json': {
                    schema: ErrorResponseSchema
                }
            }
        },
        404: {
            description: 'Not found - Invalid Id',
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

pollRoutes.openapi(getPollByIdRoute, async (c) => {
    const pollId = Number(c.req.param('id'))
    const poll = await pollsService.getPollById(pollId)
    return c.json({ success: true, poll }, 200)
})

const submitVoteRoute = createRoute({
    method: 'post',
    path: '/{id}/vote',
    tags: ['Polls (Public)'],
    summary: 'Submit a vote for a specific poll option',
    security: [{ Bearer: [] }],
    middleware: [zValidator('json', voteSchema)] as const,
    request: {
        params: ParamsSchema,
        body: {
            content: {
                'application/json': {
                    schema: voteSchema
                }
            },
            required: true
        }
    },
    responses: {
        201: {
            description: 'Vote submitted successfully',
            content: {
                'application/json': {
                    schema: SuccessResponseSchema
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
        },
        401: {
            description: 'Unauthorized - Invalid token',
            content: {
                'application/json': {
                    schema: ErrorResponseSchema
                }
            }
        },
        409: {
            description: 'Conflict - Already voted on this poll',
            content: {
                'application/json': {
                    schema: ErrorResponseSchema
                }
            }
        },
        404: {
            description: 'Not found - Invalid Id',
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

pollRoutes.openapi(submitVoteRoute, async (c) => {
    const pollId = Number(c.req.param('id'))
    const jwtPayload = c.get('jwtPayload')
    const userId = jwtPayload.id
    const { optionId } = c.req.valid('json')
    const result = await pollsService.submitVote(userId, pollId, optionId)
    return c.json({ success: true, message: result.message }, 201)
})