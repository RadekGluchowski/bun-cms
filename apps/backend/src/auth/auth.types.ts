import { t, type Static } from 'elysia';

import type { AdminRole } from '@app/shared';

export const loginBodySchema = t.Object({
    email: t.String({
        format: 'email',
        error: 'Invalid email format',
    }),
    password: t.String({
        minLength: 6,
        error: 'Password must be at least 6 characters',
    }),
});

export type LoginRequest = Static<typeof loginBodySchema>;

export interface AdminPublic {
    id: string;
    email: string;
    name: string;
    role: AdminRole;
    createdAt: Date;
    updatedAt: Date;
}

export interface LoginResponse {
    token: string;
    admin: AdminPublic;
}

export interface JwtPayload {
    sub: string;
    email: string;
    role: AdminRole;
}

export interface AdminEntity {
    id: string;
    email: string;
    passwordHash: string;
    name: string;
    role: AdminRole;
    createdAt: Date;
    updatedAt: Date;
}
