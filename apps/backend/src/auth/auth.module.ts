import { jwt } from '@elysiajs/jwt';
import { Elysia } from 'elysia';

import { env } from '../utils/env';
import { authGuard } from './auth.guard';
import { authService } from './auth.service';
import type { JwtPayload, LoginResponse } from './auth.types';
import { loginBodySchema } from './auth.types';

const TOKEN_EXPIRATION_SECONDS = 24 * 60 * 60;

export const authModule = new Elysia({ prefix: '/api/auth' })
    .use(
        jwt({
            name: 'jwt',
            secret: env.JWT_SECRET,
        })
    )
    .post(
        '/login',
        async ({ body, jwt: jwtInstance }): Promise<LoginResponse> => {
            const admin = await authService.validateCredentials(body);

            const payload: JwtPayload = {
                sub: admin.id,
                email: admin.email,
                role: admin.role,
            };

            const token = await jwtInstance.sign({
                ...payload,
                exp: Math.floor(Date.now() / 1000) + TOKEN_EXPIRATION_SECONDS,
            });

            return {
                token,
                admin: authService.toPublic(admin),
            };
        },
        {
            body: loginBodySchema,
            detail: {
                tags: ['Auth'],
                summary: 'Login',
                description: 'Authenticate with email and password to receive a JWT token',
            },
        }
    )
    .use(authGuard)
    .get(
        '/me',
        ({ currentAdmin }) => {
            return currentAdmin;
        },
        {
            detail: {
                tags: ['Auth'],
                summary: 'Get current admin',
                description: 'Returns the currently authenticated admin information',
            },
        }
    );
