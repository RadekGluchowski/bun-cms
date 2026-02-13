/**
 * Editor role restrictions — verifies editors cannot access admin-only features.
 *
 * Tests cover:
 * - Editor can log in and see products
 * - Editor cannot see "Użytkownicy" nav in sidebar
 * - Editor cannot access /admins route (redirected to /products)
 * - Editor cannot see publish button on ConfigEditorPage
 * - Editor cannot see rollback button on HistoryPage
 * - Editor cannot see delete button on ProductsListPage
 * - Editor gets 403 from admin-only API endpoints
 */
import { test, expect } from '@playwright/test';
import { loginAsEditorViaAPI, loginViaAPI } from '../../helpers/auth.helper';
import { createTestProduct, deleteTestProduct } from '../../helpers/product.helper';
import { saveConfigDraft, publishConfig } from '../../helpers/config.helper';
import { SidebarPO } from '../../page-objects/Sidebar.po';
import { ProductsListPage } from '../../page-objects/ProductsListPage.po';
import { ConfigEditorPage } from '../../page-objects/ConfigEditorPage.po';
import { HistoryPage } from '../../page-objects/HistoryPage.po';
import { ApiHelper } from '../../helpers/api.helper';
import { EDITOR, TEST_CONFIG_DOCUMENT } from '../../fixtures/test-data';

const api = new ApiHelper();

test.describe('Editor Role Restrictions', () => {
  let productId: string;
  const CONFIG_TYPE = 'general';

  test.beforeAll(async () => {
    // Create a product with a published config so we can test publish/rollback visibility
    const product = await createTestProduct({ code: `EDITOR-TEST-${Date.now()}` });
    productId = product.id;
    await saveConfigDraft(productId, CONFIG_TYPE, TEST_CONFIG_DOCUMENT);
    await publishConfig(productId, CONFIG_TYPE);
    // Create another draft after publish for rollback testing
    await saveConfigDraft(productId, CONFIG_TYPE, {
      ...TEST_CONFIG_DOCUMENT,
      meta: { ...TEST_CONFIG_DOCUMENT.meta, title: 'Updated Draft' },
    });
  });

  test.afterAll(async () => {
    if (productId) {
      await deleteTestProduct(productId).catch(() => {});
    }
  });

  test.describe('UI visibility as editor', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsEditorViaAPI(page);
    });

    test('editor can log in and see products list', async ({ page }) => {
      const productsPage = new ProductsListPage(page);
      await productsPage.expectVisible();
      await productsPage.expectTableVisible();
    });

    test('editor cannot see "Użytkownicy" nav item in sidebar', async ({ page }) => {
      const sidebar = new SidebarPO(page);
      await sidebar.expectVisible();
      await sidebar.expectAdminsNavHidden();
    });

    test('editor is redirected from /admins to /products', async ({ page }) => {
      await page.goto('/admins');
      await page.waitForURL('**/products', { timeout: 10_000 });
      const productsPage = new ProductsListPage(page);
      await productsPage.expectVisible();
    });

    test('editor cannot see delete button on products list', async ({ page }) => {
      const productsPage = new ProductsListPage(page);
      await productsPage.expectTableVisible();

      // The delete button should not be rendered for editors
      await expect(productsPage.tableRowDeleteButton(0)).not.toBeVisible();
    });

    test('editor cannot see publish button on config editor', async ({ page }) => {
      const configEditor = new ConfigEditorPage(page);
      await configEditor.goto(productId, CONFIG_TYPE);
      await expect(configEditor.metaTitleInput).toBeVisible({ timeout: 10_000 });

      // Publish button should not be visible for editors
      await expect(configEditor.publishButton).not.toBeVisible();

      // Save button should still be visible
      await expect(configEditor.saveButton).toBeVisible();
    });

    test('editor can save a config draft', async ({ page }) => {
      const configEditor = new ConfigEditorPage(page);
      await configEditor.goto(productId, CONFIG_TYPE);
      await expect(configEditor.metaTitleInput).toBeVisible({ timeout: 10_000 });

      // Modify meta title
      await configEditor.fillMetaTitle('Editor Draft Test');

      // Save should work
      const savePromise = page.waitForResponse(
        (res) =>
          res.url().includes(`/configs/${CONFIG_TYPE}`) &&
          res.request().method() === 'PUT' &&
          res.status() === 200
      );
      await configEditor.clickSave();
      await savePromise;
    });

    test('editor cannot see rollback button on history page', async ({ page }) => {
      const historyPage = new HistoryPage(page);
      await historyPage.goto(productId);
      await historyPage.expectVisible();

      // Wait for entries to load
      const entries = page.locator('[data-testid^="history-entry-"]').filter({
        has: page.locator('[data-testid^="history-entry-time-"]'),
      });
      await expect(entries.first()).toBeVisible({ timeout: 15_000 });

      // Get history entry IDs from API
      const { history } = await api.getHistory(productId);
      expect(history.length).toBeGreaterThan(0);

      // Rollback button should not be visible for any entry
      for (const entry of history) {
        await expect(historyPage.entryRollbackButton(entry.id)).not.toBeVisible();
      }

      // Preview button should still be visible
      await expect(historyPage.entryPreviewButton(history[0].id)).toBeVisible();
    });
  });

  test.describe('API restrictions as editor', () => {
    let editorToken: string;

    test.beforeAll(async () => {
      const result = await api.loginAs(EDITOR.email, EDITOR.password);
      editorToken = result.token;
    });

    test('editor gets 403 when trying to publish config', async () => {
      const result = await api.rawRequest(
        'POST',
        `/api/products/${productId}/configs/${CONFIG_TYPE}/publish`,
        undefined,
        editorToken
      );
      expect(result.status).toBe(403);
    });

    test('editor gets 403 when trying to rollback config', async () => {
      const { history } = await api.getConfigHistory(productId, CONFIG_TYPE);
      const rollbackTarget = history.find((e) => e.action === 'publish') ?? history[0];

      const result = await api.rawRequest(
        'POST',
        `/api/products/${productId}/configs/${CONFIG_TYPE}/rollback/${rollbackTarget.id}`,
        undefined,
        editorToken
      );
      expect(result.status).toBe(403);
    });

    test('editor gets 403 when trying to delete product', async () => {
      const result = await api.rawRequest(
        'DELETE',
        `/api/products/${productId}`,
        undefined,
        editorToken
      );
      expect(result.status).toBe(403);
    });

    test('editor gets 403 when trying to import product', async () => {
      const result = await api.rawRequest(
        'PUT',
        `/api/products/${productId}/import`,
        { product: {}, configs: [] },
        editorToken
      );
      expect(result.status).toBe(403);
    });

    test('editor gets 403 when trying to list admins', async () => {
      const result = await api.rawRequest('GET', '/api/admins', undefined, editorToken);
      expect(result.status).toBe(403);
    });

    test('editor gets 403 when trying to create admin', async () => {
      const result = await api.rawRequest(
        'POST',
        '/api/admins',
        { email: 'hacker@test.com', password: 'hack123!@#', name: 'Hacker', role: 'admin' },
        editorToken
      );
      expect(result.status).toBe(403);
    });

    test('editor can save config draft via API', async () => {
      const result = await api.rawRequest(
        'PUT',
        `/api/products/${productId}/configs/${CONFIG_TYPE}`,
        { data: TEST_CONFIG_DOCUMENT },
        editorToken
      );
      expect(result.status).toBe(200);
    });

    test('editor can create product via API', async () => {
      const result = await api.rawRequest(
        'POST',
        '/api/products',
        { code: `EDITOR-API-${Date.now()}`, name: 'Editor Created Product' },
        editorToken
      );
      expect(result.status).toBe(200);

      // Clean up
      const body = result.body as { id: string };
      if (body?.id) {
        await api.deleteProduct(body.id).catch(() => {});
      }
    });

    test('editor can read products and configs via API', async () => {
      const listResult = await api.rawRequest('GET', '/api/products', undefined, editorToken);
      expect(listResult.status).toBe(200);

      const detailResult = await api.rawRequest(
        'GET',
        `/api/products/${productId}`,
        undefined,
        editorToken
      );
      expect(detailResult.status).toBe(200);

      const configResult = await api.rawRequest(
        'GET',
        `/api/products/${productId}/configs/${CONFIG_TYPE}`,
        undefined,
        editorToken
      );
      expect(configResult.status).toBe(200);
    });
  });

  test.describe('Admin sees full UI', () => {
    test.beforeEach(async ({ page }) => {
      await loginViaAPI(page);
    });

    test('admin can see "Użytkownicy" nav item in sidebar', async ({ page }) => {
      const sidebar = new SidebarPO(page);
      await sidebar.expectVisible();
      await sidebar.expectAdminsNavVisible();
    });

    test('admin can see delete button on products list', async ({ page }) => {
      const productsPage = new ProductsListPage(page);
      await productsPage.expectTableVisible();
      await expect(productsPage.tableRowDeleteButton(0)).toBeVisible();
    });

    test('admin can see publish button on config editor', async ({ page }) => {
      const configEditor = new ConfigEditorPage(page);
      await configEditor.goto(productId, CONFIG_TYPE);
      await expect(configEditor.metaTitleInput).toBeVisible({ timeout: 10_000 });
      await expect(configEditor.publishButton).toBeVisible();
    });

    test('admin can see rollback button on history page', async ({ page }) => {
      const historyPage = new HistoryPage(page);
      await historyPage.goto(productId);
      await historyPage.expectVisible();

      const entries = page.locator('[data-testid^="history-entry-"]').filter({
        has: page.locator('[data-testid^="history-entry-time-"]'),
      });
      await expect(entries.first()).toBeVisible({ timeout: 15_000 });

      const { history } = await api.getHistory(productId);
      // Find a non-current entry (rollback button should be visible)
      const nonCurrentEntry = history.find((_e, i) => i > 0);
      if (nonCurrentEntry) {
        await expect(historyPage.entryRollbackButton(nonCurrentEntry.id)).toBeVisible();
      }
    });
  });
});
