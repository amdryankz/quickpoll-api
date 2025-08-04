import pino from 'pino'

const logger = pino({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    ...(process.env.NODE_ENV !== 'production' && {
        transport: {
            target: 'pino-pretty',
            options: {
                colorize: true,
                ignore: 'pid,hostname',
                translateTime: 'SYS:HH:MM:ss Z'
            }
        }
    }),
    base: {
        app: 'QuickPoll-API',
        env: process.env.NODE_ENV || 'development'
    }
})

export default logger