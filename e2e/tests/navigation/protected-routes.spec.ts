import { test, expect } from '@playwright/test';
import { LoginPage } from '../../page-objects/LoginPage.po';
import { loginViaAPI } from '../../helpers/auth.helper';

test.describe('Protected Routes', () => {
  const fakeUuid = '00000000-0000-0000-0000-000000000000';

  test('should redirect /products to /login when not authenticated', async ({ page }) => {
    await page.goto('/products');
    await page.waitForURL('**/login', { timeout: 10_000 });

    const loginPage = new LoginPage(page);
    await loginPage.expectVisible();
    expect(page.url()).toContain('/login');
  });

  test('should redirect /products/:id to /login when not authenticated', async ({ page }) => {
    await page.goto(`/products/${fakeUuid}`);
    await page.waitForURL('**/login', { timeout: 10_000 });

    const loginPage = new LoginPage(page);
    await loginPage.expectVisible();
    expect(page.url()).toContain('/login');
  });

  test('should redirect /products/:id/configs/:type to /login when not authenticated', async ({ page }) => {
    await page.goto(`/products/${fakeUuid}/configs/general`);
    await page.waitForURL('**/login', { timeout: 10_000 });

    const loginPage = new LoginPage(page);
    await loginPage.expectVisible();
    expect(page.url()).toContain('/login');
  });

  test('should redirect /products/:id/history to /login when not authenticated', async ({ page }) => {
    await page.goto(`/products/${fakeUuid}/history`);
    await page.waitForURL('**/login', { timeout: 10_000 });

    const loginPage = new LoginPage(page);
    await loginPage.expectVisible();
    expect(page.url()).toContain('/login');
  });

  test('should redirect / to /products when authenticated', async ({ page }) => {
    await loginViaAPI(page);

    // Navigate to root
    await page.goto('/');

    // Should redirect to /products
    await page.waitForURL('**/products', { timeout: 10_000 });
    expect(page.url()).toContain('/products');
  });

  test('should allow access to /login when not authenticated', async ({ page }) => {
    await page.goto('/login');

    // Should remain on login page (no redirect)
    const loginPage = new LoginPage(page);
    await loginPage.expectVisible();

    // URL should still be /login
    expect(page.url()).toContain('/login');
  });
});
