import { test, expect } from '@playwright/test';
import { loginViaAPI } from '../../helpers/auth.helper';
import { ApiHelper } from '../../helpers/api.helper';
import { ProductsListPage } from '../../page-objects/ProductsListPage.po';
import { ProductFormDialogPO } from '../../page-objects/ProductFormDialogPO.po';
import { DeleteProductDialogPO } from '../../page-objects/DeleteProductDialogPO.po';
import { SEED_PRODUCT, API_BASE } from '../../fixtures/test-data';

const api = new ApiHelper();

test.describe('Products List Page', () => {
  let productsPage: ProductsListPage;

  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page);
    productsPage = new ProductsListPage(page);
    await productsPage.goto();
    await productsPage.expectVisible();
  });

  test('should display page title "Produkty"', async () => {
    await expect(productsPage.pageTitle).toBeVisible();
    await expect(productsPage.pageTitle).toHaveText('Produkty');
  });

  test('should display subtitle "Zarządzaj produktami i konfiguracjami"', async ({ page }) => {
    const subtitle = page.getByText('Zarządzaj produktami i konfiguracjami');
    await expect(subtitle).toBeVisible();
  });

  test('should display "Dodaj produkt" button', async () => {
    await expect(productsPage.addButton).toBeVisible();
    await expect(productsPage.addButton).toContainText('Dodaj produkt');
  });

  test('should display search input with placeholder "Szukaj produktów..."', async () => {
    await expect(productsPage.searchInput).toBeVisible();
    await expect(productsPage.searchInput).toHaveAttribute('placeholder', 'Szukaj produktów...');
  });

  test('should display products table with columns: Nazwa, Kod, Status, Ostatnia zmiana, Akcje', async ({ page }) => {
    await productsPage.expectTableVisible();
    const headerRow = page.locator('thead tr');
    await expect(headerRow.getByText('Nazwa')).toBeVisible();
    await expect(headerRow.getByText('Kod')).toBeAttached();
    await expect(headerRow.getByText('Status')).toBeVisible();
    await expect(headerRow.getByText('Ostatnia zmiana')).toBeAttached();
    await expect(headerRow.getByText('Akcje')).toBeAttached();
  });

  test('should display seed product "Sample Product" with code "SAMPLE"', async ({ page }) => {
    // Search for seed product to ensure it's on the current page
    await productsPage.search(SEED_PRODUCT.code);

    await page.waitForResponse(
      (response) =>
        response.url().includes('/api/products') &&
        response.url().includes(`search=${SEED_PRODUCT.code}`) &&
        response.status() === 200
    );

    await productsPage.expectTableVisible();

    const firstRowName = productsPage.tableRowName(0);
    await expect(firstRowName).toHaveText(SEED_PRODUCT.name);

    const firstRowCode = productsPage.tableRowCode(0);
    await expect(firstRowCode).toHaveText(SEED_PRODUCT.code);
  });

  test('should display "Aktywny" badge for active products', async () => {
    await productsPage.expectTableVisible();
    const statusCell = productsPage.tableRowStatus(0);
    await expect(statusCell).toBeVisible();
    await expect(statusCell).toContainText('Aktywny');
  });

  test('should display edit and delete action buttons for each row', async () => {
    await productsPage.expectTableVisible();
    const editButton = productsPage.tableRowEditButton(0);
    const deleteButton = productsPage.tableRowDeleteButton(0);
    await expect(editButton).toBeVisible();
    await expect(deleteButton).toBeVisible();
  });

  test('should navigate to product detail page when clicking product name', async ({ page }) => {
    await productsPage.expectTableVisible();

    const productNameLink = productsPage.tableRowName(0);
    await expect(productNameLink).toBeVisible();

    await productsPage.clickProductName(0);

    await page.waitForURL(/\/products\/[a-zA-Z0-9-]+$/);
    const detailTitle = page.getByTestId('product-detail-title');
    await expect(detailTitle).toBeVisible();
  });

  test('should open edit dialog when clicking edit button on a row', async ({ page }) => {
    await productsPage.expectTableVisible();

    await productsPage.clickEditProduct(0);

    const formDialog = new ProductFormDialogPO(page);
    await formDialog.expectOpen();
    await expect(formDialog.dialog).toContainText('Edytuj produkt');
  });

  test('should open delete confirmation dialog when clicking delete button on a row', async ({ page }) => {
    await productsPage.expectTableVisible();

    // Create a temp product to safely test the delete dialog
    const tempProduct = await api.createProduct({
      code: `LIST-DEL-${Date.now()}`,
      name: `List Delete Test ${Date.now()}`,
    });

    try {
      // Search for it
      await productsPage.search(tempProduct.code);
      await page.waitForResponse(
        (response) =>
          response.url().includes('/api/products') &&
          response.url().includes(`search=${tempProduct.code}`) &&
          response.status() === 200
      );
      await productsPage.expectTableVisible();

      await productsPage.clickDeleteProduct(0);

      const deleteDialog = new DeleteProductDialogPO(page);
      await deleteDialog.expectOpen();

      // Close without deleting
      await deleteDialog.cancel();
    } finally {
      await api.deleteProduct(tempProduct.id).catch(() => {});
    }
  });

  test('should show loading skeleton during data fetch', async ({ page }) => {
    // Intercept the API call and delay the response
    await page.route('**/api/products*', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.continue();
    });

    // Navigate to trigger a fresh load
    await page.goto('/products');

    // The loading skeleton should appear while waiting
    await expect(productsPage.loadingSkeleton).toBeVisible();

    // Wait for data to actually load
    await productsPage.expectTableVisible();

    // Unroute to clean up
    await page.unroute('**/api/products*');
  });

  test('should show error state when API returns 500', async ({ page }) => {
    test.setTimeout(60_000);

    // Intercept only the REST API call (not Vite module URLs like /src/api/products.api.ts)
    await page.route(/\/api\/products(\?|$)/, async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    // Reload to trigger a fresh fetch with intercepted 500 responses
    await page.reload({ waitUntil: 'domcontentloaded' });

    // TanStack Query retries 3 times with exponential backoff (~7s), so wait longer
    await expect(productsPage.errorState).toBeVisible({ timeout: 30_000 });

    // Unroute to clean up
    await page.unroute(/\/api\/products(\?|$)/);
  });

  test('should show "Brak wyników" when searching for non-existent product', async ({ page }) => {
    await productsPage.search('XYZNONEXISTENT123456789');

    await page.waitForResponse(
      (response) =>
        response.url().includes('/api/products') &&
        response.url().includes('search=XYZNONEXISTENT123456789') &&
        response.status() === 200
    );

    await productsPage.expectSearchEmptyState();
    await expect(productsPage.searchEmptyState).toContainText('Brak wyników');
  });
});
