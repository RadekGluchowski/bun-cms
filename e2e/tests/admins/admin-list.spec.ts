/**
 * Admin list page tests — verifies the admin management page displays correctly.
 */
import { test, expect } from '@playwright/test';
import { loginViaAPI } from '../../helpers/auth.helper';
import { AdminsPagePO } from '../../page-objects/AdminsPage.po';
import { SidebarPO } from '../../page-objects/Sidebar.po';
import { ADMIN, EDITOR } from '../../fixtures/test-data';

test.describe('Admin List Page', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page);
  });

  test('can navigate to admins page via sidebar', async ({ page }) => {
    const sidebar = new SidebarPO(page);
    await sidebar.expectAdminsNavVisible();
    await sidebar.clickAdmins();
    await page.waitForURL('**/admins');

    const adminsPage = new AdminsPagePO(page);
    await adminsPage.expectVisible();
  });

  test('displays page title and add button', async ({ page }) => {
    const adminsPage = new AdminsPagePO(page);
    await adminsPage.goto();
    await adminsPage.expectVisible();
    await expect(adminsPage.addButton).toBeVisible();
    await expect(adminsPage.addButton).toContainText('Dodaj użytkownika');
  });

  test('displays at least two users (admin and editor from seed)', async ({ page }) => {
    const adminsPage = new AdminsPagePO(page);
    await adminsPage.goto();
    await adminsPage.expectVisible();

    // Wait for table to load
    await expect(adminsPage.tableRow(0)).toBeVisible({ timeout: 10_000 });
    await expect(adminsPage.tableRow(1)).toBeVisible();
  });

  test('displays correct user information in table', async ({ page }) => {
    const adminsPage = new AdminsPagePO(page);
    await adminsPage.goto();
    await adminsPage.expectVisible();
    await expect(adminsPage.tableRow(0)).toBeVisible({ timeout: 10_000 });

    // Find the admin row — check all visible rows for admin email
    const rows = page.locator('[data-testid^="admins-table-row-email-"]');
    const count = await rows.count();

    let adminFound = false;
    let editorFound = false;

    for (let i = 0; i < count; i++) {
      const email = await adminsPage.tableRowEmail(i).textContent();
      const role = await adminsPage.tableRowRole(i).textContent();

      if (email === ADMIN.email) {
        adminFound = true;
        expect(role).toContain('Administrator');
      }
      if (email === EDITOR.email) {
        editorFound = true;
        expect(role).toContain('Redaktor');
      }
    }

    expect(adminFound).toBe(true);
    expect(editorFound).toBe(true);
  });

  test('does not show delete button for current user', async ({ page }) => {
    const adminsPage = new AdminsPagePO(page);
    await adminsPage.goto();
    await adminsPage.expectVisible();
    await expect(adminsPage.tableRow(0)).toBeVisible({ timeout: 10_000 });

    // Find the row for the current admin
    const rows = page.locator('[data-testid^="admins-table-row-email-"]');
    const count = await rows.count();

    for (let i = 0; i < count; i++) {
      const email = await adminsPage.tableRowEmail(i).textContent();
      if (email === ADMIN.email) {
        // Delete button should not be visible for the current user
        await expect(adminsPage.tableRowDeleteButton(i)).not.toBeVisible();
        // Edit button should still be visible
        await expect(adminsPage.tableRowEditButton(i)).toBeVisible();
      }
    }
  });

  test('shows edit button for all users', async ({ page }) => {
    const adminsPage = new AdminsPagePO(page);
    await adminsPage.goto();
    await adminsPage.expectVisible();
    await expect(adminsPage.tableRow(0)).toBeVisible({ timeout: 10_000 });

    await expect(adminsPage.tableRowEditButton(0)).toBeVisible();
    await expect(adminsPage.tableRowEditButton(1)).toBeVisible();
  });
});
