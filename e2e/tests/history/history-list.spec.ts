import { test, expect } from '../../fixtures/auth.fixture';
import { HistoryPage } from '../../page-objects/HistoryPage.po';
import { HistoryPreviewDialogPO } from '../../page-objects/HistoryPreviewDialogPO.po';
import { BreadcrumbsPO } from '../../page-objects/BreadcrumbsPO.po';
import { loginViaAPI } from '../../helpers/auth.helper';
import { createTestProduct, deleteTestProduct } from '../../helpers/product.helper';
import {
  saveConfigDraft,
  publishConfig as publishConfigHelper,
} from '../../helpers/config.helper';
import { ApiHelper } from '../../helpers/api.helper';

test.describe('History List', () => {
  let productId: string;
  let productName: string;
  let emptyProductId: string;
  const ts = Date.now();
  const api = new ApiHelper();

  test.beforeAll(async () => {
    // Product with history: create draft, update, publish
    const product = await createTestProduct({
      code: `HLST-${ts}`,
      name: `History List Test ${ts}`,
    });
    productId = product.id;
    productName = product.name;

    await saveConfigDraft(productId, 'general', {
      meta: { title: 'V1', description: 'desc', category: 'test', icon: 'Settings', schemaVersion: 1 },
      body: { v: 1 },
    });
    await saveConfigDraft(productId, 'general', {
      meta: { title: 'V2', description: 'desc', category: 'test', icon: 'Settings', schemaVersion: 1 },
      body: { v: 2 },
    });
    await publishConfigHelper(productId, 'general');

    // Product without any configs (empty history)
    const empty = await createTestProduct({
      code: `HLST-EMPTY-${ts}`,
      name: `Empty History ${ts}`,
    });
    emptyProductId = empty.id;
  });

  test.afterAll(async () => {
    await deleteTestProduct(productId);
    await deleteTestProduct(emptyProductId);
  });

  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page);
  });

  test('should display page title "Historia zmian"', async ({ page }) => {
    const historyPage = new HistoryPage(page);
    await historyPage.goto(productId);
    await historyPage.expectVisible();
    await expect(historyPage.pageTitle).toContainText('Historia zmian');
  });

  test('should display breadcrumbs: Produkty > Product Name > Historia', async ({ page }) => {
    const historyPage = new HistoryPage(page);
    await historyPage.goto(productId);
    await historyPage.expectVisible();

    const breadcrumbs = new BreadcrumbsPO(page);
    await breadcrumbs.expectVisible();
    await breadcrumbs.expectBreadcrumbs(['Produkty', productName, 'Historia']);
  });

  test('should display timeline card with entries', async ({ page }) => {
    const historyPage = new HistoryPage(page);
    await historyPage.goto(productId);
    await historyPage.expectVisible();

    await expect(historyPage.timelineCard).toBeVisible();
    // Should NOT show empty state since we have history entries
    await expect(historyPage.emptyState).not.toBeVisible();
  });

  test('should display entry with time, config type, version, and action', async ({ page }) => {
    const historyPage = new HistoryPage(page);
    await historyPage.goto(productId);
    await historyPage.expectVisible();

    // Get first entry from API to know its UUID
    const { history } = await api.getHistory(productId);
    expect(history.length).toBeGreaterThan(0);
    const firstEntry = history[0];

    await expect(historyPage.entryTime(firstEntry.id)).toBeVisible();
    await expect(historyPage.entryType(firstEntry.id)).toBeVisible();
    await expect(historyPage.entryVersion(firstEntry.id)).toBeVisible();
    await expect(historyPage.entryAction(firstEntry.id)).toBeVisible();
  });

  test('should display action badges with correct Polish labels', async ({ page }) => {
    const historyPage = new HistoryPage(page);
    await historyPage.goto(productId);
    await historyPage.expectVisible();

    const { history } = await api.getHistory(productId);
    expect(history.length).toBeGreaterThan(0);

    const validActionLabels = ['Utworzono', 'Edycja', 'Publikacja', 'Rollback'];

    for (const entry of history) {
      const actionBadge = historyPage.entryAction(entry.id);
      if (await actionBadge.isVisible()) {
        const text = await actionBadge.textContent();
        expect(validActionLabels).toContain(text?.trim());
      }
    }

    // Specifically verify that a publish entry has "Publikacja" badge
    const publishEntry = history.find((h) => h.action === 'publish');
    if (publishEntry) {
      await expect(historyPage.entryAction(publishEntry.id)).toContainText('Publikacja');
    }
  });

  test('should display preview button with "Podgląd" text on entries', async ({ page }) => {
    const historyPage = new HistoryPage(page);
    await historyPage.goto(productId);
    await historyPage.expectVisible();

    const { history } = await api.getHistory(productId);
    expect(history.length).toBeGreaterThan(0);

    const previewButton = historyPage.entryPreviewButton(history[0].id);
    await expect(previewButton).toBeVisible();
    await expect(previewButton).toContainText('Podgląd');
  });

  test('should display rollback button only on non-current versions', async ({ page }) => {
    const historyPage = new HistoryPage(page);
    await historyPage.goto(productId);
    await historyPage.expectVisible();

    const { history } = await api.getHistory(productId);
    expect(history.length).toBeGreaterThan(1);

    // Build max version per configType
    const maxVersions: Record<string, number> = {};
    for (const entry of history) {
      if (maxVersions[entry.configType] === undefined || entry.version > maxVersions[entry.configType]) {
        maxVersions[entry.configType] = entry.version;
      }
    }

    for (const entry of history) {
      const entryEl = historyPage.entry(entry.id);
      if (!(await entryEl.isVisible())) continue;

      if (entry.version === maxVersions[entry.configType]) {
        // Current version: rollback button should NOT be visible
        await expect(historyPage.entryRollbackButton(entry.id)).not.toBeVisible();
      } else {
        // Old version: rollback button SHOULD be visible
        await expect(historyPage.entryRollbackButton(entry.id)).toBeVisible();
      }
    }
  });

  test('should show empty state when product has no history', async ({ page }) => {
    const historyPage = new HistoryPage(page);
    await historyPage.goto(emptyProductId);
    await expect(historyPage.pageTitle).toBeVisible();
    await historyPage.expectEmptyState();
  });

  test('should show loading skeleton while history data is loading', async ({ page }) => {
    // Intercept history API with a delay to observe loading state
    await page.route(`**/api/products/${productId}/history*`, async (route) => {
      await new Promise((r) => setTimeout(r, 2000));
      await route.continue();
    });

    const historyPage = new HistoryPage(page);
    await page.goto(`/products/${productId}/history`);
    await historyPage.expectLoadingSkeleton();

    // Cleanup route so subsequent requests proceed normally
    await page.unroute(`**/api/products/${productId}/history*`);
  });

  test('should group entries by date with "Dzisiaj" for today', async ({ page }) => {
    const historyPage = new HistoryPage(page);
    await historyPage.goto(productId);
    await historyPage.expectVisible();

    // Entries created during beforeAll happened today, so they should
    // appear under the "Dzisiaj" date group
    await expect(historyPage.dateGroup('Dzisiaj')).toBeVisible();
  });
});
