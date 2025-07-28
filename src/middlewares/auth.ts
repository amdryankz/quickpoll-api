import { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import { verify } from "hono/jwt"

export const authMiddleware = async (c: Context, next: Next) => {
    const authHeader = c.req.header('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new HTTPException(401, { message: 'Unauthorized: No token provided or invalid format.' })
    }

    const token = authHeader.split(' ')[1]
    if (!token) {
        throw new HTTPException(401, { message: 'Unauthorized: Token  missing.' })
    }

    const JWT_SECRET = process.env.JWT_SECRET || ""

    try {
        const payload = await verify(token, JWT_SECRET)
        c.set('userId', payload.id)
        c.set('userRole', payload.role)
        await next()
    } catch (err) {
        console.error('JWT Verification Error: ', err)
        throw new HTTPException(401, { message: 'Unauthorized: Invalid or expired token.' })
    }
}

type Role = 'admin' | 'user'

export const authorize = (requiredRole: Role) => {
    return async (c: Context, next: Next) => {
        const userRole = c.get('userRole')

        if (!userRole) {
            throw new HTTPException(401, { message: 'Unauthorized: User role not found.' })
        }

        if (requiredRole === 'admin' && userRole !== 'user') {
            throw new HTTPException(403, { message: 'Forbidden: Admin access required.' })
        }

        await next()
    }
}