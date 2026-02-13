import { test, expect } from '@playwright/test';
import { loginViaAPI } from '../../helpers/auth.helper';
import { ApiHelper } from '../../helpers/api.helper';
import { ProductDetailPage } from '../../page-objects/ProductDetailPage.po';
import { ProductFormDialogPO } from '../../page-objects/ProductFormDialogPO.po';
import { ProductJsonDialogPO } from '../../page-objects/ProductJsonDialogPO.po';
import { BreadcrumbsPO } from '../../page-objects/BreadcrumbsPO.po';

const api = new ApiHelper();
const TEST_PREFIX = 'DTL';

test.describe('Product Detail Page', () => {
  let detailPage: ProductDetailPage;
  let testProductId: string;
  let testProductCode: string;
  let testProductName: string;

  test.beforeAll(async () => {
    await api.login();
    await api.cleanupTestProducts(TEST_PREFIX);

    // Create a test product with known data
    const timestamp = Date.now();
    testProductCode = `${TEST_PREFIX}-${timestamp}`;
    testProductName = `Detail Test Product ${timestamp}`;

    const created = await api.createProduct({
      code: testProductCode,
      name: testProductName,
      description: 'A detailed description for testing',
      previewUrl: 'https://preview.example.com/detail-test',
    });
    testProductId = created.id;

    // Create a config draft so the configs section has content
    await api.saveConfig(testProductId, 'general', {
      meta: {
        title: 'General Config',
        description: 'General configuration',
        category: 'general',
        icon: 'Settings',
        schemaVersion: 1,
      },
      body: { key: 'value' },
    });

    // Publish the config so we can see a published badge
    await api.publishConfig(testProductId, 'general');

    // Save another draft on top
    await api.saveConfig(testProductId, 'general', {
      meta: {
        title: 'General Config v2',
        description: 'Updated general configuration',
        category: 'general',
        icon: 'Settings',
        schemaVersion: 1,
      },
      body: { key: 'updated-value' },
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
    await detailPage.goto(testProductId);
    await detailPage.expectVisible();
  });

  test('should display breadcrumbs', async ({ page }) => {
    const breadcrumbs = new BreadcrumbsPO(page);
    await breadcrumbs.expectVisible();
  });

  test('should display product name as page title', async () => {
    await expect(detailPage.title).toBeVisible();
    await expect(detailPage.title).toHaveText(testProductName);
  });

  test('should display product code', async () => {
    await expect(detailPage.code).toBeVisible();
    await expect(detailPage.code).toHaveText(testProductCode);
  });

  test('should display "Historia", "JSON", "Edytuj" buttons', async () => {
    await expect(detailPage.historyButton).toBeVisible();
    await expect(detailPage.historyButton).toContainText('Historia');

    await expect(detailPage.jsonButton).toBeVisible();
    await expect(detailPage.jsonButton).toContainText('JSON');

    await expect(detailPage.editButton).toBeVisible();
    await expect(detailPage.editButton).toContainText('Edytuj');
  });

  test('should display product info card with all data', async () => {
    await expect(detailPage.infoCard).toBeVisible();

    await expect(detailPage.nameValue).toBeVisible();
    await expect(detailPage.nameValue).toHaveText(testProductName);

    await expect(detailPage.descriptionValue).toBeVisible();
    await expect(detailPage.descriptionValue).toHaveText('A detailed description for testing');

    await expect(detailPage.previewUrlValue).toBeVisible();
    await expect(detailPage.previewUrlValue).toContainText('https://preview.example.com/detail-test');
  });

  test('should display "Aktywny" badge for active product', async () => {
    await expect(detailPage.statusBadge).toBeVisible();
    await expect(detailPage.statusBadge).toHaveText('Aktywny');
  });

  test('should display "Brak opisu" when product has no description', async ({ page }) => {
    // Create a product without description
    const noDescProduct = await api.createProduct({
      code: `${TEST_PREFIX}-NODESC-${Date.now()}`,
      name: `No Desc Product ${Date.now()}`,
    });

    try {
      await detailPage.goto(noDescProduct.id);
      await detailPage.expectVisible();

      await expect(detailPage.descriptionValue).toBeVisible();
      await expect(detailPage.descriptionValue).toContainText('Brak opisu');
    } finally {
      await api.deleteProduct(noDescProduct.id).catch(() => {});
    }
  });

  test('should display "Nie ustawiono" when product has no previewUrl', async ({ page }) => {
    // Create a product without previewUrl
    const noUrlProduct = await api.createProduct({
      code: `${TEST_PREFIX}-NOURL-${Date.now()}`,
      name: `No URL Product ${Date.now()}`,
    });

    try {
      await detailPage.goto(noUrlProduct.id);
      await detailPage.expectVisible();

      await expect(detailPage.previewUrlValue).toBeVisible();
      await expect(detailPage.previewUrlValue).toContainText('Nie ustawiono');
    } finally {
      await api.deleteProduct(noUrlProduct.id).catch(() => {});
    }
  });

  test('should display configs section', async () => {
    await expect(detailPage.configsSection).toBeVisible();
    await expect(detailPage.configsSection).toContainText('Konfiguracje');
  });

  test('should display config card for general config type', async () => {
    const generalConfigCard = detailPage.configCard('general');
    await expect(generalConfigCard).toBeVisible();
  });

  test('should display draft and published badges on config card', async () => {
    // We published the general config and then saved a new draft
    const draftBadge = detailPage.configCardDraftBadge('general');
    const publishedBadge = detailPage.configCardPublishedBadge('general');

    await expect(draftBadge).toBeVisible();
    await expect(publishedBadge).toBeVisible();
  });

  test('should display "Dodaj konfigurację" card', async () => {
    await expect(detailPage.addConfigCard).toBeVisible();
    await expect(detailPage.addConfigCard).toContainText('Dodaj konfigurację');
  });

  test('should navigate to config editor when clicking edit on config card', async ({ page }) => {
    const editButton = detailPage.configCardEditButton('general');
    await expect(editButton).toBeVisible();

    await detailPage.clickConfigEdit('general');

    await page.waitForURL(`**/products/${testProductId}/configs/general`);

    const editorTitle = page.getByTestId('config-editor-title');
    await expect(editorTitle).toBeVisible();
  });

  test('should navigate to history page when clicking "Historia" button', async ({ page }) => {
    await detailPage.clickHistory();

    await page.waitForURL(`**/products/${testProductId}/history`);

    const historyTitle = page.getByTestId('history-page-title');
    await expect(historyTitle).toBeVisible();
    await expect(historyTitle).toContainText('Historia zmian');
  });

  test('should open JSON dialog when clicking "JSON" button', async ({ page }) => {
    await detailPage.clickJson();

    const jsonDialog = new ProductJsonDialogPO(page);
    await jsonDialog.expectOpen();
  });

  test('should open edit product form when clicking "Edytuj" button', async ({ page }) => {
    await detailPage.clickEdit();

    const formDialog = new ProductFormDialogPO(page);
    await formDialog.expectOpen();
    await expect(formDialog.dialog).toContainText('Edytuj produkt');

    // Verify the form is pre-filled with product data
    await expect(formDialog.codeInput).toHaveValue(testProductCode);
    await expect(formDialog.nameInput).toHaveValue(testProductName);
  });

  test('should show loading skeleton during data fetch', async ({ page }) => {
    // Intercept the API call and delay the response
    await page.route(`**/api/products/${testProductId}`, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.continue();
    });

    // Navigate to trigger a fresh load
    await page.goto(`/products/${testProductId}`);

    // The loading skeleton should appear while waiting
    await expect(detailPage.loadingSkeleton).toBeVisible();

    // Wait for data to actually load
    await detailPage.expectVisible();

    // Unroute to clean up
    await page.unroute(`**/api/products/${testProductId}`);
  });

  test('should show error state when product is not found (404)', async ({ page }) => {
    const fakeId = 'non-existent-product-id-12345';

    await page.goto(`/products/${fakeId}`);

    await expect(detailPage.errorState).toBeVisible();
  });
});
