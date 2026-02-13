import { test, expect } from '../../fixtures/auth.fixture';
import { HistoryPage } from '../../page-objects/HistoryPage.po';
import { loginViaAPI } from '../../helpers/auth.helper';
import { createTestProduct, deleteTestProduct } from '../../helpers/product.helper';
import { createHistoryEntries } from '../../helpers/config.helper';
import { ApiHelper } from '../../helpers/api.helper';

test.describe('History Pagination', () => {
  let productId: string;
  let smallProductId: string;
  const ts = Date.now();
  const api = new ApiHelper();

  test.beforeAll(async () => {
    // Product with 25+ history entries to trigger pagination (page size = 20)
    const product = await createTestProduct({
      code: `HPAG-${ts}`,
      name: `History Pagination Test ${ts}`,
    });
    productId = product.id;
    await createHistoryEntries(productId, 'general', 25);

    // Product with few entries (no pagination needed)
    const smallProduct = await createTestProduct({
      code: `HPAG-SM-${ts}`,
      name: `History Pagination Small ${ts}`,
    });
    smallProductId = smallProduct.id;
    await createHistoryEntries(smallProductId, 'general', 3);
  });

  test.afterAll(async () => {
    await deleteTestProduct(productId);
    await deleteTestProduct(smallProductId);
  });

  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page);
  });

  test('should display "Zaladuj wiecej" button when more entries exist', async ({ page }) => {
    const historyPage = new HistoryPage(page);
    await historyPage.goto(productId);
    await historyPage.expectVisible();

    // Wait for the timeline card to be fully loaded
    await expect(historyPage.timelineCard).toBeVisible();
    await expect(historyPage.emptyState).not.toBeVisible();

    // Should show the "Zaladuj wiecej" button since there are 25 entries (> 20 page size)
    await expect(historyPage.loadMoreButton).toBeVisible();
    await expect(historyPage.loadMoreButton).toContainText('Załaduj więcej');
  });

  test('should load more entries when clicking "Zaladuj wiecej"', async ({ page }) => {
    const historyPage = new HistoryPage(page);
    await historyPage.goto(productId);
    await historyPage.expectVisible();

    await expect(historyPage.timelineCard).toBeVisible();

    // Count initially visible entry containers (first page, max 20)
    // Use filter to select only main containers (which contain child elements like time, type, etc.)
    const entrySelector = page.locator('[data-testid^="history-entry-"]').filter({
      has: page.locator('[data-testid^="history-entry-time-"]'),
    });
    await expect(entrySelector.first()).toBeVisible();
    const initialCount = await entrySelector.count();
    expect(initialCount).toBeGreaterThan(0);
    expect(initialCount).toBeLessThanOrEqual(20);

    // Click "Zaladuj wiecej"
    await expect(historyPage.loadMoreButton).toBeVisible();

    const responsePromise = page.waitForResponse(
      (res) => res.url().includes('/history') && res.status() === 200
    );
    await historyPage.clickLoadMore();
    await responsePromise;

    // After loading more, there should be more entries than before
    const updatedCount = await entrySelector.count();
    expect(updatedCount).toBeGreaterThan(initialCount);
  });

  test('should show loading state during load more', async ({ page }) => {
    const historyPage = new HistoryPage(page);
    await historyPage.goto(productId);
    await historyPage.expectVisible();

    await expect(historyPage.loadMoreButton).toBeVisible();

    // Intercept the next history API call with a delay
    let intercepted = false;
    await page.route(`**/api/products/${productId}/history*`, async (route) => {
      if (!intercepted) {
        intercepted = true;
        await new Promise((r) => setTimeout(r, 2000));
      }
      await route.continue();
    });

    // Click load more and immediately check that the button shows loading state (disabled)
    await historyPage.clickLoadMore();
    await expect(historyPage.loadMoreButton).toBeDisabled();

    // Cleanup route
    await page.unroute(`**/api/products/${productId}/history*`);
  });

  test('should hide "Zaladuj wiecej" when all entries are loaded', async ({ page }) => {
    const historyPage = new HistoryPage(page);
    await historyPage.goto(smallProductId);
    await historyPage.expectVisible();

    await expect(historyPage.timelineCard).toBeVisible();

    // For a product with only 3 entries (< 20 page size), load more should NOT be visible
    await expect(historyPage.loadMoreButton).not.toBeVisible();
  });
});
