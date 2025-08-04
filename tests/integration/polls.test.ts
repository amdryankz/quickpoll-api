import { describe, it, expect, beforeEach, afterAll, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { db } from '../../src/db';
import { users, polls, options, votes } from '../../src/db/schema';
import { and, eq } from 'drizzle-orm';
import { sign } from 'hono/jwt';
import { JWTPayload } from 'hono/utils/jwt/types';
import { serve } from '@hono/node-server'

let server: ReturnType<typeof serve>;

const signJwt = async (payload: JWTPayload, secret: string): Promise<string> => {
    return sign(payload, secret);
};

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

describe('Poll Endpoints', () => {
    let adminToken: string;
    let userToken: string;
    let adminUserId: number;
    let userUserId: number;

    beforeAll(() => {
        server = serve({ fetch: app.fetch });
    });

    afterAll(async () => {
        server.close();
    });

    beforeEach(async () => {
        await db.delete(votes);
        await db.delete(options);
        await db.delete(polls);
        await db.delete(users);

        // Create an admin user
        const [adminUser] = await db.insert(users).values({
            email: 'admin@test.com',
            hashedPassword: await Bun.password.hash('adminpass'),
            role: 'admin',
        }).returning();
        adminUserId = adminUser.id;
        adminToken = await signJwt({ id: adminUserId, role: 'admin' }, JWT_SECRET);

        // Create a regular user
        const [regularUser] = await db.insert(users).values({
            email: 'user@test.com',
            hashedPassword: await Bun.password.hash('userpass'),
            role: 'user',
        }).returning();
        userUserId = regularUser.id;
        userToken = await signJwt({ id: userUserId, role: 'user' }, JWT_SECRET);
    });

    it('should allow admin to create a poll', async () => {
        const res = await request(server)
            .post('/polls')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                question: 'What is your favorite food?',
                options: [{ text: 'Pizza' }, { text: 'Pasta' }],
            });

        expect(res.statusCode).toEqual(201);
        expect(res.body.success).toBe(true);
        expect(res.body.poll).toHaveProperty('id');
        expect(res.body.poll.question).toBe('What is your favorite food?');
        expect(res.body.poll.options).toHaveLength(2);
        expect(res.body.poll.userId).toBe(adminUserId);

        const pollInDb = await db.query.polls.findFirst({
            where: eq(polls.id, res.body.poll.id),
            with: { options: true }
        });
        expect(pollInDb).toBeDefined();
        expect(pollInDb?.options).toHaveLength(2);
    });

    it('should not allow regular user to create a poll', async () => {
        const res = await request(server)
            .post('/polls')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                question: 'Should I be able to create?',
                options: [{ text: 'Yes' }, { text: 'No' }],
            });

        expect(res.statusCode).toEqual(403);
        expect(res.body.message).toBe('Forbidden: Admin access required.');
    });

    it('should get all active polls with vote counts', async () => {
        const createPollRes = await request(server)
            .post('/polls')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                question: 'Test Poll for listing',
                options: [{ text: 'Option X' }, { text: 'Option Y' }],
            });
        const pollId = createPollRes.body.poll.id;
        const optionXId = createPollRes.body.poll.options[0].id;

        await request(server)
            .post(`/polls/${pollId}/vote`)
            .set('Authorization', `Bearer ${userToken}`)
            .send({ optionId: optionXId });

        const res = await request(server)
            .get('/polls')
            .set('Authorization', `Bearer ${userToken}`); // Can be user or admin token

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(res.body.polls).toHaveLength(1);
        expect(res.body.polls[0].id).toBe(pollId);
        expect(res.body.polls[0].options[0].votes).toBe(1);
        expect(res.body.polls[0].options[1].votes).toBe(0);
    });

    it('should get a specific poll by ID with vote counts', async () => {
        const createPollRes = await request(server)
            .post('/polls')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                question: 'Specific Poll Test',
                options: [{ text: 'A' }, { text: 'B' }],
            });
        const pollId = createPollRes.body.poll.id;
        const optionAId = createPollRes.body.poll.options[0].id;
        await request(server)
            .post(`/polls/${pollId}/vote`)
            .set('Authorization', `Bearer ${userToken}`)
            .send({ optionId: optionAId });

        const res = await request(server)
            .get(`/polls/${pollId}`)
            .set('Authorization', `Bearer ${userToken}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(res.body.poll.id).toBe(pollId);
        expect(res.body.poll.options[0].votes).toBe(1);
    });

    // Voting
    it('should allow user to vote on a poll', async () => {
        const createPollRes = await request(server)
            .post('/polls')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                question: 'Vote test',
                options: [{ text: 'Opt1' }, { text: 'Opt2' }],
            });
        const pollId = createPollRes.body.poll.id;
        const optionId = createPollRes.body.poll.options[0].id;

        const res = await request(server)
            .post(`/polls/${pollId}/vote`)
            .set('Authorization', `Bearer ${userToken}`)
            .send({ optionId: optionId });

        expect(res.statusCode).toEqual(201);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe('Vote submitted successfully.');

        // Verify vote in DB
        const voteInDb = await db.query.votes.findFirst({
            where: and(eq(votes.userId, userUserId), eq(votes.pollId, pollId), eq(votes.optionId, optionId))
        });
        expect(voteInDb).toBeDefined();
    });

    it('should prevent a user from voting twice on the same poll', async () => {
        const createPollRes = await request(server)
            .post('/polls')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                question: 'Double vote test',
                options: [{ text: 'A' }, { text: 'B' }],
            });
        const pollId = createPollRes.body.poll.id;
        const optionId1 = createPollRes.body.poll.options[0].id;
        const optionId2 = createPollRes.body.poll.options[1].id;

        // First vote
        await request(server)
            .post(`/polls/${pollId}/vote`)
            .set('Authorization', `Bearer ${userToken}`)
            .send({ optionId: optionId1 });

        // Second vote
        const res = await request(server)
            .post(`/polls/${pollId}/vote`)
            .set('Authorization', `Bearer ${userToken}`)
            .send({ optionId: optionId2 });

        expect(res.statusCode).toEqual(409);
        expect(res.body.message).toBe('You have already voted on this poll.');
    });

    it('should allow admin to update a poll', async () => {
        const createPollRes = await request(server)
            .post('/polls')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                question: 'Poll to update',
                options: [{ text: 'Opt1' }, { text: 'Opt2' }],
            });
        const pollId = createPollRes.body.poll.id;

        const res = await request(server)
            .put(`/polls/${pollId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                question: 'Updated question?',
                options: [{ text: 'UptOpt1' }, { text: 'UptOpt2' }],
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(res.body.poll.question).toBe('Updated question?');
    });

    it('should allow admin to delete a poll', async () => {
        const createPollRes = await request(server)
            .post('/polls')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                question: 'Poll to delete',
                options: [{ text: 'Opt1' }, { text: 'Opt2' }],
            });
        const pollId = createPollRes.body.poll.id;

        const res = await request(server)
            .delete(`/polls/${pollId}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe('Poll deleted successfully.');

        const pollInDb = await db.query.polls.findFirst({
            where: eq(polls.id, pollId)
        });
        expect(pollInDb).toBeUndefined();
    });

    it('should not allow regular user to delete a poll', async () => {
        const createPollRes = await request(server)
            .post('/polls')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                question: 'Poll created by admin',
                options: [{ text: 'Opt1' }, { text: 'Opt2' }],
            });
        const pollId = createPollRes.body.poll.id;

        const res = await request(server)
            .delete(`/polls/${pollId}`)
            .set('Authorization', `Bearer ${userToken}`);

        expect(res.statusCode).toEqual(403);
        expect(res.body.message).toBe('Forbidden: Admin access required.');
    });
});