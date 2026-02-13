/**
 * Admin edit tests — verifies editing existing users via the admin management page.
 */
import { test, expect } from '@playwright/test';
import { loginViaAPI } from '../../helpers/auth.helper';
import { createTestAdmin, deleteTestAdmin, cleanupTestAdmins } from '../../helpers/admin.helper';
import { AdminsPagePO } from '../../page-objects/AdminsPage.po';
import { AdminFormDialogPO } from '../../page-objects/AdminFormDialogPO.po';
import { ToastPO } from '../../page-objects/ToastPO.po';

test.describe('Admin Edit', () => {
  const testEmailPrefix = 'e2e-edit-';
  let testAdminId: string;
  let testAdminEmail: string;

  test.beforeAll(async () => {
    const timestamp = Date.now();
    testAdminEmail = `${testEmailPrefix}${timestamp}@example.com`;
    const admin = await createTestAdmin({
      email: testAdminEmail,
      name: `Edit Test User ${timestamp}`,
      role: 'editor',
    });
    testAdminId = admin.id;
  });

  test.afterAll(async () => {
    await cleanupTestAdmins(testEmailPrefix);
  });

  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page);
  });

  test('opens edit dialog with pre-filled data', async ({ page }) => {
    const adminsPage = new AdminsPagePO(page);
    const formDialog = new AdminFormDialogPO(page);

    await adminsPage.goto();
    await adminsPage.expectVisible();

    // Wait for table to load
    await expect(adminsPage.tableRow(0)).toBeVisible({ timeout: 10_000 });

    // Find the test admin row by email
    const rows = page.locator('[data-testid^="admins-table-row-email-"]');
    const count = await rows.count();
    let targetIndex = -1;

    for (let i = 0; i < count; i++) {
      const email = await adminsPage.tableRowEmail(i).textContent();
      if (email === testAdminEmail) {
        targetIndex = i;
        break;
      }
    }

    expect(targetIndex).toBeGreaterThanOrEqual(0);
    await adminsPage.clickEditAdmin(targetIndex);
    await formDialog.expectOpen();

    // In edit mode, email input should NOT be visible
    await expect(formDialog.emailInput).not.toBeVisible();
    // Password input should NOT be visible
    await expect(formDialog.passwordInput).not.toBeVisible();

    // Name should be pre-filled
    await expect(formDialog.nameInput).not.toBeEmpty();
    // Role should be pre-filled
    await expect(formDialog.roleSelect).toHaveValue('editor');

    // Dialog title should indicate editing
    await expect(formDialog.dialog).toContainText('Edytuj użytkownika');
  });

  test('can update user name', async ({ page }) => {
    const adminsPage = new AdminsPagePO(page);
    const formDialog = new AdminFormDialogPO(page);
    const toast = new ToastPO(page);

    await adminsPage.goto();
    await adminsPage.expectVisible();
    await expect(adminsPage.tableRow(0)).toBeVisible({ timeout: 10_000 });

    // Find the test admin row
    const rows = page.locator('[data-testid^="admins-table-row-email-"]');
    const count = await rows.count();
    let targetIndex = -1;

    for (let i = 0; i < count; i++) {
      const email = await adminsPage.tableRowEmail(i).textContent();
      if (email === testAdminEmail) {
        targetIndex = i;
        break;
      }
    }

    expect(targetIndex).toBeGreaterThanOrEqual(0);
    await adminsPage.clickEditAdmin(targetIndex);
    await formDialog.expectOpen();

    const newName = `Updated Name ${Date.now()}`;
    await formDialog.fillName(newName);

    const responsePromise = page.waitForResponse(
      (res) =>
        res.url().includes('/api/admins/') &&
        res.request().method() === 'PUT' &&
        res.status() === 200
    );
    await formDialog.submit();
    await responsePromise;

    await formDialog.expectClosed();
    await toast.expectToast('Użytkownik zaktualizowany');

    // The updated name should appear in the table
    await expect(page.getByText(newName)).toBeVisible({ timeout: 5000 });
  });

  test('can change user role from editor to admin', async ({ page }) => {
    // Create a separate admin for this test
    const timestamp = Date.now();
    const email = `${testEmailPrefix}role-${timestamp}@example.com`;
    const admin = await createTestAdmin({
      email,
      name: `Role Test ${timestamp}`,
      role: 'editor',
    });

    const adminsPage = new AdminsPagePO(page);
    const formDialog = new AdminFormDialogPO(page);
    const toast = new ToastPO(page);

    await adminsPage.goto();
    await adminsPage.expectVisible();
    await expect(adminsPage.tableRow(0)).toBeVisible({ timeout: 10_000 });

    // Find the created admin
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

    // Verify current role is Redaktor
    await expect(adminsPage.tableRowRole(targetIndex)).toContainText('Redaktor');

    await adminsPage.clickEditAdmin(targetIndex);
    await formDialog.expectOpen();

    await formDialog.selectRole('admin');

    const responsePromise = page.waitForResponse(
      (res) =>
        res.url().includes('/api/admins/') &&
        res.request().method() === 'PUT' &&
        res.status() === 200
    );
    await formDialog.submit();
    await responsePromise;

    await formDialog.expectClosed();
    await toast.expectToast('Użytkownik zaktualizowany');

    // Role badge should now show Administrator
    await expect(adminsPage.tableRowRole(targetIndex)).toContainText('Administrator');

    // Clean up
    await deleteTestAdmin(admin.id).catch(() => {});
  });
});
