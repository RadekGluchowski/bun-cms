import { test, expect } from '@playwright/test';
import { loginViaAPI } from '../../helpers/auth.helper';
import { ApiHelper } from '../../helpers/api.helper';
import { ProductsListPage } from '../../page-objects/ProductsListPage.po';
import { ProductFormDialogPO } from '../../page-objects/ProductFormDialogPO.po';
import { ToastPO } from '../../page-objects/ToastPO.po';

const api = new ApiHelper();
const TEST_PREFIX = 'CRT';

test.describe('Product Create', () => {
  let productsPage: ProductsListPage;
  let formDialog: ProductFormDialogPO;
  let toast: ToastPO;
  const createdProductIds: string[] = [];

  test.beforeAll(async () => {
    await api.login();
    await api.cleanupTestProducts(TEST_PREFIX);
  });

  test.afterEach(async () => {
    for (const id of createdProductIds) {
      await api.deleteProduct(id).catch(() => {});
    }
    createdProductIds.length = 0;
  });

  test.afterAll(async () => {
    await api.cleanupTestProducts(TEST_PREFIX);
  });

  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page);
    productsPage = new ProductsListPage(page);
    formDialog = new ProductFormDialogPO(page);
    toast = new ToastPO(page);
    await productsPage.goto();
    await productsPage.expectVisible();
  });

  test('should open "Nowy produkt" dialog when clicking "Dodaj produkt"', async () => {
    await productsPage.clickAdd();

    await formDialog.expectOpen();
    await expect(formDialog.dialog).toContainText('Nowy produkt');
  });

  test('should display form fields: code, name, description, previewUrl', async () => {
    await productsPage.clickAdd();
    await formDialog.expectOpen();

    await expect(formDialog.codeInput).toBeVisible();
    await expect(formDialog.nameInput).toBeVisible();
    await expect(formDialog.descriptionInput).toBeVisible();
    await expect(formDialog.previewUrlInput).toBeVisible();
  });

  test('should display "Utwórz produkt" submit button and "Anuluj" cancel button', async () => {
    await productsPage.clickAdd();
    await formDialog.expectOpen();

    await expect(formDialog.submitButton).toBeVisible();
    await expect(formDialog.submitButton).toContainText('Utwórz produkt');

    await expect(formDialog.cancelButton).toBeVisible();
    await expect(formDialog.cancelButton).toContainText('Anuluj');
  });

  test('should display correct placeholders for code and name inputs', async () => {
    await productsPage.clickAdd();
    await formDialog.expectOpen();

    await expect(formDialog.codeInput).toHaveAttribute('placeholder', 'np. my-product');
    await expect(formDialog.nameInput).toHaveAttribute('placeholder', 'np. Mój produkt');
  });

  test('should create product with all fields filled successfully', async ({ page }) => {
    const productCode = `${TEST_PREFIX}-FULL-${Date.now()}`;
    const productName = 'Complete Product All Fields';
    const productDescription = 'A fully detailed product description';
    const productPreviewUrl = 'https://example.com/preview';

    await productsPage.clickAdd();
    await formDialog.expectOpen();

    await formDialog.fillCode(productCode);
    await formDialog.fillName(productName);
    await formDialog.fillDescription(productDescription);
    await formDialog.fillPreviewUrl(productPreviewUrl);

    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/products') &&
        response.request().method() === 'POST' &&
        (response.status() === 200 || response.status() === 201)
    );

    await formDialog.submit();

    const response = await responsePromise;
    const responseBody = await response.json();
    createdProductIds.push(responseBody.id);

    // Dialog should close
    await formDialog.expectClosed();
  });

  test('should create product with only required fields (code + name)', async ({ page }) => {
    const productCode = `${TEST_PREFIX}-MIN-${Date.now()}`;
    const productName = 'Minimal Product';

    await productsPage.clickAdd();
    await formDialog.expectOpen();

    await formDialog.fillCode(productCode);
    await formDialog.fillName(productName);

    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/products') &&
        response.request().method() === 'POST' &&
        (response.status() === 200 || response.status() === 201)
    );

    await formDialog.submit();

    const response = await responsePromise;
    const responseBody = await response.json();
    createdProductIds.push(responseBody.id);

    await formDialog.expectClosed();
  });

  test('should show toast "Produkt utworzony" on successful creation', async ({ page }) => {
    const productCode = `${TEST_PREFIX}-TOAST-${Date.now()}`;

    await productsPage.clickAdd();
    await formDialog.expectOpen();

    await formDialog.fillCode(productCode);
    await formDialog.fillName('Toast Test Product');

    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/products') &&
        response.request().method() === 'POST' &&
        (response.status() === 200 || response.status() === 201)
    );

    await formDialog.submit();

    const response = await responsePromise;
    const responseBody = await response.json();
    createdProductIds.push(responseBody.id);

    await toast.expectToast('Produkt utworzony');
  });

  test('should normalize code to uppercase after creation', async ({ page }) => {
    const productCode = `${TEST_PREFIX}-lower-${Date.now()}`;

    await productsPage.clickAdd();
    await formDialog.expectOpen();

    await formDialog.fillCode(productCode);
    await formDialog.fillName('Uppercase Code Test');

    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/products') &&
        response.request().method() === 'POST' &&
        (response.status() === 200 || response.status() === 201)
    );

    await formDialog.submit();

    const response = await responsePromise;
    const responseBody = await response.json();
    createdProductIds.push(responseBody.id);

    await formDialog.expectClosed();

    // Search for the product by its expected uppercase code
    const expectedCode = productCode.toUpperCase();
    await productsPage.search(expectedCode);

    await page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/products') &&
        resp.url().includes('search=') &&
        resp.status() === 200
    );

    await productsPage.expectTableVisible();
    const firstRowCode = productsPage.tableRowCode(0);
    await expect(firstRowCode).toHaveText(expectedCode);
  });

  test('should validate: empty code shows "Kod produktu jest wymagany"', async () => {
    await productsPage.clickAdd();
    await formDialog.expectOpen();

    // Fill only name, leave code empty
    await formDialog.fillName('Some Name');

    await formDialog.submit();

    await formDialog.expectFieldError('code', 'Kod produktu jest wymagany');

    // Dialog should remain open
    await formDialog.expectOpen();
  });

  test('should validate: empty name shows "Nazwa produktu jest wymagana"', async () => {
    await productsPage.clickAdd();
    await formDialog.expectOpen();

    // Fill only code, leave name empty
    await formDialog.fillCode(`${TEST_PREFIX}-NONAME`);

    await formDialog.submit();

    await formDialog.expectFieldError('name', 'Nazwa produktu jest wymagana');

    // Dialog should remain open
    await formDialog.expectOpen();
  });

  test('should validate: code with special characters shows error', async () => {
    await productsPage.clickAdd();
    await formDialog.expectOpen();

    await formDialog.fillCode('abc@#$');
    await formDialog.fillName('Special Chars Test');

    await formDialog.submit();

    await formDialog.expectFieldError('code', 'Kod produktu może zawierać tylko litery, cyfry, - i _');
  });

  test('should validate: code > 50 chars shows error', async () => {
    await productsPage.clickAdd();
    await formDialog.expectOpen();

    const longCode = 'A'.repeat(51);
    await formDialog.fillCode(longCode);
    await formDialog.fillName('Long Code Test');

    await formDialog.submit();

    await formDialog.expectFieldError('code', 'Kod produktu może mieć maksymalnie 50 znaków');
  });

  test('should validate: name > 255 chars shows error', async () => {
    await productsPage.clickAdd();
    await formDialog.expectOpen();

    await formDialog.fillCode(`${TEST_PREFIX}-LONGNAME`);
    await formDialog.fillName('A'.repeat(256));

    await formDialog.submit();

    await formDialog.expectFieldError('name', 'Nazwa produktu może mieć maksymalnie 255 znaków');
  });

  test('should validate: description > 1000 chars shows error', async () => {
    await productsPage.clickAdd();
    await formDialog.expectOpen();

    await formDialog.fillCode(`${TEST_PREFIX}-LONGDESC`);
    await formDialog.fillName('Long Desc Test');
    await formDialog.fillDescription('A'.repeat(1001));

    await formDialog.submit();

    await formDialog.expectFieldError('description', 'Opis może mieć maksymalnie 1000 znaków');
  });

  test('should validate: invalid URL shows "Podaj poprawny adres URL"', async () => {
    await productsPage.clickAdd();
    await formDialog.expectOpen();

    await formDialog.fillCode(`${TEST_PREFIX}-BADURL`);
    await formDialog.fillName('Bad URL Test');
    await formDialog.fillPreviewUrl('not-a-valid-url');

    await formDialog.submit();

    await formDialog.expectFieldError('preview-url', 'Podaj poprawny adres URL');
  });

  test('should show error when creating product with duplicate code', async ({ page }) => {
    const duplicateCode = `${TEST_PREFIX}-DUP-${Date.now()}`;

    // First, create a product via API
    const existingProduct = await api.createProduct({
      code: duplicateCode,
      name: 'Existing Product',
    });
    createdProductIds.push(existingProduct.id);

    // Now try to create another product with the same code via UI
    await productsPage.clickAdd();
    await formDialog.expectOpen();

    await formDialog.fillCode(duplicateCode);
    await formDialog.fillName('Duplicate Product');

    // Wait for the error response
    const errorPromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/products') &&
        response.request().method() === 'POST' &&
        response.status() >= 400
    );
    await formDialog.submit();
    await errorPromise;

    // Error message should be displayed
    await expect(formDialog.errorMessage).toBeVisible();

    // Dialog should remain open
    await formDialog.expectOpen();
  });

  test('should clear field errors when user types', async ({ page }) => {
    await productsPage.clickAdd();
    await formDialog.expectOpen();

    // Submit empty form to trigger validation errors
    await formDialog.submit();

    // Verify errors are shown
    await formDialog.expectFieldError('code', 'Kod produktu jest wymagany');
    await formDialog.expectFieldError('name', 'Nazwa produktu jest wymagana');

    // Start typing in the code field
    await formDialog.fillCode('typing');

    // Code error should be cleared
    await formDialog.expectNoFieldError('code');

    // Name error should still be visible
    await expect(formDialog.nameError).toBeVisible();

    // Start typing in the name field
    await formDialog.fillName('typing');

    // Name error should also be cleared
    await formDialog.expectNoFieldError('name');
  });

  test('should reset form when dialog is reopened', async () => {
    // Open dialog and fill some data
    await productsPage.clickAdd();
    await formDialog.expectOpen();

    await formDialog.fillCode('TEMP-CODE');
    await formDialog.fillName('Temp Name');
    await formDialog.fillDescription('Temp Description');

    // Cancel the dialog
    await formDialog.cancel();
    await formDialog.expectClosed();

    // Reopen the dialog
    await productsPage.clickAdd();
    await formDialog.expectOpen();

    // All fields should be empty
    await expect(formDialog.codeInput).toHaveValue('');
    await expect(formDialog.nameInput).toHaveValue('');
    await expect(formDialog.descriptionInput).toHaveValue('');
    await expect(formDialog.previewUrlInput).toHaveValue('');
  });

  test('should close dialog on "Anuluj" click without creating product', async ({ page }) => {
    const productCode = `${TEST_PREFIX}-CANCEL-${Date.now()}`;

    await productsPage.clickAdd();
    await formDialog.expectOpen();

    await formDialog.fillCode(productCode);
    await formDialog.fillName('Cancel Test Product');

    // Click cancel instead of submit
    await formDialog.cancel();

    // Dialog should close
    await formDialog.expectClosed();

    // Verify the product was NOT created by searching for it
    await productsPage.search(productCode);

    await page.waitForResponse(
      (response) =>
        response.url().includes('/api/products') &&
        response.url().includes(`search=${productCode}`) &&
        response.status() === 200
    );

    // Should show search empty state since the product was not created
    await productsPage.expectSearchEmptyState();
  });

  test('should show product in search results after creation', async ({ page }) => {
    const productCode = `${TEST_PREFIX}-APPEAR-${Date.now()}`;
    const productName = `Appear In List Product ${Date.now()}`;

    await productsPage.clickAdd();
    await formDialog.expectOpen();

    await formDialog.fillCode(productCode);
    await formDialog.fillName(productName);

    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/products') &&
        response.request().method() === 'POST' &&
        (response.status() === 200 || response.status() === 201)
    );

    await formDialog.submit();

    const response = await responsePromise;
    const responseBody = await response.json();
    createdProductIds.push(responseBody.id);

    await formDialog.expectClosed();

    // Search for the newly created product by its uppercase code
    const expectedCode = productCode.toUpperCase();
    await productsPage.search(expectedCode);

    await page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/products') &&
        resp.url().includes('search=') &&
        resp.status() === 200
    );

    await productsPage.expectTableVisible();

    const firstRowName = productsPage.tableRowName(0);
    await expect(firstRowName).toContainText(productName);
  });
});
