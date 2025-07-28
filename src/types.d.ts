import 'hono'

declare module 'hono' {
    interface JWTPayload {
        id: number
        role: 'admin' | 'user',
        exp: number
    }

    interface Variables {
        userId: number
        userRole: 'admin' | 'user'
    }
}