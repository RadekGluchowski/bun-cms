import { Elysia } from 'elysia';

import { requireAdmin } from '../auth/admin.guard';
import { authGuard } from '../auth/auth.guard';
import { adminsService } from './admins.service';
import type { AdminListResponse, AdminPublicExtended } from './admins.types';
import {
  adminIdParamsSchema,
  createAdminBodySchema,
  updateAdminBodySchema,
} from './admins.types';

export const adminsModule = new Elysia({ prefix: '/api/admins' })
  .use(authGuard)
  .use(requireAdmin)
  .get(
    '/',
    async (): Promise<AdminListResponse> => {
      return adminsService.listAdmins();
    },
    {
      detail: {
        tags: ['Admins'],
        summary: 'List all users',
        description: 'Returns all admin/editor users. Admin role required.',
      },
    }
  )
  .post(
    '/',
    async ({ body, set }): Promise<AdminPublicExtended> => {
      set.status = 201;
      return adminsService.createAdmin(body);
    },
    {
      body: createAdminBodySchema,
      detail: {
        tags: ['Admins'],
        summary: 'Create user',
        description: 'Creates a new admin or editor user. Admin role required.',
      },
    }
  )
  .put(
    '/:adminId',
    async ({ params, body }): Promise<AdminPublicExtended> => {
      return adminsService.updateAdmin(params.adminId, body);
    },
    {
      params: adminIdParamsSchema,
      body: updateAdminBodySchema,
      detail: {
        tags: ['Admins'],
        summary: 'Update user',
        description: 'Updates user name or role. Admin role required.',
      },
    }
  )
  .delete(
    '/:adminId',
    async ({ params, currentAdmin }): Promise<{ success: true }> => {
      return adminsService.deleteAdmin(params.adminId, currentAdmin.id);
    },
    {
      params: adminIdParamsSchema,
      detail: {
        tags: ['Admins'],
        summary: 'Delete user',
        description:
          'Deletes a user. Cannot delete yourself. Admin role required.',
      },
    }
  );
