import { Elysia } from 'elysia';
import pino from 'pino';

import { env, isDevelopment } from '../utils/env';

export const logger = pino({
    level: env.LOG_LEVEL,
    ...(isDevelopment()
        ? {
            transport: {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    translateTime: 'SYS:standard',
                    ignore: 'pid,hostname',
                },
            },
        }
        : {}),
});

const requestTimings = new WeakMap<object, number>();

export const loggerPlugin = new Elysia({ name: 'logger' })
    .derive(({ request }) => {
        requestTimings.set(request, Date.now());

        return {};
    })
    .onRequest(({ request }) => {
        const url = new URL(request.url);
        logger.info(
            {
                method: request.method,
                url: url.pathname,
            },
            'Incoming request'
        );
    })
    .onAfterResponse(({ request, set }) => {
        const url = new URL(request.url);
        const startTime = requestTimings.get(request);
        const duration = startTime ? Date.now() - startTime : 0;

        requestTimings.delete(request);

        logger.info(
            {
                method: request.method,
                url: url.pathname,
                status: set.status ?? 200,
                duration: `${duration}ms`,
            },
            'Request completed'
        );
    });

export type Logger = typeof logger;
