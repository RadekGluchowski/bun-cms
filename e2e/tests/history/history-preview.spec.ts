import { test, expect } from '../../fixtures/auth.fixture';
import { HistoryPage } from '../../page-objects/HistoryPage.po';
import { HistoryPreviewDialogPO } from '../../page-objects/HistoryPreviewDialogPO.po';
import { loginViaAPI } from '../../helpers/auth.helper';
import { createTestProduct, deleteTestProduct } from '../../helpers/product.helper';
import { saveConfigDraft } from '../../helpers/config.helper';
import { ApiHelper } from '../../helpers/api.helper';

test.describe('History Preview', () => {
  let productId: string;
  const ts = Date.now();
  const api = new ApiHelper();

  test.beforeAll(async () => {
    // Create a product with multiple config versions
    const product = await createTestProduct({
      code: `HPRV-${ts}`,
      name: `History Preview Test ${ts}`,
    });
    productId = product.id;

    // Create 2 versions so we have a current and a non-current entry
    await saveConfigDraft(productId, 'general', {
      meta: { title: 'Version 1', description: 'First version', category: 'test', icon: 'Settings', schemaVersion: 1 },
      body: { v: 1, data: 'first' },
    });
    await saveConfigDraft(productId, 'general', {
      meta: { title: 'Version 2', description: 'Second version', category: 'test', icon: 'Settings', schemaVersion: 1 },
      body: { v: 2, data: 'second' },
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

  test('should open preview dialog when clicking preview button', async ({ page }) => {
    const historyPage = new HistoryPage(page);
    const previewDialog = new HistoryPreviewDialogPO(page);

    // Get entry IDs from API
    const { history } = await api.getHistory(productId);
    expect(history.length).toBeGreaterThan(0);

    const firstEntry = history[0];
    const previewButton = historyPage.entryPreviewButton(firstEntry.id);
    await expect(previewButton).toBeVisible();
    await previewButton.click();

    await previewDialog.expectOpen();
  });

  test('should display JSON data in the preview dialog', async ({ page }) => {
    const historyPage = new HistoryPage(page);
    const previewDialog = new HistoryPreviewDialogPO(page);

    const { history } = await api.getHistory(productId);
    expect(history.length).toBeGreaterThan(0);

    const firstEntry = history[0];
    await historyPage.entryPreviewButton(firstEntry.id).click();

    await previewDialog.expectOpen();
    await previewDialog.expectJsonVisible();

    // The JSON viewer should contain some actual data
    const jsonText = await previewDialog.json.textContent();
    expect(jsonText).toBeTruthy();
    expect(jsonText!.length).toBeGreaterThan(0);
  });

  test('should close preview dialog when clicking close button', async ({ page }) => {
    const historyPage = new HistoryPage(page);
    const previewDialog = new HistoryPreviewDialogPO(page);

    const { history } = await api.getHistory(productId);
    expect(history.length).toBeGreaterThan(0);

    // Open the dialog
    await historyPage.entryPreviewButton(history[0].id).click();
    await previewDialog.expectOpen();

    // Close the dialog
    await previewDialog.close();

    // Dialog should no longer be visible
    await expect(previewDialog.dialog).not.toBeVisible();
  });

  test('should show rollback button in preview for non-current version', async ({ page }) => {
    const historyPage = new HistoryPage(page);
    const previewDialog = new HistoryPreviewDialogPO(page);

    const { history } = await api.getHistory(productId);
    expect(history.length).toBeGreaterThan(1);

    // Find max version per config type
    const maxVersions: Record<string, number> = {};
    for (const entry of history) {
      if (maxVersions[entry.configType] === undefined || entry.version > maxVersions[entry.configType]) {
        maxVersions[entry.configType] = entry.version;
      }
    }

    // Find an older (non-current) entry
    const olderEntry = history.find(
      (entry) => entry.version < maxVersions[entry.configType]
    );
    expect(olderEntry).toBeTruthy();

    // Open preview for the older entry
    await historyPage.entryPreviewButton(olderEntry!.id).click();
    await previewDialog.expectOpen();

    // Rollback button should be visible for non-current version
    await previewDialog.expectRollbackButtonVisible();
  });

  test('should hide rollback button in preview for current version', async ({ page }) => {
    const historyPage = new HistoryPage(page);
    const previewDialog = new HistoryPreviewDialogPO(page);

    const { history } = await api.getHistory(productId);
    expect(history.length).toBeGreaterThan(0);

    // Find max version per config type
    const maxVersions: Record<string, number> = {};
    for (const entry of history) {
      if (maxVersions[entry.configType] === undefined || entry.version > maxVersions[entry.configType]) {
        maxVersions[entry.configType] = entry.version;
      }
    }

    // Find the current (latest) version entry
    const currentEntry = history.find(
      (entry) => entry.version === maxVersions[entry.configType]
    );
    expect(currentEntry).toBeTruthy();

    // Open preview for the current entry
    await historyPage.entryPreviewButton(currentEntry!.id).click();
    await previewDialog.expectOpen();

    // Rollback button should NOT be visible for the current version
    await previewDialog.expectRollbackButtonHidden();
  });
});
