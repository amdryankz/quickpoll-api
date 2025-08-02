import { MiddlewareHandler } from "hono";
import logger from "../utils/logger";

export const pinoLogger: MiddlewareHandler = async (c, next) => {
    const start = Date.now()
    await next()
    const end = Date.now()

    const logObject = {
        method: c.req.method,
        path: c.req.path,
        status: c.res.status,
        latency: `${end - start}ms`,
        jwt: c.get('jwtPayload'),
    }

    if (c.res.status >= 500) {
        logger.error(logObject, 'Server Error')
    } else if (c.res.status >= 400) {
        logger.warn(logObject, 'Client Error')
    } else {
        logger.info('Request Handled')
    }
}