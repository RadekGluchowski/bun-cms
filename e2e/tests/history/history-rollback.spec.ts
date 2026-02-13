import { test, expect } from '../../fixtures/auth.fixture';
import { HistoryPage } from '../../page-objects/HistoryPage.po';
import { HistoryPreviewDialogPO } from '../../page-objects/HistoryPreviewDialogPO.po';
import { RollbackDialogPO } from '../../page-objects/RollbackDialogPO.po';
import { ToastPO } from '../../page-objects/ToastPO.po';
import { loginViaAPI } from '../../helpers/auth.helper';
import { createTestProduct, deleteTestProduct } from '../../helpers/product.helper';
import { saveConfigDraft, createHistoryEntries } from '../../helpers/config.helper';
import { ApiHelper } from '../../helpers/api.helper';

/**
 * Helper: find an older (non-current) entry from a history array.
 * Returns the first entry whose version is less than the max version
 * for its configType.
 */
function findOlderEntry(
  history: Array<{ id: string; configType: string; version: number; action: string }>
): { id: string; configType: string; version: number; action: string } | undefined {
  const maxVersions: Record<string, number> = {};
  for (const entry of history) {
    if (maxVersions[entry.configType] === undefined || entry.version > maxVersions[entry.configType]) {
      maxVersions[entry.configType] = entry.version;
    }
  }
  return history.find((entry) => entry.version < maxVersions[entry.configType]);
}

test.describe('History Rollback', () => {
  let productId: string;
  const ts = Date.now();
  const api = new ApiHelper();

  test.beforeAll(async () => {
    // Create a product with 3 config versions so rollback is possible
    const product = await createTestProduct({
      code: `HRBK-${ts}`,
      name: `History Rollback Test ${ts}`,
    });
    productId = product.id;

    await saveConfigDraft(productId, 'general', {
      meta: { title: 'Version 1', description: 'v1', category: 'test', icon: 'Settings', schemaVersion: 1 },
      body: { v: 1 },
    });
    await saveConfigDraft(productId, 'general', {
      meta: { title: 'Version 2', description: 'v2', category: 'test', icon: 'Settings', schemaVersion: 1 },
      body: { v: 2 },
    });
    await saveConfigDraft(productId, 'general', {
      meta: { title: 'Version 3', description: 'v3', category: 'test', icon: 'Settings', schemaVersion: 1 },
      body: { v: 3 },
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

  test('should open rollback confirmation dialog when clicking Rollback button', async ({ page }) => {
    const historyPage = new HistoryPage(page);
    const rollbackDialog = new RollbackDialogPO(page);

    const { history } = await api.getHistory(productId);
    expect(history.length).toBeGreaterThan(1);

    const olderEntry = findOlderEntry(history);
    expect(olderEntry).toBeTruthy();

    // Click the rollback button on the older entry
    const rollbackButton = historyPage.entryRollbackButton(olderEntry!.id);
    await expect(rollbackButton).toBeVisible();
    await rollbackButton.click();

    // Rollback confirmation dialog should appear
    await rollbackDialog.expectOpen();
  });

  test('should create new draft on rollback confirm and show new entry in timeline', async ({ page }) => {
    const historyPage = new HistoryPage(page);
    const rollbackDialog = new RollbackDialogPO(page);

    // Get history before rollback
    const { history: beforeHistory } = await api.getHistory(productId);
    expect(beforeHistory.length).toBeGreaterThan(1);

    const olderEntry = findOlderEntry(beforeHistory);
    expect(olderEntry).toBeTruthy();

    // Click rollback on the older entry
    await historyPage.entryRollbackButton(olderEntry!.id).click();
    await rollbackDialog.expectOpen();

    // Wait for the rollback API response, then confirm
    const responsePromise = page.waitForResponse(
      (res) => res.url().includes('/rollback') && res.status() === 200
    );
    await rollbackDialog.confirm();
    await responsePromise;

    // The dialog should close
    await expect(rollbackDialog.dialog).not.toBeVisible();

    // Verify a new rollback entry was created in history via API
    const { history: afterHistory } = await api.getHistory(productId);
    expect(afterHistory.length).toBeGreaterThan(beforeHistory.length);

    // There should be at least one entry with action "rollback"
    const rollbackEntries = afterHistory.filter((e) => e.action === 'rollback');
    expect(rollbackEntries.length).toBeGreaterThan(0);
  });

  test('should show toast "Rollback wykonany" after successful rollback', async ({ page }) => {
    const historyPage = new HistoryPage(page);
    const rollbackDialog = new RollbackDialogPO(page);
    const toast = new ToastPO(page);

    // Create additional versions to ensure we have a non-current entry to roll back
    await createHistoryEntries(productId, 'general', 2);

    // Reload the history page
    await historyPage.goto(productId);
    await historyPage.expectVisible();

    const { history } = await api.getHistory(productId);
    expect(history.length).toBeGreaterThan(1);

    const olderEntry = findOlderEntry(history);
    expect(olderEntry).toBeTruthy();

    // Perform rollback
    await historyPage.entryRollbackButton(olderEntry!.id).click();
    await rollbackDialog.expectOpen();

    const responsePromise = page.waitForResponse(
      (res) => res.url().includes('/rollback') && res.status() === 200
    );
    await rollbackDialog.confirm();
    await responsePromise;

    // Verify toast notification
    await toast.expectToast('Rollback wykonany');
  });

  test('should show rollback action entry in timeline after rollback', async ({ page }) => {
    const historyPage = new HistoryPage(page);
    const rollbackDialog = new RollbackDialogPO(page);

    // Create additional versions for a fresh rollback
    await createHistoryEntries(productId, 'general', 2);

    await historyPage.goto(productId);
    await historyPage.expectVisible();

    const { history } = await api.getHistory(productId);
    const olderEntry = findOlderEntry(history);
    expect(olderEntry).toBeTruthy();

    // Perform rollback
    await historyPage.entryRollbackButton(olderEntry!.id).click();
    await rollbackDialog.expectOpen();

    const responsePromise = page.waitForResponse(
      (res) => res.url().includes('/rollback') && res.status() === 200
    );
    await rollbackDialog.confirm();
    await responsePromise;

    // Wait for history to refresh on the page
    await page.waitForResponse(
      (res) => res.url().includes('/history') && res.status() === 200
    );

    // Fetch updated history and find the rollback entry
    const { history: updatedHistory } = await api.getHistory(productId);
    const rollbackEntry = updatedHistory.find((e) => e.action === 'rollback');
    expect(rollbackEntry).toBeTruthy();

    // Verify the rollback entry is visible in the timeline with "Rollback" badge
    await expect(historyPage.entry(rollbackEntry!.id)).toBeVisible();
    await expect(historyPage.entryAction(rollbackEntry!.id)).toContainText('Rollback');
  });

  test('should cancel rollback without making any changes', async ({ page }) => {
    const historyPage = new HistoryPage(page);
    const rollbackDialog = new RollbackDialogPO(page);

    const { history: beforeHistory } = await api.getHistory(productId);
    expect(beforeHistory.length).toBeGreaterThan(1);

    const olderEntry = findOlderEntry(beforeHistory);
    expect(olderEntry).toBeTruthy();

    // Open rollback dialog
    await historyPage.entryRollbackButton(olderEntry!.id).click();
    await rollbackDialog.expectOpen();

    // Cancel the rollback
    await rollbackDialog.cancel();

    // Dialog should close
    await expect(rollbackDialog.dialog).not.toBeVisible();

    // Verify no new entries were created - history count unchanged
    const { history: afterHistory } = await api.getHistory(productId);
    expect(afterHistory.length).toBe(beforeHistory.length);
  });

  test('should rollback from preview dialog', async ({ page }) => {
    const historyPage = new HistoryPage(page);
    const previewDialog = new HistoryPreviewDialogPO(page);
    const rollbackDialog = new RollbackDialogPO(page);
    const toast = new ToastPO(page);

    // Create additional versions to ensure a non-current entry exists
    await createHistoryEntries(productId, 'general', 2);

    await historyPage.goto(productId);
    await historyPage.expectVisible();

    const { history } = await api.getHistory(productId);
    const olderEntry = findOlderEntry(history);
    expect(olderEntry).toBeTruthy();

    // Open preview of the older version
    await historyPage.entryPreviewButton(olderEntry!.id).click();
    await previewDialog.expectOpen();
    await previewDialog.expectRollbackButtonVisible();

    // Click rollback from within the preview dialog
    await previewDialog.clickRollback();

    // Rollback confirmation dialog should appear
    await rollbackDialog.expectOpen();

    // Confirm the rollback
    const responsePromise = page.waitForResponse(
      (res) => res.url().includes('/rollback') && res.status() === 200
    );
    await rollbackDialog.confirm();
    await responsePromise;

    // Verify toast notification
    await toast.expectToast('Rollback wykonany');

    // Verify rollback entry was created
    const { history: afterHistory } = await api.getHistory(productId);
    const rollbackEntries = afterHistory.filter((e) => e.action === 'rollback');
    expect(rollbackEntries.length).toBeGreaterThan(0);
  });

  test('should show loading state on confirm button during rollback', async ({ page }) => {
    const historyPage = new HistoryPage(page);
    const rollbackDialog = new RollbackDialogPO(page);

    // Create additional versions for a fresh rollback
    await createHistoryEntries(productId, 'general', 2);

    await historyPage.goto(productId);
    await historyPage.expectVisible();

    const { history } = await api.getHistory(productId);
    const olderEntry = findOlderEntry(history);
    expect(olderEntry).toBeTruthy();

    // Intercept rollback API with a delay to observe loading state
    await page.route(`**/api/products/${productId}/configs/*/rollback/*`, async (route) => {
      await new Promise((r) => setTimeout(r, 2000));
      await route.continue();
    });

    // Open rollback dialog
    await historyPage.entryRollbackButton(olderEntry!.id).click();
    await rollbackDialog.expectOpen();

    // Click confirm and immediately check that the button becomes disabled (loading state)
    await rollbackDialog.confirm();
    await expect(rollbackDialog.confirmButton).toBeDisabled();

    // Cleanup route and wait for completion
    await page.unroute(`**/api/products/${productId}/configs/*/rollback/*`);
  });
});
