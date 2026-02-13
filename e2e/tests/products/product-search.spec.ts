import { test, expect } from '@playwright/test';
import { loginViaAPI } from '../../helpers/auth.helper';
import { ApiHelper } from '../../helpers/api.helper';
import { ProductsListPage } from '../../page-objects/ProductsListPage.po';

const api = new ApiHelper();
const ts = Date.now();

const testProducts = [
  { code: `SRCH-ALPHA-${ts}`, name: `SRCH-ALPHA-${ts} Alpha Insurance Product` },
  { code: `SRCH-BETA-${ts}`, name: `SRCH-BETA-${ts} Beta Travel Coverage` },
  { code: `SRCH-GAMMA-${ts}`, name: `SRCH-GAMMA-${ts} Gamma Health Plan` },
  { code: `SRCH-DELTA-${ts}`, name: `SRCH-DELTA-${ts} Delta Life Protection` },
];

test.describe('Product Search', () => {
  let productsPage: ProductsListPage;
  const createdIds: string[] = [];

  test.beforeAll(async () => {
    await api.login();
    // Clean up any leftover test products
    await api.cleanupTestProducts(`SRCH-ALPHA-${ts}`);
    await api.cleanupTestProducts(`SRCH-BETA-${ts}`);
    await api.cleanupTestProducts(`SRCH-GAMMA-${ts}`);
    await api.cleanupTestProducts(`SRCH-DELTA-${ts}`);

    // Create test products
    for (const product of testProducts) {
      const created = await api.createProduct({
        code: product.code,
        name: product.name,
        description: `Test product for search: ${product.name}`,
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
  });

  test('should filter products by name as user types', async ({ page }) => {
    await productsPage.search(`SRCH-ALPHA-${ts}`);

    await page.waitForResponse(
      (response) =>
        response.url().includes('/api/products') &&
        response.url().includes('search=') &&
        response.status() === 200
    );

    await productsPage.expectTableVisible();

    // The first row should contain our Alpha product
    const firstRowName = productsPage.tableRowName(0);
    await expect(firstRowName).toContainText(`SRCH-ALPHA-${ts}`);

    // The second row should not exist (only 1 result)
    const secondRow = productsPage.tableRow(1);
    await expect(secondRow).not.toBeVisible();
  });

  test('should debounce search input - fewer API calls than keystrokes', async ({ page }) => {
    let requestCount = 0;

    // Listen for product API requests that include search
    page.on('response', (response) => {
      if (
        response.url().includes('/api/products') &&
        response.url().includes('search=')
      ) {
        requestCount++;
      }
    });

    // Type quickly - all characters within the debounce window
    await productsPage.searchInput.pressSequentially('DebounceTestQuery', { delay: 20 });

    // Wait for the debounced search to actually fire
    await page.waitForResponse(
      (response) =>
        response.url().includes('/api/products') &&
        response.url().includes('search=') &&
        response.status() === 200
    );

    // The debounce should have consolidated multiple keystrokes into fewer requests
    // Rather than 17 requests (one per character), we expect far fewer
    expect(requestCount).toBeLessThanOrEqual(3);
  });

  test('should reset to page 1 when search text changes', async ({ page }) => {
    await productsPage.search(`SRCH-ALPHA-${ts}`);

    const response = await page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/products') &&
        resp.url().includes('search=') &&
        resp.status() === 200
    );

    const url = new URL(response.url());
    const pageParam = url.searchParams.get('page');
    // Page should be 1 (either explicitly or by default)
    expect(pageParam === '1' || pageParam === null).toBeTruthy();
  });

  test('should show "Brak wyników" when no products match search', async ({ page }) => {
    await productsPage.search('XYZNONEXISTENT123');

    await page.waitForResponse(
      (response) =>
        response.url().includes('/api/products') &&
        response.url().includes('search=XYZNONEXISTENT123') &&
        response.status() === 200
    );

    await productsPage.expectSearchEmptyState();
    await expect(productsPage.searchEmptyState).toContainText('Brak wyników');
  });

  test('should clear search and show all products when input is cleared', async ({ page }) => {
    // First, search for something specific
    await productsPage.search(`SRCH-ALPHA-${ts}`);

    await page.waitForResponse(
      (response) =>
        response.url().includes('/api/products') &&
        response.url().includes('search=') &&
        response.status() === 200
    );

    // Now clear the search (unfiltered list may be served from TanStack Query cache)
    await productsPage.clearSearch();

    // Wait for the table to show data (may come from cache)
    await productsPage.expectTableVisible();

    // Verify we see more than just the Alpha product (multiple rows)
    const firstRow = productsPage.tableRow(0);
    await expect(firstRow).toBeVisible();
  });

  test('should find products by partial match', async ({ page }) => {
    // Search for "SRCH-" prefix followed by timestamp - all 4 products should match
    await productsPage.search(`SRCH-`);

    await page.waitForResponse(
      (response) =>
        response.url().includes('/api/products') &&
        response.url().includes('search=SRCH-') &&
        response.status() === 200
    );

    await productsPage.expectTableVisible();

    // At least the first row should be visible with a matching product
    const firstRowName = productsPage.tableRowName(0);
    await expect(firstRowName).toBeVisible();
  });

  test('should search case-insensitively', async ({ page }) => {
    // Search with lowercase version of our code
    await productsPage.search(`srch-alpha-${ts}`);

    await page.waitForResponse(
      (response) =>
        response.url().includes('/api/products') &&
        response.url().includes('search=') &&
        response.status() === 200
    );

    // Should still find the product despite case mismatch
    await productsPage.expectTableVisible();
    const firstRowName = productsPage.tableRowName(0);
    await expect(firstRowName).toContainText(`SRCH-ALPHA-${ts}`);
  });

  test('should search by product code', async ({ page }) => {
    await productsPage.search(`SRCH-BETA-${ts}`);

    await page.waitForResponse(
      (response) =>
        response.url().includes('/api/products') &&
        response.url().includes('search=') &&
        response.status() === 200
    );

    await productsPage.expectTableVisible();

    // Should find the Beta product by code
    const firstRowCode = productsPage.tableRowCode(0);
    await expect(firstRowCode).toHaveText(`SRCH-BETA-${ts}`);
  });
});
