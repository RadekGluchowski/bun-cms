import { t, type Static } from 'elysia';

import type { AdminRole } from '@app/shared';

export const createAdminBodySchema = t.Object({
  email: t.String({
    format: 'email',
    error: 'Invalid email format',
  }),
  password: t.String({
    minLength: 6,
    error: 'Password must be at least 6 characters',
  }),
  name: t.String({
    minLength: 1,
    maxLength: 255,
    error: 'Name is required and must be max 255 characters',
  }),
  role: t.Union([t.Literal('admin'), t.Literal('editor')], {
    error: 'Role must be admin or editor',
  }),
});

export const updateAdminBodySchema = t.Object({
  name: t.Optional(
    t.String({
      minLength: 1,
      maxLength: 255,
      error: 'Name must be max 255 characters',
    })
  ),
  role: t.Optional(
    t.Union([t.Literal('admin'), t.Literal('editor')], {
      error: 'Role must be admin or editor',
    })
  ),
});

export const adminIdParamsSchema = t.Object({
  adminId: t.String({
    minLength: 36,
    maxLength: 36,
    error: 'Invalid admin ID format',
  }),
});

export type CreateAdminRequest = Static<typeof createAdminBodySchema>;
export type UpdateAdminRequest = Static<typeof updateAdminBodySchema>;

export interface AdminPublicExtended {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminListResponse {
  admins: AdminPublicExtended[];
  total: number;
}
