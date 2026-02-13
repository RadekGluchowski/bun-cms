import { ApiHelper } from './api.helper';

const api = new ApiHelper();

/**
 * Creates a test admin via API. Returns the admin object.
 */
export async function createTestAdmin(overrides?: {
  email?: string;
  password?: string;
  name?: string;
  role?: 'admin' | 'editor';
}): Promise<{ id: string; email: string; name: string; role: string }> {
  const timestamp = Date.now();
  return api.createAdmin({
    email: overrides?.email ?? `test-${timestamp}@example.com`,
    password: overrides?.password ?? 'testpass123!@#',
    name: overrides?.name ?? `Test User ${timestamp}`,
    role: overrides?.role ?? 'editor',
  });
}

/**
 * Deletes a test admin via API.
 */
export async function deleteTestAdmin(id: string): Promise<void> {
  return api.deleteAdmin(id);
}

/**
 * Lists all admins via API.
 */
export async function listAdmins() {
  return api.listAdmins();
}

/**
 * Cleans up test admins (those with emails matching a prefix).
 */
export async function cleanupTestAdmins(emailPrefix: string = 'test-'): Promise<void> {
  const { admins } = await api.listAdmins();
  for (const admin of admins) {
    if (admin.email.startsWith(emailPrefix)) {
      await api.deleteAdmin(admin.id).catch(() => {});
    }
  }
}
