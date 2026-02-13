import { test, expect } from '@playwright/test';
import { loginViaAPI } from '../../helpers/auth.helper';
import { ApiHelper } from '../../helpers/api.helper';
import { ProductsListPage } from '../../page-objects/ProductsListPage.po';
import { ProductFormDialogPO } from '../../page-objects/ProductFormDialogPO.po';
import { ToastPO } from '../../page-objects/ToastPO.po';

const api = new ApiHelper();
const TEST_PREFIX = 'EDIT';

test.describe('Product Edit', () => {
  let productsPage: ProductsListPage;
  let formDialog: ProductFormDialogPO;
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
    testProductName = `Edit Test Product ${timestamp}`;

    const created = await api.createProduct({
      code: testProductCode,
      name: testProductName,
      description: 'Original description for edit testing',
      previewUrl: 'https://original.example.com/preview',
    });
    testProductId = created.id;

    await loginViaAPI(page);
    productsPage = new ProductsListPage(page);
    formDialog = new ProductFormDialogPO(page);
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
    if (testProductId) {
      await api.deleteProduct(testProductId).catch(() => {});
    }
  });

  test.afterAll(async () => {
    await api.cleanupTestProducts(TEST_PREFIX);
  });

  test('should open "Edytuj produkt" dialog from products list edit button', async () => {
    await productsPage.clickEditProduct(0);

    await formDialog.expectOpen();
    await expect(formDialog.dialog).toContainText('Edytuj produkt');
  });

  test('should pre-fill form with existing product data', async () => {
    await productsPage.clickEditProduct(0);
    await formDialog.expectOpen();

    await expect(formDialog.codeInput).toHaveValue(testProductCode);
    await expect(formDialog.nameInput).toHaveValue(testProductName);
    await expect(formDialog.descriptionInput).toHaveValue('Original description for edit testing');
    await expect(formDialog.previewUrlInput).toHaveValue('https://original.example.com/preview');
  });

  test('should have code field disabled in edit mode', async () => {
    await productsPage.clickEditProduct(0);
    await formDialog.expectOpen();

    await formDialog.expectCodeDisabled();

    // Should show hint about code being immutable
    await expect(formDialog.dialog).toContainText('Kod produktu nie może być zmieniony');
  });

  test('should display "Zapisz zmiany" submit button', async () => {
    await productsPage.clickEditProduct(0);
    await formDialog.expectOpen();

    await formDialog.expectSubmitButtonText('Zapisz zmiany');
  });

  test('should successfully update product name', async ({ page }) => {
    await productsPage.clickEditProduct(0);
    await formDialog.expectOpen();

    const newName = `Updated Name ${Date.now()}`;
    await formDialog.fillName(newName);

    const updatePromise = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/products/${testProductId}`) &&
        response.request().method() === 'PUT' &&
        response.status() === 200
    );
    const refreshPromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/products') &&
        response.request().method() === 'GET' &&
        response.status() === 200
    );

    await formDialog.submit();
    await updatePromise;

    await formDialog.expectClosed();

    // Wait for TanStack Query to refetch the product list after mutation
    await refreshPromise;

    // The list should already show the updated name from the auto-refetch
    await productsPage.expectTableVisible();
    const firstRowName = productsPage.tableRowName(0);
    await expect(firstRowName).toHaveText(newName);
  });

  test('should successfully update product description', async ({ page }) => {
    await productsPage.clickEditProduct(0);
    await formDialog.expectOpen();

    const newDescription = 'Updated description for testing';
    await formDialog.fillDescription(newDescription);

    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/products/${testProductId}`) &&
        response.request().method() === 'PUT' &&
        response.status() === 200
    );

    await formDialog.submit();
    await responsePromise;

    await formDialog.expectClosed();
  });

  test('should successfully update preview URL', async ({ page }) => {
    await productsPage.clickEditProduct(0);
    await formDialog.expectOpen();

    const newUrl = 'https://updated.example.com/new-preview';
    await formDialog.fillPreviewUrl(newUrl);

    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/products/${testProductId}`) &&
        response.request().method() === 'PUT' &&
        response.status() === 200
    );

    await formDialog.submit();
    await responsePromise;

    await formDialog.expectClosed();
  });

  test('should show toast "Produkt zaktualizowany" on successful update', async ({ page }) => {
    await productsPage.clickEditProduct(0);
    await formDialog.expectOpen();

    await formDialog.fillName('Toast Update Product');

    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/products/${testProductId}`) &&
        response.request().method() === 'PUT' &&
        response.status() === 200
    );

    await formDialog.submit();
    await responsePromise;

    await toast.expectToast('Produkt zaktualizowany');
  });

  test('should validate: clearing name shows "Nazwa produktu jest wymagana"', async ({ page }) => {
    await productsPage.clickEditProduct(0);
    await formDialog.expectOpen();

    // Clear the name field
    await formDialog.nameInput.clear();

    await formDialog.submit();

    await formDialog.expectFieldError('name', 'Nazwa produktu jest wymagana');

    // Dialog should remain open
    await formDialog.expectOpen();
  });

  test('should close dialog without saving when clicking "Anuluj"', async ({ page }) => {
    await productsPage.clickEditProduct(0);
    await formDialog.expectOpen();

    // Change the name
    await formDialog.fillName('Unsaved Changes Name');

    // Click cancel
    await formDialog.cancel();

    // Dialog should close
    await formDialog.expectClosed();

    // Product name in the list should still be the original
    const firstRowName = productsPage.tableRowName(0);
    await expect(firstRowName).toHaveText(testProductName);

    // Also verify via API that the product was not changed
    const product = await api.getProduct(testProductId);
    expect((product.product as any).name).toBe(testProductName);
  });
});
