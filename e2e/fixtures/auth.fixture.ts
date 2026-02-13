import { test as base, type Page } from '@playwright/test';
import { ADMIN, API_BASE } from './test-data';

/**
 * Custom test fixture that provides an authenticated page.
 * Logs in via the API (faster than UI) before each test that uses `authenticatedPage`.
 */
export const test = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ page }, use) => {
    // Login via API (faster than UI)
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN.email, password: ADMIN.password }),
    });
    const data = (await res.json()) as { token: string; admin: object };

    // Set auth state in localStorage (Zustand persist format)
    await page.goto('/login');
    await page.evaluate(
      ({ token, admin }) => {
        localStorage.setItem(
          'cms-auth',
          JSON.stringify({
            state: { token, admin, isAuthenticated: true },
            version: 0,
          })
        );
      },
      { token: data.token, admin: data.admin }
    );

    // Navigate to products
    await page.goto('/products');
    await page.waitForURL('**/products', { timeout: 10_000 });

    await use(page);
  },
});

export { expect } from '@playwright/test';
