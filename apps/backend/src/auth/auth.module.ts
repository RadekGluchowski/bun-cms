import { jwt } from '@elysiajs/jwt';
import { Elysia } from 'elysia';

import { TooManyRequestsError } from '../middleware/error.handler';
import { env } from '../utils/env';
import { authGuard } from './auth.guard';
import { authService } from './auth.service';
import type { JwtPayload, LoginResponse } from './auth.types';
import { loginBodySchema } from './auth.types';

const TOKEN_EXPIRATION_SECONDS = 2 * 60 * 60; // 2 hours

// In-memory rate limiter for login attempts (per email)
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const loginAttempts = new Map<string, { count: number; firstAttempt: number }>();

function checkLoginRateLimit(email: string): void {
    const now = Date.now();
    const key = email.toLowerCase().trim();
    const entry = loginAttempts.get(key);

    if (entry) {
        if (now - entry.firstAttempt > LOGIN_WINDOW_MS) {
            loginAttempts.set(key, { count: 1, firstAttempt: now });
            return;
        }

        if (entry.count >= LOGIN_MAX_ATTEMPTS) {
            const retryAfterSeconds = Math.ceil(
                (entry.firstAttempt + LOGIN_WINDOW_MS - now) / 1000
            );
            throw new TooManyRequestsError(
                `Too many login attempts. Try again in ${retryAfterSeconds} seconds.`
            );
        }

        entry.count++;
    } else {
        loginAttempts.set(key, { count: 1, firstAttempt: now });
    }
}

function clearLoginAttempts(email: string): void {
    loginAttempts.delete(email.toLowerCase().trim());
}

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
            checkLoginRateLimit(body.email);

            const admin = await authService.validateCredentials(body);

            clearLoginAttempts(body.email);

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
