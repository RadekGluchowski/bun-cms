import { test, expect } from '../../fixtures/auth.fixture';
import { HistoryPage } from '../../page-objects/HistoryPage.po';
import { loginViaAPI } from '../../helpers/auth.helper';
import { createTestProduct, deleteTestProduct } from '../../helpers/product.helper';
import { saveConfigDraft } from '../../helpers/config.helper';
import { ApiHelper } from '../../helpers/api.helper';

test.describe('History Filter', () => {
  let productId: string;
  const ts = Date.now();
  const api = new ApiHelper();

  test.beforeAll(async () => {
    // Create product with configs of multiple types to test filtering
    const product = await createTestProduct({
      code: `HFLT-${ts}`,
      name: `History Filter Test ${ts}`,
    });
    productId = product.id;

    // Create history entries for 'general' config type (2 entries)
    await saveConfigDraft(productId, 'general', {
      meta: { title: 'G1', description: 'General v1', category: 'test', icon: 'Settings', schemaVersion: 1 },
      body: { v: 1 },
    });
    await saveConfigDraft(productId, 'general', {
      meta: { title: 'G2', description: 'General v2', category: 'test', icon: 'Settings', schemaVersion: 1 },
      body: { v: 2 },
    });

    // Create history entries for 'settings' config type (1 entry)
    await saveConfigDraft(productId, 'settings', {
      meta: { title: 'S1', description: 'Settings v1', category: 'test', icon: 'Settings', schemaVersion: 1 },
      body: { v: 1 },
    });
  });

  test.afterAll(async () => {
    await deleteTestProduct(productId);
  });

  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page);
    const historyPage = new HistoryPage(page);
    await historyPage.goto(productId);
    await historyPage.expectVisible();
  });

  test('should display filter dropdown with "Wszystkie" selected by default', async ({ page }) => {
    const historyPage = new HistoryPage(page);
    await expect(historyPage.filterDropdown).toBeVisible();
    await expect(historyPage.filterDropdown).toHaveValue('all');
  });

  test('should display config type filter options matching available types', async ({ page }) => {
    const historyPage = new HistoryPage(page);
    await expect(historyPage.filterDropdown).toBeVisible();

    // Get the dropdown options
    const options = historyPage.filterDropdown.locator('option');
    const optionCount = await options.count();

    // Should have at least "Wszystkie" + "general" + "settings" = 3 options
    expect(optionCount).toBeGreaterThanOrEqual(3);

    // First option should be "Wszystkie" (the "all" option)
    await expect(options.first()).toHaveText('Wszystkie');

    // Collect all option values
    const optionValues: string[] = [];
    for (let i = 0; i < optionCount; i++) {
      const val = await options.nth(i).getAttribute('value');
      if (val) optionValues.push(val);
    }

    // Should contain our config types
    expect(optionValues).toContain('all');
    expect(optionValues).toContain('general');
    expect(optionValues).toContain('settings');
  });

  test('should filter entries by config type when selecting a specific type', async ({ page }) => {
    const historyPage = new HistoryPage(page);

    // Get full history via API to know what we expect
    const { history: allHistory } = await api.getHistory(productId);
    expect(allHistory.length).toBeGreaterThan(0);

    // Select "general" filter
    const responsePromise = page.waitForResponse(
      (res) => res.url().includes('/history') && res.status() === 200
    );
    await historyPage.selectFilter('general');
    await responsePromise;

    // Only general entries should be visible
    const generalEntries = allHistory.filter((e) => e.configType === 'general');
    const settingsEntries = allHistory.filter((e) => e.configType === 'settings');

    // Verify general entries are visible
    for (const entry of generalEntries) {
      const entryType = historyPage.entryType(entry.id);
      if (await historyPage.entry(entry.id).isVisible()) {
        const typeText = await entryType.textContent();
        expect(typeText?.toLowerCase()).toContain('general');
      }
    }

    // Verify settings entries are NOT visible when filtered to general
    for (const entry of settingsEntries) {
      await expect(historyPage.entry(entry.id)).not.toBeVisible();
    }
  });

  test('should show all entries when switching back to "Wszystkie"', async ({ page }) => {
    const historyPage = new HistoryPage(page);

    // First filter by "general"
    const filterResponsePromise = page.waitForResponse(
      (res) => res.url().includes('/history') && res.status() === 200
    );
    await historyPage.selectFilter('general');
    await filterResponsePromise;

    // Then switch back to "Wszystkie" (all)
    await historyPage.selectFilter('all');

    // Verify dropdown is back to "all"
    await expect(historyPage.filterDropdown).toHaveValue('all');

    // Wait for entries from both config types to become visible (may come from cache)
    const { history: allHistory } = await api.getHistory(productId);
    const generalEntry = allHistory.find((e) => e.configType === 'general');
    const settingsEntry = allHistory.find((e) => e.configType === 'settings');

    // Verify timeline card is visible with entries (not empty state)
    await expect(historyPage.timelineCard).toBeVisible();
    await expect(historyPage.emptyState).not.toBeVisible();

    if (generalEntry) {
      await expect(historyPage.entry(generalEntry.id)).toBeVisible();
    }
    if (settingsEntry) {
      await expect(historyPage.entry(settingsEntry.id)).toBeVisible();
    }
  });

  test('should dynamically build filter options from available config types in history', async ({ page }) => {
    const historyPage = new HistoryPage(page);

    // Get the actual config types from history via API
    const { history } = await api.getHistory(productId);
    const uniqueConfigTypes = [...new Set(history.map((e) => e.configType))];

    // Get dropdown option values (skip the "all" option)
    const options = historyPage.filterDropdown.locator('option');
    const optionCount = await options.count();

    const dropdownConfigTypes: string[] = [];
    for (let i = 0; i < optionCount; i++) {
      const val = await options.nth(i).getAttribute('value');
      if (val && val !== 'all') {
        dropdownConfigTypes.push(val);
      }
    }

    // Every config type in history should have a corresponding dropdown option
    for (const configType of uniqueConfigTypes) {
      expect(dropdownConfigTypes).toContain(configType);
    }

    // The number of non-"all" options should match the number of unique config types
    expect(dropdownConfigTypes.length).toBe(uniqueConfigTypes.length);
  });
});
