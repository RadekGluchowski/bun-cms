import { test, expect } from '@playwright/test';
import { LoginPage } from '../../page-objects/LoginPage.po';
import { loginViaUI } from '../../helpers/auth.helper';

test.describe('Session Management', () => {
  test('should persist session across page reloads', async ({ page }) => {
    // Login via UI
    await loginViaUI(page);
    expect(page.url()).toContain('/products');

    // Reload the page
    await page.reload();

    // Should still be on the products page (session persisted)
    await page.waitForURL('**/products', { timeout: 10_000 });
    expect(page.url()).toContain('/products');

    // Verify the auth token is still in localStorage
    const authState = await page.evaluate(() => {
      const raw = localStorage.getItem('cms-auth');
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    });

    expect(authState).not.toBeNull();
    expect(authState.state?.token).toBeTruthy();
    expect(authState.state?.isAuthenticated).toBe(true);
  });

  test('should redirect to /login when token is invalid', async ({ page }) => {
    // First, navigate to any page to initialize localStorage
    await page.goto('/login');

    // Set an invalid token directly in localStorage via Zustand persist format
    await page.evaluate(() => {
      const invalidAuthState = {
        state: {
          token: 'invalid-expired-token-12345',
          admin: { id: '1', email: 'admin@example.com', name: 'Administrator' },
          isAuthenticated: true,
        },
        version: 0,
      };
      localStorage.setItem('cms-auth', JSON.stringify(invalidAuthState));
    });

    // Try to navigate to the protected /products route
    await page.goto('/products');

    // The app should detect the invalid token (via /auth/me check or API 401)
    // and redirect to /login
    await page.waitForURL('**/login', { timeout: 15_000 });
    expect(page.url()).toContain('/login');
  });

  test('should redirect to /login when no token exists', async ({ page }) => {
    // Ensure no auth state exists in localStorage
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.removeItem('cms-auth');
      localStorage.removeItem('token');
    });

    // Attempt to access a protected route directly
    await page.goto('/products');

    // Should be redirected to /login
    await page.waitForURL('**/login', { timeout: 10_000 });
    expect(page.url()).toContain('/login');

    // Verify the login page is displayed
    const loginPage = new LoginPage(page);
    await loginPage.expectVisible();
  });

  test('should redirect to /login with expired token', async ({ page }) => {
    // Navigate to a page first so we can set localStorage
    await page.goto('/login');

    // Set an expired JWT-like token in the Zustand persist format
    // This is a structurally valid JWT that has expired
    const expiredPayload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 3600 }));
    const expiredToken = `eyJhbGciOiJIUzI1NiJ9.${expiredPayload}.fakesignature`;

    await page.evaluate((token) => {
      const expiredAuthState = {
        state: {
          token,
          admin: { id: '1', email: 'admin@example.com', name: 'Administrator' },
          isAuthenticated: true,
        },
        version: 0,
      };
      localStorage.setItem('cms-auth', JSON.stringify(expiredAuthState));
    }, expiredToken);

    // Try to access a protected route
    await page.goto('/products');

    // Should be redirected to /login because the token is expired/invalid
    await page.waitForURL('**/login', { timeout: 15_000 });
    expect(page.url()).toContain('/login');
  });
});
