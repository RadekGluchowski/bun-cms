/**
 * Admin create tests — verifies creating new users via the admin management page.
 */
import { test, expect } from '@playwright/test';
import { loginViaAPI } from '../../helpers/auth.helper';
import { cleanupTestAdmins } from '../../helpers/admin.helper';
import { AdminsPagePO } from '../../page-objects/AdminsPage.po';
import { AdminFormDialogPO } from '../../page-objects/AdminFormDialogPO.po';
import { ToastPO } from '../../page-objects/ToastPO.po';

test.describe('Admin Create', () => {
  const testEmailPrefix = 'e2e-create-';

  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page);
  });

  test.afterAll(async () => {
    await cleanupTestAdmins(testEmailPrefix);
  });

  test('opens create dialog when clicking add button', async ({ page }) => {
    const adminsPage = new AdminsPagePO(page);
    const formDialog = new AdminFormDialogPO(page);

    await adminsPage.goto();
    await adminsPage.expectVisible();
    await adminsPage.clickAdd();

    await formDialog.expectOpen();

    // Email and password inputs should be visible for new user
    await expect(formDialog.emailInput).toBeVisible();
    await expect(formDialog.passwordInput).toBeVisible();
    await expect(formDialog.nameInput).toBeVisible();
    await expect(formDialog.roleSelect).toBeVisible();

    // Dialog title should be for creating
    await expect(formDialog.dialog).toContainText('Dodaj użytkownika');
  });

  test('submit button disabled when form is empty', async ({ page }) => {
    const adminsPage = new AdminsPagePO(page);
    const formDialog = new AdminFormDialogPO(page);

    await adminsPage.goto();
    await adminsPage.expectVisible();
    await adminsPage.clickAdd();
    await formDialog.expectOpen();

    await formDialog.expectSubmitDisabled();
  });

  test('can create a new editor user', async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = `${testEmailPrefix}${timestamp}@example.com`;
    const testName = `Test Editor ${timestamp}`;

    const adminsPage = new AdminsPagePO(page);
    const formDialog = new AdminFormDialogPO(page);
    const toast = new ToastPO(page);

    await adminsPage.goto();
    await adminsPage.expectVisible();
    await adminsPage.clickAdd();
    await formDialog.expectOpen();

    await formDialog.fillEmail(testEmail);
    await formDialog.fillPassword('testpass123!@#');
    await formDialog.fillName(testName);
    await formDialog.selectRole('editor');

    // Set up response listener before clicking
    const responsePromise = page.waitForResponse(
      (res) =>
        res.url().includes('/api/admins') &&
        res.request().method() === 'POST' &&
        (res.status() === 200 || res.status() === 201)
    );

    await formDialog.submit();
    await responsePromise;

    await formDialog.expectClosed();
    await toast.expectToast('Użytkownik utworzony');

    // The new user should appear in the table
    await expect(page.getByText(testEmail)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(testName)).toBeVisible();
  });

  test('can create a new admin user', async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = `${testEmailPrefix}admin-${timestamp}@example.com`;
    const testName = `Test Admin ${timestamp}`;

    const adminsPage = new AdminsPagePO(page);
    const formDialog = new AdminFormDialogPO(page);
    const toast = new ToastPO(page);

    await adminsPage.goto();
    await adminsPage.expectVisible();
    await adminsPage.clickAdd();
    await formDialog.expectOpen();

    await formDialog.fillEmail(testEmail);
    await formDialog.fillPassword('testpass123!@#');
    await formDialog.fillName(testName);
    await formDialog.selectRole('admin');

    const responsePromise = page.waitForResponse(
      (res) =>
        res.url().includes('/api/admins') &&
        res.request().method() === 'POST' &&
        (res.status() === 200 || res.status() === 201)
    );

    await formDialog.submit();
    await responsePromise;

    await formDialog.expectClosed();
    await toast.expectToast('Użytkownik utworzony');

    // Verify the admin badge
    await expect(page.getByText(testEmail)).toBeVisible({ timeout: 5000 });
  });

  test('shows error when creating user with duplicate email', async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = `${testEmailPrefix}dup-${timestamp}@example.com`;

    const adminsPage = new AdminsPagePO(page);
    const formDialog = new AdminFormDialogPO(page);
    const toast = new ToastPO(page);

    await adminsPage.goto();
    await adminsPage.expectVisible();

    // Create first user
    await adminsPage.clickAdd();
    await formDialog.expectOpen();
    await formDialog.fillEmail(testEmail);
    await formDialog.fillPassword('testpass123!@#');
    await formDialog.fillName('Duplicate Test');
    await formDialog.selectRole('editor');

    const firstResponse = page.waitForResponse(
      (res) => res.url().includes('/api/admins') && res.request().method() === 'POST'
    );
    await formDialog.submit();
    await firstResponse;
    await formDialog.expectClosed();
    await toast.expectToast('Użytkownik utworzony');

    // Try to create another user with the same email
    await adminsPage.clickAdd();
    await formDialog.expectOpen();
    await formDialog.fillEmail(testEmail);
    await formDialog.fillPassword('testpass123!@#');
    await formDialog.fillName('Duplicate Test 2');
    await formDialog.selectRole('editor');

    const secondResponse = page.waitForResponse(
      (res) => res.url().includes('/api/admins') && res.request().method() === 'POST'
    );
    await formDialog.submit();
    await secondResponse;

    // Should show error toast
    await toast.expectToast('Błąd operacji');
  });

  test('role select defaults to editor', async ({ page }) => {
    const adminsPage = new AdminsPagePO(page);
    const formDialog = new AdminFormDialogPO(page);

    await adminsPage.goto();
    await adminsPage.expectVisible();
    await adminsPage.clickAdd();
    await formDialog.expectOpen();

    await expect(formDialog.roleSelect).toHaveValue('editor');
  });
});
