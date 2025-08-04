import { describe, it, expect, beforeEach, afterAll, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { db } from '../../src/db';
import { users } from '../../src/db/schema';
import { eq } from 'drizzle-orm';
import { serve } from '@hono/node-server'

let server: ReturnType<typeof serve>;

describe('Auth Endpoints', () => {
	beforeEach(async () => {
		await db.delete(users);
	});

	beforeAll(() => {
		server = serve({ fetch: app.fetch });
	});

	afterAll(async () => {
		server.close();
	});

	it('should register a new user successfully', async () => {
		const res = await request(server)
			.post('/auth/register')
			.send({
				email: 'register-test@example.com',
				password: 'password123',
				name: 'Register User',
				role: 'user'
			});

		expect(res.statusCode).toEqual(201);
		expect(res.body.success).toBe(true);
		expect(res.body.user).toHaveProperty('id');
		expect(res.body.user.email).toBe('register-test@example.com');
		expect(res.body.user.role).toBe('user');
		expect(res.body.token).toBeDefined();

		const userInDb = await db.query.users.findFirst({
			where: eq(users.email, 'register-test@example.com'),
		});
		expect(userInDb).toBeDefined();
		expect(userInDb?.email).toBe('register-test@example.com');
	});

	it('should not register with existing email', async () => {
		await request(server)
			.post('/auth/register')
			.send({
				email: 'duplicate@example.com',
				password: 'password123',
				role: 'user'
			});

		const res = await request(server)
			.post('/auth/register')
			.send({
				email: 'duplicate@example.com',
				password: 'anotherpassword',
				role: 'user'
			});

		expect(res.statusCode).toEqual(409);
		expect(res.body.success).toBe(false);
		expect(res.body.message).toBe('User with this email already exists.');
	});

	it('should login a user successfully', async () => {
		await request(server)
			.post('/auth/register')
			.send({
				email: 'login@example.com',
				password: 'password123',
				role: 'user'
			});

		const res = await request(server)
			.post('/auth/login')
			.send({
				email: 'login@example.com',
				password: 'password123',
			});

		expect(res.statusCode).toEqual(200);
		expect(res.body.success).toBe(true);
		expect(res.body.user.email).toBe('login@example.com');
		expect(res.body.token).toBeDefined();
	});

	it('should not login with invalid password', async () => {
		await request(server)
			.post('/auth/register')
			.send({
				email: 'invalidlogin@example.com',
				password: 'correctpassword',
				role: 'user'
			});

		const res = await request(server)
			.post('/auth/login')
			.send({
				email: 'invalidlogin@example.com',
				password: 'wrongpassword',
			});

		expect(res.statusCode).toEqual(401);
		expect(res.body.success).toBe(false);
		expect(res.body.message).toBe('Invalid credentials: Incorrect password.');
	});

	it('should get authenticated user profile successfully', async () => {
		const registerRes = await request(server)
			.post('/auth/register')
			.send({
				email: 'profile@example.com',
				password: 'password123',
				name: 'Profile User',
				role: 'user'
			});

		const token = registerRes.body.token;

		const res = await request(server)
			.get('/users/profile')
			.set('Authorization', `Bearer ${token}`);

		expect(res.statusCode).toEqual(200);
		expect(res.body.success).toBe(true);
		expect(res.body.user.email).toBe('profile@example.com');
		expect(res.body.user.name).toBe('Profile User');
		expect(res.body.user).not.toHaveProperty('hashedPassword');
	});

	it('should return 401 for unauthorized access to user profile', async () => {
		const res = await request(server)
			.get('/users/profile');

		expect(res.statusCode).toEqual(401);
		expect(res.body.success).toBe(false);
		expect(res.body.message).toBe('Unauthorized: No token provided or invalid format.');
	});
});