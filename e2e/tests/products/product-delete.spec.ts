import { test, expect } from '@playwright/test';
import { loginViaAPI } from '../../helpers/auth.helper';
import { ApiHelper } from '../../helpers/api.helper';
import { ProductsListPage } from '../../page-objects/ProductsListPage.po';
import { DeleteProductDialogPO } from '../../page-objects/DeleteProductDialogPO.po';
import { ToastPO } from '../../page-objects/ToastPO.po';

const api = new ApiHelper();
const TEST_PREFIX = 'DEL';

test.describe('Product Delete', () => {
  let productsPage: ProductsListPage;
  let deleteDialog: DeleteProductDialogPO;
  let toast: ToastPO;
  let testProductId: string;
  let testProductCode: string;
  let testProductName: string;

  test.beforeAll(async () => {
    await api.login();
    await api.cleanupTestProducts(TEST_PREFIX);
  });

  test.beforeEach(async ({ page }) => {
    // Create a fresh test product for each test
    const timestamp = Date.now();
    testProductCode = `${TEST_PREFIX}-${timestamp}`;
    testProductName = `Delete Test Product ${timestamp}`;

    const created = await api.createProduct({
      code: testProductCode,
      name: testProductName,
      description: 'Product for delete testing',
    });
    testProductId = created.id;

    await loginViaAPI(page);
    productsPage = new ProductsListPage(page);
    deleteDialog = new DeleteProductDialogPO(page);
    toast = new ToastPO(page);
    await productsPage.goto();
    await productsPage.expectVisible();

    // Search for our test product
    await productsPage.search(testProductCode);

    await page.waitForResponse(
      (response) =>
        response.url().includes('/api/products') &&
        response.url().includes(`search=${testProductCode}`) &&
        response.status() === 200
    );

    await productsPage.expectTableVisible();
  });

  test.afterEach(async () => {
    // Cleanup - try to delete even if test already deleted
    if (testProductId) {
      await api.deleteProduct(testProductId).catch(() => {});
    }
  });

  test.afterAll(async () => {
    await api.cleanupTestProducts(TEST_PREFIX);
  });

  test('should open delete confirmation dialog when clicking delete button', async () => {
    await productsPage.clickDeleteProduct(0);

    await deleteDialog.expectOpen();
  });

  test('should display product name in confirmation dialog', async () => {
    await productsPage.clickDeleteProduct(0);
    await deleteDialog.expectOpen();

    await deleteDialog.expectContainsText(testProductName);
  });

  test('should have "Anuluj" and confirm button present', async ({ page }) => {
    await productsPage.clickDeleteProduct(0);
    await deleteDialog.expectOpen();

    await expect(deleteDialog.cancelButton).toBeVisible();
    await expect(deleteDialog.cancelButton).toContainText('Anuluj');

    await expect(deleteDialog.confirmButton).toBeVisible();
  });

  test('should delete product on confirm - product disappears from list', async ({ page }) => {
    await productsPage.clickDeleteProduct(0);
    await deleteDialog.expectOpen();

    const deleteResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/products/${testProductId}`) &&
        response.request().method() === 'DELETE' &&
        response.status() === 200
    );
    const refreshPromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/products') &&
        response.request().method() === 'GET' &&
        response.status() === 200
    );

    await deleteDialog.confirm();
    await deleteResponsePromise;

    // Dialog should close
    await expect(deleteDialog.dialog).not.toBeVisible();

    // Wait for the list to refresh
    await refreshPromise;

    // Since we were searching for this specific product code, the list should now be empty
    await productsPage.expectSearchEmptyState();

    // Mark as deleted so afterEach does not try to delete again
    testProductId = '';
  });

  test('should show toast "Produkt usunięty" after deletion', async ({ page }) => {
    await productsPage.clickDeleteProduct(0);
    await deleteDialog.expectOpen();

    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/products/${testProductId}`) &&
        response.request().method() === 'DELETE' &&
        response.status() === 200
    );

    await deleteDialog.confirm();
    await responsePromise;

    await toast.expectToast('Produkt usunięty');

    testProductId = '';
  });

  test('should close dialog without deleting on "Anuluj"', async ({ page }) => {
    await productsPage.clickDeleteProduct(0);
    await deleteDialog.expectOpen();

    // Click cancel
    await deleteDialog.cancel();

    // Dialog should close
    await expect(deleteDialog.dialog).not.toBeVisible();

    // The product should still be in the list
    await productsPage.expectTableVisible();
    const firstRowName = productsPage.tableRowName(0);
    await expect(firstRowName).toContainText(testProductName);

    // Also verify via API that the product still exists
    const product = await api.getProduct(testProductId);
    expect(product).toBeTruthy();
    expect(product.product.id).toBe(testProductId);
  });

  test('should close dialog without deleting when pressing Escape key', async ({ page }) => {
    await productsPage.clickDeleteProduct(0);
    await deleteDialog.expectOpen();

    // Press Escape key
    await page.keyboard.press('Escape');

    // Dialog should close
    await expect(deleteDialog.dialog).not.toBeVisible();

    // The product should still be in the list
    await productsPage.expectTableVisible();
    const firstRowName = productsPage.tableRowName(0);
    await expect(firstRowName).toContainText(testProductName);

    // Also verify via API that the product still exists
    const product = await api.getProduct(testProductId);
    expect(product).toBeTruthy();
    expect(product.product.id).toBe(testProductId);
  });
});
