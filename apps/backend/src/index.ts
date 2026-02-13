import { cors } from '@elysiajs/cors';
import { jwt } from '@elysiajs/jwt';
import { swagger } from '@elysiajs/swagger';
import { sql } from 'drizzle-orm';
import { Elysia } from 'elysia';

import { adminsModule } from './admins';
import { authModule } from './auth';
import { configsModule } from './configs';
import { closeConnection, db } from './db';
import { errorHandlerPlugin } from './middleware/error.handler';
import { logger, loggerPlugin } from './middleware/logger';
import { productsModule } from './products';
import { publicModule } from './public';
import { searchModule } from './search';
import { env, isDevelopment } from './utils/env';

const SWAGGER_TAGS = [
    { name: 'Health', description: 'Health check endpoints' },
    { name: 'Auth', description: 'Authentication endpoints' },
    { name: 'Products', description: 'Product management endpoints' },
    { name: 'Configs', description: 'Configuration management endpoints' },
    { name: 'Public', description: 'Public API - no authentication required' },
    { name: 'Search', description: 'Global search endpoints' },
    { name: 'Admins', description: 'Admin user management endpoints' },
] as const;

new Elysia()
    .use(
        swagger({
            path: '/swagger',
            documentation: {
                info: {
                    title: 'CMS API',
                    version: '1.0.0',
                    description: 'Content Management System API for managing product configurations',
                },
                tags: [...SWAGGER_TAGS],
            },
        })
    )
    .use(
        cors({
            origin: env.FRONTEND_URL,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization'],
        })
    )
    .use(
        jwt({
            name: 'jwt',
            secret: env.JWT_SECRET,
        })
    )
    .use(loggerPlugin)
    .use(errorHandlerPlugin)
    .use(authModule)
    .use(productsModule)
    .use(configsModule)
    .use(publicModule)
    .use(searchModule)
    .use(adminsModule)
    .get(
        '/health',
        async ({ set }) => {
            try {
                await db.execute(sql`SELECT 1`);

                return {
                    status: 'ok',
                    timestamp: new Date().toISOString(),
                    database: 'connected',
                    uptime: process.uptime(),
                };
            } catch (error) {
                logger.error({ error }, 'Health check failed - database unavailable');
                set.status = 503;
                return {
                    status: 'error',
                    timestamp: new Date().toISOString(),
                    database: 'disconnected',
                    message: 'Database connection failed',
                };
            }
        }
    )
    .get(
        '/ready',
        () => {
            return { ready: true };
        }
    )
    .listen(env.PORT, () => {
        logger.info(
            {
                port: env.PORT,
                environment: env.NODE_ENV,
                swagger: `http://localhost:${env.PORT}/swagger`,
            },
            `🚀 CMS Backend started${isDevelopment() ? ' in development mode' : ''}`
        );
    });

async function gracefulShutdown(signal: string): Promise<void> {
    logger.info({ signal }, 'Received shutdown signal, starting graceful shutdown...');

    try {
        await closeConnection();
        logger.info('Database connections closed');

        logger.info('Graceful shutdown completed');
        process.exit(0);
    } catch (error) {
        logger.error({ error }, 'Error during graceful shutdown');
        process.exit(1);
    }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
