import { eq } from 'drizzle-orm';

import { admins, db } from '../db';
import { UnauthorizedError } from '../middleware/error.handler';
import type { AdminEntity, AdminPublic, LoginRequest } from './auth.types';

export const authService = {
    async findAdminByEmail(email: string): Promise<AdminEntity | null> {
        const normalizedEmail = email.toLowerCase().trim();

        const [admin] = await db
            .select()
            .from(admins)
            .where(eq(admins.email, normalizedEmail))
            .limit(1);

        return admin ?? null;
    },

    async findAdminById(id: string): Promise<AdminEntity | null> {
        const [admin] = await db
            .select()
            .from(admins)
            .where(eq(admins.id, id))
            .limit(1);

        return admin ?? null;
    },

    async verifyPassword(password: string, hash: string): Promise<boolean> {
        return Bun.password.verify(password, hash);
    },

    async validateCredentials(request: LoginRequest): Promise<AdminEntity> {
        const admin = await this.findAdminByEmail(request.email);

        const genericError = 'Invalid email or password';

        if (!admin) {
            throw new UnauthorizedError(genericError);
        }

        const isValidPassword = await this.verifyPassword(
            request.password,
            admin.passwordHash
        );

        if (!isValidPassword) {
            throw new UnauthorizedError(genericError);
        }

        return admin;
    },

    toPublic(admin: AdminEntity): AdminPublic {
        return {
            id: admin.id,
            email: admin.email,
            name: admin.name,
            role: admin.role,
            createdAt: admin.createdAt,
            updatedAt: admin.updatedAt,
        };
    },
};
