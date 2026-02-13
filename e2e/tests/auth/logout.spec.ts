import { test, expect } from '@playwright/test';
import { SidebarPO } from '../../page-objects/Sidebar.po';
import { LoginPage } from '../../page-objects/LoginPage.po';
import { ToastPO } from '../../page-objects/ToastPO.po';
import { loginViaUI } from '../../helpers/auth.helper';

test.describe('Logout', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUI(page);
  });

  test('should show logout button with text "Wyloguj się" in sidebar', async ({ page }) => {
    const sidebar = new SidebarPO(page);

    await expect(sidebar.logoutButton).toBeVisible();
    await expect(sidebar.logoutButton).toContainText('Wyloguj się');
  });

  test('should redirect to /login after clicking logout', async ({ page }) => {
    const sidebar = new SidebarPO(page);

    await sidebar.clickLogout();

    await page.waitForURL('**/login', { timeout: 10_000 });
    expect(page.url()).toContain('/login');
  });

  test('should clear auth token from localStorage on logout', async ({ page }) => {
    const sidebar = new SidebarPO(page);

    // Verify auth state exists before logout
    const tokenBeforeLogout = await page.evaluate(() => {
      return localStorage.getItem('cms-auth');
    });
    expect(tokenBeforeLogout).not.toBeNull();

    // Perform logout
    await sidebar.clickLogout();
    await page.waitForURL('**/login', { timeout: 10_000 });

    // Verify auth state is cleared from localStorage
    const authStateAfterLogout = await page.evaluate(() => {
      const raw = localStorage.getItem('cms-auth');
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    });

    // The zustand persist store should have cleared the token
    if (authStateAfterLogout) {
      expect(authStateAfterLogout.state?.token).toBeNull();
      expect(authStateAfterLogout.state?.isAuthenticated).toBe(false);
    }
  });

  test('should not allow access to /products after logout', async ({ page }) => {
    const sidebar = new SidebarPO(page);

    // Logout
    await sidebar.clickLogout();
    await page.waitForURL('**/login', { timeout: 10_000 });

    // Attempt to navigate to the protected /products route
    await page.goto('/products');

    // Should be redirected back to /login
    await page.waitForURL('**/login', { timeout: 10_000 });
    expect(page.url()).toContain('/login');

    // Verify the login page is displayed
    const loginPage = new LoginPage(page);
    await loginPage.expectVisible();
  });

  test('should show toast "Wylogowano" after logout', async ({ page }) => {
    const sidebar = new SidebarPO(page);
    const toast = new ToastPO(page);

    await sidebar.clickLogout();
    await page.waitForURL('**/login', { timeout: 10_000 });

    // Verify toast notification appears with logout message
    await toast.expectToast('Wylogowano');
  });
});
