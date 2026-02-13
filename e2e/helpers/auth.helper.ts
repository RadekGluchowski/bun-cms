import type { Page } from '@playwright/test';
import { ADMIN, EDITOR, API_BASE } from '../fixtures/test-data';

/**
 * Logs in via the UI.
 */
export async function loginViaUI(
  page: Page,
  email: string = ADMIN.email,
  password: string = ADMIN.password
): Promise<void> {
  await page.goto('/login');
  await page.getByTestId('login-email-input').fill(email);
  await page.getByTestId('login-password-input').fill(password);
  await page.getByTestId('login-submit-button').click();
  await page.waitForURL('**/products', { timeout: 15_000 });
}

/**
 * Logs in via the API, sets the Zustand auth state in localStorage,
 * then navigates to /products. Faster than UI login.
 */
export async function loginViaAPI(page: Page): Promise<void> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN.email, password: ADMIN.password }),
  });
  const data = (await res.json()) as { token: string; admin: { id: string; email: string; name: string } };

  await page.goto('/login'); // Need to be on a page to set localStorage
  await page.evaluate(
    ({ token, admin }) => {
      const state = {
        state: { token, admin, isAuthenticated: true },
        version: 0,
      };
      localStorage.setItem('cms-auth', JSON.stringify(state));
    },
    { token: data.token, admin: data.admin }
  );

  await page.goto('/products');
  await page.waitForURL('**/products', { timeout: 10_000 });
}

/**
 * Logs out via the sidebar button.
 */
export async function logoutViaUI(page: Page): Promise<void> {
  await page.getByTestId('sidebar-logout-button').click();
  await page.waitForURL('**/login', { timeout: 10_000 });
}

/**
 * Sets the full Zustand auth state in localStorage (key: cms-auth).
 */
export async function setAuthToken(page: Page, token: string): Promise<void> {
  await page.evaluate((t) => {
    const state = {
      state: {
        token: t,
        admin: { id: 'test', email: 'admin@example.com', name: 'Administrator' },
        isAuthenticated: true,
      },
      version: 0,
    };
    localStorage.setItem('cms-auth', JSON.stringify(state));
  }, token);
}

/**
 * Clears the Zustand auth state from localStorage.
 */
export async function clearAuthToken(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.removeItem('cms-auth');
  });
}

/**
 * Gets the auth token from the Zustand persisted state in localStorage.
 */
export async function getAuthToken(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    const raw = localStorage.getItem('cms-auth');
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return parsed?.state?.token ?? null;
    } catch {
      return null;
    }
  });
}

/**
 * Logs in as the editor via the API, sets the Zustand auth state in localStorage,
 * then navigates to /products.
 */
export async function loginAsEditorViaAPI(page: Page): Promise<void> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EDITOR.email, password: EDITOR.password }),
  });
  const data = (await res.json()) as { token: string; admin: object };

  await page.goto('/login');
  await page.evaluate(
    ({ token, admin }) => {
      const state = {
        state: { token, admin, isAuthenticated: true },
        version: 0,
      };
      localStorage.setItem('cms-auth', JSON.stringify(state));
    },
    { token: data.token, admin: data.admin }
  );

  await page.goto('/products');
  await page.waitForURL('**/products', { timeout: 10_000 });
}
