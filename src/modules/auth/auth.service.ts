import 'dotenv/config'
import { RegisterInput } from './auth.schema'
import { db } from '../../db'
import { eq } from 'drizzle-orm'
import { users } from '../../db/schema'
import { HTTPException } from 'hono/http-exception'
import { JWTPayload } from 'hono/utils/jwt/types'
import { sign } from 'hono/jwt'

const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not set in environment variables')
}

export class AuthService {
    async register(data: RegisterInput) {
        const existingUser = await db.query.users.findFirst({
            where: eq(users.email, data.email)
        })

        if (existingUser) {
            throw new HTTPException(409, { message: 'User with this email already exists.' })
        }

        const hashedPassword = await Bun.password.hash(data.password)

        const [newUser] = await db.insert(users).values({
            email: data.email,
            hashedPassword: hashedPassword,
            name: data.name || null,
            role: data.role
        }).returning({
            id: users.id,
            email: users.email,
            role: users.role
        })

        if (!newUser) {
            throw new HTTPException(500, { message: 'Failed to register user.' })
        }

        const payload: JWTPayload = {
            id: newUser.id,
            role: newUser.role,
            exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7)
        }
        const token = await sign(payload, JWT_SECRET!)

        return {
            user: newUser,
            token
        }
    }

    async login(email: string, passwordPlain: string) {
        const user = await db.query.users.findFirst({
            where: eq(users.email, email)
        })

        if (!user) {
            throw new HTTPException(401, { message: 'Invalid credentials: User not found.' })
        }

        const isPasswordValid = await Bun.password.verify(passwordPlain, user.hashedPassword)

        if (!isPasswordValid) {
            throw new HTTPException(401, { message: 'Invalid credentials: Incorrect password.' })
        }

        const payload: JWTPayload = {
            id: user.id,
            role: user.role,
            exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7)
        }
        const token = await sign(payload, JWT_SECRET!)

        return {
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                name: user.name
            },
            token
        }
    }
}

