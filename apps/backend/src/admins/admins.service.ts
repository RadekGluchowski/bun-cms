import { count, eq } from 'drizzle-orm';

import { admins, db } from '../db';
import type { Admin } from '../db/schema';
import { BadRequestError, ConflictError, NotFoundError } from '../middleware/error.handler';
import type {
  AdminListResponse,
  AdminPublicExtended,
  CreateAdminRequest,
  UpdateAdminRequest,
} from './admins.types';

function toAdminPublic(admin: Admin): AdminPublicExtended {
  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    createdAt: admin.createdAt,
    updatedAt: admin.updatedAt,
  };
}

export const adminsService = {
  async listAdmins(): Promise<AdminListResponse> {
    const result = await db.select().from(admins).orderBy(admins.createdAt);
    const [countResult] = await db.select({ value: count() }).from(admins);

    return {
      admins: result.map(toAdminPublic),
      total: countResult?.value ?? 0,
    };
  },

  async createAdmin(data: CreateAdminRequest): Promise<AdminPublicExtended> {
    const normalizedEmail = data.email.toLowerCase().trim();

    const [existing] = await db
      .select({ id: admins.id })
      .from(admins)
      .where(eq(admins.email, normalizedEmail))
      .limit(1);

    if (existing) {
      throw new ConflictError(`User with email '${normalizedEmail}' already exists`);
    }

    const passwordHash = await Bun.password.hash(data.password, {
      algorithm: 'argon2id',
      memoryCost: 65536,
      timeCost: 3,
    });

    const id = crypto.randomUUID();
    const [admin] = await db
      .insert(admins)
      .values({
        id,
        email: normalizedEmail,
        passwordHash,
        name: data.name,
        role: data.role,
      })
      .returning();

    return toAdminPublic(admin!);
  },

  async updateAdmin(
    adminId: string,
    data: UpdateAdminRequest
  ): Promise<AdminPublicExtended> {
    const [existing] = await db
      .select()
      .from(admins)
      .where(eq(admins.id, adminId))
      .limit(1);

    if (!existing) {
      throw new NotFoundError('User not found');
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (data.name !== undefined) updateData.name = data.name;
    if (data.role !== undefined) updateData.role = data.role;

    const [updated] = await db
      .update(admins)
      .set(updateData)
      .where(eq(admins.id, adminId))
      .returning();

    return toAdminPublic(updated!);
  },

  async deleteAdmin(
    adminId: string,
    currentAdminId: string
  ): Promise<{ success: true }> {
    if (adminId === currentAdminId) {
      throw new BadRequestError('Cannot delete your own account');
    }

    const [existing] = await db
      .select({ id: admins.id })
      .from(admins)
      .where(eq(admins.id, adminId))
      .limit(1);

    if (!existing) {
      throw new NotFoundError('User not found');
    }

    await db.delete(admins).where(eq(admins.id, adminId));
    return { success: true };
  },
};
