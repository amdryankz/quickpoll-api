import { eq } from "drizzle-orm";
import { db } from "../../db";
import { users } from "../../db/schema";
import { HTTPException } from "hono/http-exception";

export class UserService {
    async getUserById(id: number) {
        const user = await db.query.users.findFirst({
            where: eq(users.id, id),
            columns: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true
            }
        })

        if (!user) {
            throw new HTTPException(404, { message: 'User not found.' })
        }

        return user
    }
}