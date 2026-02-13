import { test, expect } from '../../fixtures/auth.fixture';
import { ConfigEditorPage } from '../../page-objects/ConfigEditorPage.po';
import { PublishDialogPO } from '../../page-objects/PublishDialogPO.po';
import { ToastPO } from '../../page-objects/ToastPO.po';
import { loginViaAPI } from '../../helpers/auth.helper';
import { createTestProduct, deleteTestProduct } from '../../helpers/product.helper';
import { saveConfigDraft, publishConfig as publishConfigHelper, getConfig } from '../../helpers/config.helper';
import { ApiHelper } from '../../helpers/api.helper';
import { API_BASE } from '../../fixtures/test-data';

test.describe('Config Publish', () => {
  let productId: string;
  let productCode: string;
  const ts = Date.now();
  const api = new ApiHelper();

  test.beforeAll(async () => {
    productCode = `CPUB-${ts}`;
    const product = await createTestProduct({ code: productCode, name: `Config Publish Test ${ts}` });
    productId = product.id;

    // Create a draft config for the publishable type
    await saveConfigDraft(productId, 'publishable', {
      meta: { title: 'Publishable Config', description: 'Publishable desc', category: 'test', icon: 'Settings' },
      body: { ready: true },
    });

    // Create and publish a config for published-only type (no remaining draft)
    await saveConfigDraft(productId, 'published-only', {
      meta: { title: 'Published Only', description: 'Pub only desc', category: 'test', icon: 'Check' },
      body: { published: true },
    });
    await publishConfigHelper(productId, 'published-only');
  });

  test.afterAll(async () => {
    await deleteTestProduct(productId);
  });

  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page);
  });

  test('should disable Publish when no draft exists', async ({ page }) => {
    const configEditor = new ConfigEditorPage(page);
    await configEditor.goto(productId, 'published-only');

    await configEditor.expectPublishDisabled();
  });

  test('should enable Publish when draft exists', async ({ page }) => {
    const configEditor = new ConfigEditorPage(page);
    await configEditor.goto(productId, 'publishable');

    await configEditor.expectPublishEnabled();
  });

  test('should open confirmation dialog on Publish click', async ({ page }) => {
    const configEditor = new ConfigEditorPage(page);
    const publishDialog = new PublishDialogPO(page);

    await configEditor.goto(productId, 'publishable');

    await configEditor.clickPublish();

    await publishDialog.expectOpen();
  });

  test('should publish config on confirm', async ({ page }) => {
    // Create a fresh draft config to publish
    const freshType = `pub-confirm-${ts}`;
    await saveConfigDraft(productId, freshType, {
      meta: { title: 'Fresh Publish', description: 'Fresh desc', category: 'test', icon: 'Settings' },
      body: { fresh: true },
    });

    const configEditor = new ConfigEditorPage(page);
    const publishDialog = new PublishDialogPO(page);
    const toast = new ToastPO(page);

    await configEditor.goto(productId, freshType);

    await configEditor.expectPublishEnabled();
    await configEditor.clickPublish();

    await publishDialog.expectOpen();

    const responsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes(`/configs/${freshType}/publish`) &&
        resp.request().method() === 'POST' &&
        resp.status() === 200
    );

    await publishDialog.confirm();
    await responsePromise;

    // Dialog should close after publish
    await expect(publishDialog.dialog).not.toBeVisible();

    await toast.expectToast('Konfiguracja opublikowana');
  });

  test('should auto-save unsaved changes before publishing', async ({ page }) => {
    // Create a fresh draft to work with
    const autoSaveType = `pub-autosave-${ts}`;
    await saveConfigDraft(productId, autoSaveType, {
      meta: { title: 'Auto Save Title', description: 'Auto save desc', category: 'test', icon: 'Settings' },
      body: { autoSave: true },
    });

    const configEditor = new ConfigEditorPage(page);
    const publishDialog = new PublishDialogPO(page);
    const toast = new ToastPO(page);

    await configEditor.goto(productId, autoSaveType);

    // Make unsaved changes
    await configEditor.fillMetaTitle('Auto Saved Before Publish');

    await configEditor.expectStatusText('Masz niezapisane zmiany');

    // Click publish - should auto-save first
    await configEditor.clickPublish();
    await publishDialog.expectOpen();

    const responsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes(`/configs/${autoSaveType}/publish`) &&
        resp.request().method() === 'POST' &&
        resp.status() === 200
    );

    await publishDialog.confirm();
    await responsePromise;

    await toast.expectToast('Konfiguracja opublikowana');

    // Verify the changes were saved via API
    const savedConfig = await getConfig(productId, autoSaveType, 'published');
    expect((savedConfig?.data as { meta?: { title?: string } })?.meta?.title).toBe('Auto Saved Before Publish');
  });

  test('should update badges after publish', async ({ page }) => {
    // Create a fresh draft config
    const badgeType = `pub-badge-${ts}`;
    await saveConfigDraft(productId, badgeType, {
      meta: { title: 'Badge Test', description: 'Badge desc', category: 'test', icon: 'Settings' },
      body: { badges: true },
    });

    const configEditor = new ConfigEditorPage(page);
    const publishDialog = new PublishDialogPO(page);

    await configEditor.goto(productId, badgeType);

    // Before publish: draft should exist, published should not
    await expect(configEditor.draftBadge).toContainText('Draft');
    await expect(configEditor.publishedBadge).toContainText('Brak published');

    // Publish the config
    await configEditor.clickPublish();
    await publishDialog.expectOpen();

    const responsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes(`/configs/${badgeType}/publish`) &&
        resp.request().method() === 'POST' &&
        resp.status() === 200
    );

    await publishDialog.confirm();
    await responsePromise;

    // After publish: Published badge should show "Published"
    await expect(configEditor.publishedBadge).toContainText('Published');
  });

  test('should show toast "Konfiguracja opublikowana"', async ({ page }) => {
    // Create a fresh draft config
    const toastType = `pub-toast-${ts}`;
    await saveConfigDraft(productId, toastType, {
      meta: { title: 'Toast Publish', description: 'Toast desc', category: 'test', icon: 'Settings' },
      body: { toast: true },
    });

    const configEditor = new ConfigEditorPage(page);
    const publishDialog = new PublishDialogPO(page);
    const toast = new ToastPO(page);

    await configEditor.goto(productId, toastType);

    await configEditor.clickPublish();
    await publishDialog.expectOpen();

    const responsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes(`/configs/${toastType}/publish`) &&
        resp.request().method() === 'POST' &&
        resp.status() === 200
    );

    await publishDialog.confirm();
    await responsePromise;

    await toast.expectToast('Konfiguracja opublikowana');
  });

  test('should cancel publish dialog without publishing', async ({ page }) => {
    const configEditor = new ConfigEditorPage(page);
    const publishDialog = new PublishDialogPO(page);

    await configEditor.goto(productId, 'publishable');

    await configEditor.clickPublish();
    await publishDialog.expectOpen();

    await publishDialog.cancel();

    await expect(publishDialog.dialog).not.toBeVisible();

    // Verify no publish request was sent - the draft badge should still be present
    await expect(configEditor.draftBadge).toContainText('Draft');
  });

  test('should verify published config via public API', async ({ page }) => {
    // Create and publish a fresh config
    const publicType = `pub-public-${ts}`;
    await saveConfigDraft(productId, publicType, {
      meta: { title: 'Public API Test', description: 'Public desc', category: 'test', icon: 'Globe' },
      body: { public: true, data: 'visible' },
    });

    const configEditor = new ConfigEditorPage(page);
    const publishDialog = new PublishDialogPO(page);
    const toast = new ToastPO(page);

    await configEditor.goto(productId, publicType);

    await configEditor.clickPublish();
    await publishDialog.expectOpen();

    const responsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes(`/configs/${publicType}/publish`) &&
        resp.request().method() === 'POST' &&
        resp.status() === 200
    );

    await publishDialog.confirm();
    await responsePromise;

    await toast.expectToast('Konfiguracja opublikowana');

    // Verify via API the config is accessible as published
    const publishedConfig = await getConfig(productId, publicType, 'published');
    expect(publishedConfig).not.toBeNull();
    expect((publishedConfig?.data as { body?: { public?: boolean } })?.body?.public).toBe(true);
  });

  test('should show loading during publish', async ({ page }) => {
    // Create a fresh draft
    const loadingType = `pub-loading-${ts}`;
    await saveConfigDraft(productId, loadingType, {
      meta: { title: 'Loading Test', description: 'Loading desc', category: 'test', icon: 'Settings' },
      body: { loading: true },
    });

    const configEditor = new ConfigEditorPage(page);
    const publishDialog = new PublishDialogPO(page);

    await configEditor.goto(productId, loadingType);

    // Intercept the publish request with a delay
    await page.route(`**/api/products/*/configs/${loadingType}/publish`, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await route.continue();
    });

    await configEditor.clickPublish();
    await publishDialog.expectOpen();

    await publishDialog.confirm();

    // During publish, the confirm button should be disabled
    await expect(publishDialog.confirmButton).toBeDisabled();

    // Wait for response
    await page.waitForResponse(
      (resp) =>
        resp.url().includes(`/configs/${loadingType}/publish`) &&
        resp.request().method() === 'POST'
    );

    await page.unroute(`**/api/products/*/configs/${loadingType}/publish`);
  });

  test('should update status after publish', async ({ page }) => {
    // Create a fresh draft
    const statusType = `pub-status-${ts}`;
    await saveConfigDraft(productId, statusType, {
      meta: { title: 'Status Test', description: 'Status desc', category: 'test', icon: 'Settings' },
      body: { status: true },
    });

    const configEditor = new ConfigEditorPage(page);
    const publishDialog = new PublishDialogPO(page);
    const toast = new ToastPO(page);

    await configEditor.goto(productId, statusType);

    await configEditor.clickPublish();
    await publishDialog.expectOpen();

    const responsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes(`/configs/${statusType}/publish`) &&
        resp.request().method() === 'POST' &&
        resp.status() === 200
    );

    await publishDialog.confirm();
    await responsePromise;

    await toast.expectToast('Konfiguracja opublikowana');

    // After publish, status should show no changes
    await configEditor.expectStatusText('Brak zmian');
  });

  test('should allow creating new draft after publish', async ({ page }) => {
    // Create and publish a config
    const newDraftType = `pub-newdraft-${ts}`;
    await saveConfigDraft(productId, newDraftType, {
      meta: { title: 'New Draft After Publish', description: 'desc', category: 'test', icon: 'Settings' },
      body: { initial: true },
    });

    const configEditor = new ConfigEditorPage(page);
    const publishDialog = new PublishDialogPO(page);
    const toast = new ToastPO(page);

    await configEditor.goto(productId, newDraftType);

    // Publish first
    await configEditor.clickPublish();
    await publishDialog.expectOpen();

    const publishResponse = page.waitForResponse(
      (resp) =>
        resp.url().includes(`/configs/${newDraftType}/publish`) &&
        resp.request().method() === 'POST' &&
        resp.status() === 200
    );

    await publishDialog.confirm();
    await publishResponse;

    await toast.expectToast('Konfiguracja opublikowana');

    // Now make a new change to create a new draft
    await configEditor.fillMetaTitle('New Draft Title After Publish');

    await configEditor.expectSaveEnabled();
    await configEditor.expectStatusText('Masz niezapisane zmiany');

    // Save the new draft
    const saveResponse = page.waitForResponse(
      (resp) =>
        resp.url().includes(`/configs/${newDraftType}`) &&
        resp.request().method() === 'PUT' &&
        resp.status() === 200
    );

    await configEditor.clickSave();
    await saveResponse;

    await configEditor.expectStatusText('Brak zmian');
  });
});
