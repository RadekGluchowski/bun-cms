import { Elysia } from 'elysia';

import { ForbiddenError } from '../middleware/error.handler';
import type { AdminPublic } from './auth.types';

/**
 * Elysia plugin that checks if the current admin has the 'admin' role.
 * Must be used AFTER authGuard in the plugin chain.
 *
 * Usage:
 *   .use(authGuard)
 *   ...editor-accessible routes...
 *   .use(requireAdmin)
 *   ...admin-only routes...
 */
export const requireAdmin = new Elysia({ name: 'require-admin' }).onBeforeHandle(
  { as: 'scoped' },
  (context) => {
    const { currentAdmin } = context as unknown as { currentAdmin: AdminPublic };
    if (currentAdmin.role !== 'admin') {
      throw new ForbiddenError('This action requires administrator privileges');
    }
  }
);
