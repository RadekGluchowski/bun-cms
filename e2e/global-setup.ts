import { API_BASE, ADMIN, EDITOR, SEED_PRODUCT } from './fixtures/test-data';

/** Emails that should be preserved (seed users). */
const SEED_EMAILS = [ADMIN.email, EDITOR.email];

/**
 * Playwright global setup — runs once before all tests.
 * Cleans up leftover test products and test admin accounts from previous runs.
 */
async function globalSetup(): Promise<void> {
  console.log('\n🧹 Global setup: cleaning up test data...');

  // Login
  const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN.email, password: ADMIN.password }),
  });

  if (!loginRes.ok) {
    console.error('❌ Global setup login failed:', loginRes.status);
    return;
  }

  const { token } = (await loginRes.json()) as { token: string };
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // ── Clean up test products ──────────────────────────────────────
  let page = 1;
  let deletedProducts = 0;

  while (true) {
    const res = await fetch(`${API_BASE}/api/products?page=${page}&limit=50`, { headers });
    if (!res.ok) break;

    const { products, total } = (await res.json()) as {
      products: Array<{ id: string; code: string }>;
      total: number;
    };

    if (products.length === 0) break;

    for (const product of products) {
      if (product.code === SEED_PRODUCT.code) continue;

      const delRes = await fetch(`${API_BASE}/api/products/${product.id}`, {
        method: 'DELETE',
        headers,
      });

      if (delRes.ok || delRes.status === 404) {
        deletedProducts++;
      }
    }

    if (page * 50 >= total) break;
    page++;
  }

  console.log(`   ✓ Deleted ${deletedProducts} leftover test product(s)`);
  console.log('   ✓ Seed product "SAMPLE" preserved');

  // ── Clean up test admin accounts ────────────────────────────────
  let deletedAdmins = 0;
  const adminsRes = await fetch(`${API_BASE}/api/admins`, { headers });

  if (adminsRes.ok) {
    const { admins } = (await adminsRes.json()) as {
      admins: Array<{ id: string; email: string }>;
    };

    for (const admin of admins) {
      if (SEED_EMAILS.includes(admin.email)) continue;

      const delRes = await fetch(`${API_BASE}/api/admins/${admin.id}`, {
        method: 'DELETE',
        headers,
      });

      if (delRes.ok || delRes.status === 404) {
        deletedAdmins++;
      }
    }
  }

  console.log(`   ✓ Deleted ${deletedAdmins} leftover test admin(s)`);
  console.log('   ✓ Seed users preserved: admin@example.com, editor@example.com');
  console.log('✅ Global setup complete\n');
}

export default globalSetup;
