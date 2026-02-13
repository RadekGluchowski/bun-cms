import { test, expect } from '@playwright/test';
import { LoginPage } from '../../page-objects/LoginPage.po';
import { ADMIN, INVALID_CREDENTIALS } from '../../fixtures/test-data';

test.describe('Login Page', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('should display login page with correct elements', async ({ page }) => {
    // Card container
    await expect(loginPage.card).toBeVisible();

    // Title "Panel administracyjny"
    const title = loginPage.card.getByText('Panel administracyjny');
    await expect(title).toBeVisible();

    // Email input
    await expect(loginPage.emailInput).toBeVisible();

    // Password input
    await expect(loginPage.passwordInput).toBeVisible();

    // Submit button with "Zaloguj się" text
    await expect(loginPage.submitButton).toBeVisible();
    await expect(loginPage.submitButton).toContainText('Zaloguj się');
  });

  test('should have email input focused on load', async () => {
    await expect(loginPage.emailInput).toBeFocused();
  });

  test('should show email input with placeholder "admin@example.com"', async () => {
    await expect(loginPage.emailInput).toHaveAttribute('placeholder', 'admin@example.com');
  });

  test('should show password input with placeholder "••••••••"', async () => {
    await expect(loginPage.passwordInput).toHaveAttribute('placeholder', '••••••••');
  });

  test('should show password input as type password', async () => {
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
  });

  test('should disable inputs and show "Logowanie..." during login', async ({ page }) => {
    // Intercept the login API and delay the response by 3 seconds
    await page.route('**/api/auth/login', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'fake-token',
          admin: { id: '1', email: ADMIN.email, name: ADMIN.name },
        }),
      });
    });

    // Fill credentials and submit
    await loginPage.emailInput.fill(ADMIN.email);
    await loginPage.passwordInput.fill(ADMIN.password);
    await loginPage.submitButton.click();

    // Verify loading state: button shows "Logowanie..." and inputs are disabled
    await loginPage.expectLoadingState();
    await expect(loginPage.emailInput).toBeDisabled();
    await expect(loginPage.passwordInput).toBeDisabled();
    await expect(loginPage.submitButton).toBeDisabled();
  });

  test('should redirect to /products on successful login', async ({ page }) => {
    await loginPage.login(ADMIN.email, ADMIN.password);
    await loginPage.expectRedirectToProducts();
    expect(page.url()).toContain('/products');
  });

  test('should show error message on invalid credentials', async () => {
    await loginPage.login(INVALID_CREDENTIALS.email, INVALID_CREDENTIALS.password);
    await loginPage.expectError('Nieprawidłowy email lub hasło');
  });

  test('should clear error when user modifies email field', async () => {
    // Trigger an error first
    await loginPage.login(INVALID_CREDENTIALS.email, INVALID_CREDENTIALS.password);
    await loginPage.expectError();

    // Modify the email field
    await loginPage.emailInput.fill('changed@example.com');

    // Error should be cleared
    await loginPage.expectNoError();
  });

  test('should clear error when user modifies password field', async () => {
    // Trigger an error first
    await loginPage.login(INVALID_CREDENTIALS.email, INVALID_CREDENTIALS.password);
    await loginPage.expectError();

    // Modify the password field
    await loginPage.passwordInput.fill('newpassword');

    // Error should be cleared
    await loginPage.expectNoError();
  });

  test('should redirect already-authenticated user from /login to /products', async ({ page }) => {
    // First, log in successfully
    await loginPage.login(ADMIN.email, ADMIN.password);
    await loginPage.expectRedirectToProducts();

    // Now navigate back to /login
    await page.goto('/login');

    // Should be redirected to /products
    await page.waitForURL('**/products', { timeout: 10_000 });
    expect(page.url()).toContain('/products');
  });

  test('should have required attribute on email field', async () => {
    await expect(loginPage.emailInput).toHaveAttribute('required', '');
  });

  test('should have required attribute on password field', async () => {
    await expect(loginPage.passwordInput).toHaveAttribute('required', '');
  });

  test('should handle server error (500) gracefully', async ({ page }) => {
    // Mock the login API to return a 500 error
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Internal Server Error' }),
      });
    });

    await loginPage.login(ADMIN.email, ADMIN.password);

    // Should show a user-friendly error message (not a crash)
    await loginPage.expectError();
    await expect(loginPage.errorMessage).toBeVisible();
  });

  test('should handle network error gracefully', async ({ page }) => {
    // Mock the login API to abort the request (simulate network failure)
    await page.route('**/api/auth/login', async (route) => {
      await route.abort('connectionrefused');
    });

    await loginPage.login(ADMIN.email, ADMIN.password);

    // Should show a connection error message
    await loginPage.expectError();
    await expect(loginPage.errorMessage).toBeVisible();
  });

  test('should submit form via Enter key in password field', async ({ page }) => {
    // Fill email
    await loginPage.emailInput.fill(ADMIN.email);

    // Fill password and press Enter instead of clicking the button
    await loginPage.passwordInput.fill(ADMIN.password);
    await loginPage.passwordInput.press('Enter');

    // Should successfully login and redirect to /products
    await page.waitForURL('**/products', { timeout: 10_000 });
    expect(page.url()).toContain('/products');
  });
});
