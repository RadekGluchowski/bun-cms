import { jwt } from '@elysiajs/jwt';
import { Elysia } from 'elysia';

import { UnauthorizedError } from '../middleware/error.handler';
import { env } from '../utils/env';
import { authService } from './auth.service';
import type { AdminPublic, JwtPayload } from './auth.types';

function extractBearerToken(authHeader: string | undefined): string {
    if (!authHeader) {
        throw new UnauthorizedError('Authorization header required');
    }

    if (!authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedError('Invalid authorization format. Use: Bearer <token>');
    }

    const token = authHeader.slice(7);

    if (!token) {
        throw new UnauthorizedError('Token required');
    }

    return token;
}

export const authGuard = new Elysia({ name: 'auth-guard' })
    .use(
        jwt({
            name: 'jwt',
            secret: env.JWT_SECRET,
        })
    )
    .derive(
        { as: 'scoped' },
        async ({ headers, jwt: jwtInstance }): Promise<{ currentAdmin: AdminPublic }> => {
            const token = extractBearerToken(headers.authorization);

            let payload: unknown;
            try {
                payload = await jwtInstance.verify(token);
            } catch {
                throw new UnauthorizedError('Invalid or expired token');
            }

            if (!payload) {
                throw new UnauthorizedError('Invalid or expired token');
            }

            const jwtPayload = payload as unknown as JwtPayload;

            if (!jwtPayload.sub || typeof jwtPayload.sub !== 'string') {
                throw new UnauthorizedError('Invalid token payload');
            }

            const admin = await authService.findAdminById(jwtPayload.sub);

            if (!admin) {
                throw new UnauthorizedError('Admin not found');
            }

            return {
                currentAdmin: authService.toPublic(admin),
            };
        }
    );
