import { test, expect } from '@playwright/test';
import { loginViaAPI } from '../../helpers/auth.helper';
import { ApiHelper } from '../../helpers/api.helper';
import { ProductsListPage } from '../../page-objects/ProductsListPage.po';

const api = new ApiHelper();
const ts = Date.now();
const BULK_PREFIX = `PGNT-${ts}`;
const PRODUCTS_TO_CREATE = 15;

test.describe('Product Pagination', () => {
  let productsPage: ProductsListPage;
  const createdIds: string[] = [];

  test.beforeAll(async () => {
    await api.login();
    // Clean up any leftover test products
    await api.cleanupTestProducts(BULK_PREFIX);

    // Create 15 products to ensure at least 2 pages (10 per page)
    for (let i = 0; i < PRODUCTS_TO_CREATE; i++) {
      const padded = String(i).padStart(3, '0');
      const created = await api.createProduct({
        code: `${BULK_PREFIX}-${padded}`,
        name: `${BULK_PREFIX} Pagination Product ${padded}`,
        description: `Bulk product ${i} for pagination testing`,
      });
      createdIds.push(created.id);
    }
  });

  test.afterAll(async () => {
    for (const id of createdIds) {
      await api.deleteProduct(id).catch(() => {});
    }
  });

  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page);
    productsPage = new ProductsListPage(page);
    await productsPage.goto();
    await productsPage.expectVisible();

    // Search for our bulk products so pagination only shows our test data
    await productsPage.search(BULK_PREFIX);

    // Wait for search results to load
    await page.waitForResponse(
      (response) =>
        response.url().includes('/api/products') &&
        response.url().includes(`search=`) &&
        response.status() === 200
    );

    await productsPage.expectTableVisible();
  });

  test('should display pagination info "Pokazano X-Y z Z produktów"', async () => {
    await productsPage.expectPaginationVisible();

    await expect(productsPage.paginationShowing).toBeVisible();

    // Should match pattern "Pokazano 1-10 z 15 produktów"
    await expect(productsPage.paginationShowing).toContainText('Pokazano');
    await expect(productsPage.paginationShowing).toContainText('produktów');
  });

  test('should display "Poprzednia" and "Następna" buttons', async () => {
    await productsPage.expectPaginationVisible();
    await expect(productsPage.paginationPrev).toBeVisible();
    await expect(productsPage.paginationPrev).toContainText('Poprzednia');
    await expect(productsPage.paginationNext).toBeVisible();
    await expect(productsPage.paginationNext).toContainText('Następna');
  });

  test('should display "Strona X z Y"', async () => {
    await productsPage.expectPaginationVisible();
    await expect(productsPage.paginationInfo).toBeVisible();

    // Should show something like "Strona 1 z 2"
    const text = await productsPage.paginationInfo.textContent();
    expect(text).toMatch(/Strona \d+ z \d+/);
  });

  test('should disable "Poprzednia" button on first page', async () => {
    await productsPage.expectPaginationVisible();

    // On the first page, "Poprzednia" should be disabled
    await expect(productsPage.paginationPrev).toBeDisabled();
  });

  test('should disable "Następna" button on last page', async ({ page }) => {
    await productsPage.expectPaginationVisible();

    // Get total pages count
    const infoText = await productsPage.paginationInfo.textContent();
    const match = infoText?.match(/Strona (\d+) z (\d+)/);
    expect(match).toBeTruthy();

    const totalPages = Number(match![2]);

    // Navigate to the last page by clicking "Następna" until we reach it
    for (let currentPage = 1; currentPage < totalPages; currentPage++) {
      const pagePromise = page.waitForResponse(
        (response) =>
          response.url().includes('/api/products') &&
          response.status() === 200
      );
      await productsPage.clickNextPage();
      await pagePromise;
    }

    // On the last page, "Następna" should be disabled
    await expect(productsPage.paginationNext).toBeDisabled();
  });

  test('should navigate to next page when clicking "Następna"', async ({ page }) => {
    await productsPage.expectPaginationVisible();

    // Verify we start on page 1
    await expect(productsPage.paginationInfo).toContainText('Strona 1');

    // Click "Następna"
    const nextPagePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/products') &&
        response.url().includes('page=2') &&
        response.status() === 200
    );
    await productsPage.clickNextPage();
    await nextPagePromise;

    // Verify we are now on page 2
    await expect(productsPage.paginationInfo).toContainText('Strona 2');

    // "Poprzednia" should now be enabled
    await expect(productsPage.paginationPrev).toBeEnabled();
  });

  test('should navigate to previous page when clicking "Poprzednia"', async ({ page }) => {
    await productsPage.expectPaginationVisible();

    // First go to page 2
    const page2Promise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/products') &&
        response.url().includes('page=2') &&
        response.status() === 200
    );
    await productsPage.clickNextPage();
    await page2Promise;

    await expect(productsPage.paginationInfo).toContainText('Strona 2');

    // Now click "Poprzednia" (page 1 may be served from TanStack Query cache)
    await productsPage.clickPrevPage();

    // Verify we are back on page 1
    await expect(productsPage.paginationInfo).toContainText('Strona 1');

    // "Poprzednia" should be disabled again
    await expect(productsPage.paginationPrev).toBeDisabled();
  });

  test('should not show pagination when products fit on one page', async ({ page }) => {
    // Search for something that returns very few results
    await productsPage.clearSearch();
    await productsPage.search(`${BULK_PREFIX}-000`);

    await page.waitForResponse(
      (response) =>
        response.url().includes('/api/products') &&
        response.url().includes(`search=`) &&
        response.status() === 200
    );

    await productsPage.expectTableVisible();

    // With only 1 result, pagination should not be visible or show "Strona 1 z 1"
    const infoText = await productsPage.paginationInfo.textContent().catch(() => null);
    if (infoText) {
      // If pagination is shown, it should say "Strona 1 z 1"
      expect(infoText).toContain('Strona 1 z 1');
      // Both buttons should be disabled (single page)
      await expect(productsPage.paginationPrev).toBeDisabled();
      await expect(productsPage.paginationNext).toBeDisabled();
    } else {
      // Pagination is not shown at all - this is also acceptable
      await productsPage.expectPaginationHidden();
    }
  });
});
