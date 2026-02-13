/**
 * Admin delete tests — verifies deleting users via the admin management page.
 */
import { test, expect } from '@playwright/test';
import { loginViaAPI } from '../../helpers/auth.helper';
import { createTestAdmin, cleanupTestAdmins } from '../../helpers/admin.helper';
import { AdminsPagePO } from '../../page-objects/AdminsPage.po';
import { DeleteAdminDialogPO } from '../../page-objects/DeleteAdminDialogPO.po';
import { ToastPO } from '../../page-objects/ToastPO.po';

test.describe('Admin Delete', () => {
  const testEmailPrefix = 'e2e-delete-';

  test.afterAll(async () => {
    await cleanupTestAdmins(testEmailPrefix);
  });

  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page);
  });

  test('opens delete confirmation dialog', async ({ page }) => {
    const timestamp = Date.now();
    const email = `${testEmailPrefix}${timestamp}@example.com`;
    const name = `Delete Test ${timestamp}`;
    await createTestAdmin({ email, name, role: 'editor' });

    const adminsPage = new AdminsPagePO(page);
    const deleteDialog = new DeleteAdminDialogPO(page);

    await adminsPage.goto();
    await adminsPage.expectVisible();
    await expect(adminsPage.tableRow(0)).toBeVisible({ timeout: 10_000 });

    // Find the test admin row
    const rows = page.locator('[data-testid^="admins-table-row-email-"]');
    const count = await rows.count();
    let targetIndex = -1;

    for (let i = 0; i < count; i++) {
      const emailText = await adminsPage.tableRowEmail(i).textContent();
      if (emailText === email) {
        targetIndex = i;
        break;
      }
    }

    expect(targetIndex).toBeGreaterThanOrEqual(0);
    await adminsPage.clickDeleteAdmin(targetIndex);

    await deleteDialog.expectOpen();
    await deleteDialog.expectContainsText(name);
    await deleteDialog.expectContainsText('nieodwracalna');
  });

  test('can cancel deletion', async ({ page }) => {
    const timestamp = Date.now();
    const email = `${testEmailPrefix}cancel-${timestamp}@example.com`;
    await createTestAdmin({ email, name: `Cancel Delete ${timestamp}`, role: 'editor' });

    const adminsPage = new AdminsPagePO(page);
    const deleteDialog = new DeleteAdminDialogPO(page);

    await adminsPage.goto();
    await adminsPage.expectVisible();
    await expect(adminsPage.tableRow(0)).toBeVisible({ timeout: 10_000 });

    // Find the test admin row
    const rows = page.locator('[data-testid^="admins-table-row-email-"]');
    const count = await rows.count();
    let targetIndex = -1;

    for (let i = 0; i < count; i++) {
      const emailText = await adminsPage.tableRowEmail(i).textContent();
      if (emailText === email) {
        targetIndex = i;
        break;
      }
    }

    expect(targetIndex).toBeGreaterThanOrEqual(0);
    await adminsPage.clickDeleteAdmin(targetIndex);
    await deleteDialog.expectOpen();
    await deleteDialog.cancel();

    // Dialog should close, user should still be in the list
    await expect(deleteDialog.dialog).not.toBeVisible();
    await expect(page.getByText(email)).toBeVisible();
  });

  test('can delete a user', async ({ page }) => {
    const timestamp = Date.now();
    const email = `${testEmailPrefix}confirm-${timestamp}@example.com`;
    await createTestAdmin({ email, name: `Confirm Delete ${timestamp}`, role: 'editor' });

    const adminsPage = new AdminsPagePO(page);
    const deleteDialog = new DeleteAdminDialogPO(page);
    const toast = new ToastPO(page);

    await adminsPage.goto();
    await adminsPage.expectVisible();
    await expect(adminsPage.tableRow(0)).toBeVisible({ timeout: 10_000 });

    // Find the test admin row
    const rows = page.locator('[data-testid^="admins-table-row-email-"]');
    const count = await rows.count();
    let targetIndex = -1;

    for (let i = 0; i < count; i++) {
      const emailText = await adminsPage.tableRowEmail(i).textContent();
      if (emailText === email) {
        targetIndex = i;
        break;
      }
    }

    expect(targetIndex).toBeGreaterThanOrEqual(0);
    await adminsPage.clickDeleteAdmin(targetIndex);
    await deleteDialog.expectOpen();

    const responsePromise = page.waitForResponse(
      (res) =>
        res.url().includes('/api/admins/') &&
        res.request().method() === 'DELETE' &&
        res.status() === 200
    );
    await deleteDialog.confirm();
    await responsePromise;

    await toast.expectToast('Użytkownik usunięty');

    // User should no longer be in the list
    await expect(page.getByText(email)).not.toBeVisible({ timeout: 5000 });
  });

  test('deleted user cannot log in', async ({ page }) => {
    const timestamp = Date.now();
    const email = `${testEmailPrefix}login-${timestamp}@example.com`;
    const password = 'testpass123!@#';
    await createTestAdmin({ email, password, name: `Login Delete ${timestamp}`, role: 'editor' });

    const adminsPage = new AdminsPagePO(page);
    const deleteDialog = new DeleteAdminDialogPO(page);

    await adminsPage.goto();
    await adminsPage.expectVisible();
    await expect(adminsPage.tableRow(0)).toBeVisible({ timeout: 10_000 });

    // Find and delete the test admin
    const rows = page.locator('[data-testid^="admins-table-row-email-"]');
    const count = await rows.count();
    let targetIndex = -1;

    for (let i = 0; i < count; i++) {
      const emailText = await adminsPage.tableRowEmail(i).textContent();
      if (emailText === email) {
        targetIndex = i;
        break;
      }
    }

    expect(targetIndex).toBeGreaterThanOrEqual(0);
    await adminsPage.clickDeleteAdmin(targetIndex);
    await deleteDialog.expectOpen();

    const responsePromise = page.waitForResponse(
      (res) =>
        res.url().includes('/api/admins/') &&
        res.request().method() === 'DELETE' &&
        res.status() === 200
    );
    await deleteDialog.confirm();
    await responsePromise;

    // Now log out and try to log in as the deleted user
    await page.getByTestId('sidebar-logout-button').click();
    await page.waitForURL('**/login', { timeout: 10_000 });

    await page.getByTestId('login-email-input').fill(email);
    await page.getByTestId('login-password-input').fill(password);
    await page.getByTestId('login-submit-button').click();

    // Should show login error
    await expect(page.getByTestId('login-error-message')).toBeVisible({ timeout: 5000 });
  });
});
