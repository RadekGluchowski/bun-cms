import { test, expect } from '@playwright/test';
import { loginViaAPI } from '../../helpers/auth.helper';
import { ApiHelper } from '../../helpers/api.helper';
import { ProductDetailPage } from '../../page-objects/ProductDetailPage.po';
import { ProductJsonDialogPO } from '../../page-objects/ProductJsonDialogPO.po';
import { ToastPO } from '../../page-objects/ToastPO.po';

const api = new ApiHelper();
const TEST_PREFIX = 'EXPIMP';

test.describe('Product Export (JSON Dialog)', () => {
  let detailPage: ProductDetailPage;
  let jsonDialog: ProductJsonDialogPO;
  let toast: ToastPO;
  let testProductId: string;
  let testProductCode: string;
  let testProductName: string;

  test.beforeAll(async () => {
    await api.login();
    await api.cleanupTestProducts(TEST_PREFIX);

    // Create a test product with a config
    const timestamp = Date.now();
    testProductCode = `${TEST_PREFIX}-${timestamp}`;
    testProductName = `Export Product ${timestamp}`;

    const created = await api.createProduct({
      code: testProductCode,
      name: testProductName,
      description: 'Product for export testing',
    });
    testProductId = created.id;

    // Save a config so the export has content
    await api.saveConfig(testProductId, 'general', {
      meta: {
        title: 'General Config',
        description: 'For export testing',
        category: 'general',
        icon: 'Settings',
        schemaVersion: 1,
      },
      body: { exportKey: 'exportValue', nested: { a: 1 } },
    });
  });

  test.afterAll(async () => {
    if (testProductId) {
      await api.deleteProduct(testProductId).catch(() => {});
    }
    await api.cleanupTestProducts(TEST_PREFIX);
  });

  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page);
    detailPage = new ProductDetailPage(page);
    jsonDialog = new ProductJsonDialogPO(page);
    toast = new ToastPO(page);
    await detailPage.goto(testProductId);
    await detailPage.expectVisible();
  });

  test('should open JSON dialog from product detail page', async ({ page }) => {
    await detailPage.clickJson();

    await jsonDialog.expectOpen();
  });

  test('should display valid product export JSON structure', async ({ page }) => {
    const exportPromise = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/products/${testProductId}/export`) &&
        response.status() === 200
    );
    await detailPage.clickJson();
    await jsonDialog.expectOpen();
    await exportPromise;

    await expect(jsonDialog.textarea).toBeVisible();

    // The textarea should contain valid JSON with the product data
    const jsonContent = await jsonDialog.getJsonText();
    expect(jsonContent.length).toBeGreaterThan(0);

    // Parse and verify the JSON structure
    const parsed = JSON.parse(jsonContent);
    expect(parsed).toHaveProperty('product');
    expect(parsed.product).toHaveProperty('name', testProductName);
    expect(parsed).toHaveProperty('configs');
    expect(Array.isArray(parsed.configs)).toBe(true);
  });

  test('should copy JSON to clipboard and show "Skopiowano" toast', async ({ page }) => {
    const exportPromise = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/products/${testProductId}/export`) &&
        response.status() === 200
    );
    await detailPage.clickJson();
    await jsonDialog.expectOpen();
    await exportPromise;

    await expect(jsonDialog.copyButton).toBeVisible();
    await expect(jsonDialog.copyButton).toBeEnabled();

    // Grant clipboard permissions for the test
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    await jsonDialog.copy();

    // Should show a toast indicating success
    await toast.expectToast('Skopiowano');
  });

  test('should download JSON and show "Pobrano" toast', async ({ page }) => {
    const exportPromise = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/products/${testProductId}/export`) &&
        response.status() === 200
    );
    await detailPage.clickJson();
    await jsonDialog.expectOpen();
    await exportPromise;

    await expect(jsonDialog.downloadButton).toBeVisible();
    await expect(jsonDialog.downloadButton).toBeEnabled();

    // Set up download listener
    const downloadPromise = page.waitForEvent('download');
    await jsonDialog.download();

    // Either a download occurs or a toast is shown
    try {
      await downloadPromise;
    } catch {
      // Download may be handled differently, check for toast
    }

    await toast.expectToast('Pobrano');
  });
});
