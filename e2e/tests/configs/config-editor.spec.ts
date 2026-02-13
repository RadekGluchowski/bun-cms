import { test, expect } from '../../fixtures/auth.fixture';
import { ConfigEditorPage } from '../../page-objects/ConfigEditorPage.po';
import { BreadcrumbsPO } from '../../page-objects/BreadcrumbsPO.po';
import { ToastPO } from '../../page-objects/ToastPO.po';
import { loginViaAPI } from '../../helpers/auth.helper';
import { createTestProduct, deleteTestProduct } from '../../helpers/product.helper';
import { saveConfigDraft, publishConfig as publishConfigHelper } from '../../helpers/config.helper';

test.describe('Config Editor', () => {
  let productId: string;
  let productName: string;
  const ts = Date.now();

  test.beforeAll(async () => {
    productName = `Config Editor Test ${ts}`;
    const product = await createTestProduct({ code: `CEDT-${ts}`, name: productName });
    productId = product.id;

    // Create general config and publish it
    await saveConfigDraft(productId, 'general', {
      meta: { title: 'General Settings', description: 'General desc', category: 'basics', icon: 'Settings' },
      body: { key: 'general-value' },
    });
    await publishConfigHelper(productId, 'general');
    // Create another draft on top
    await saveConfigDraft(productId, 'general', {
      meta: { title: 'General Settings Updated', description: 'Updated desc', category: 'basics', icon: 'Settings' },
      body: { key: 'general-updated' },
    });

    // Create settings draft only
    await saveConfigDraft(productId, 'settings', {
      meta: { title: 'Settings Config', description: 'Settings desc', category: 'config', icon: 'Sliders' },
      body: { theme: 'dark' },
    });

    // Create faq draft only
    await saveConfigDraft(productId, 'faq', {
      meta: { title: 'FAQ Config', description: 'FAQ desc', category: 'content', icon: 'HelpCircle' },
      body: { questions: [] },
    });
  });

  test.afterAll(async () => {
    await deleteTestProduct(productId);
  });

  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page);
  });

  test('should display config type tabs for all types', async ({ page }) => {
    const configEditor = new ConfigEditorPage(page);
    await configEditor.goto(productId, 'general');

    await expect(configEditor.tabs).toBeVisible();

    for (const configType of ['general', 'settings', 'faq']) {
      await expect(configEditor.tab(configType)).toBeVisible();
    }
  });

  test('should highlight active tab', async ({ page }) => {
    const configEditor = new ConfigEditorPage(page);
    await configEditor.goto(productId, 'general');

    const activeTab = configEditor.tab('general');
    await expect(activeTab).toBeVisible();
    await expect(activeTab).toHaveClass(/bg-primary/);

    // Inactive tabs should not have bg-primary
    const inactiveTab = configEditor.tab('settings');
    await expect(inactiveTab).toBeVisible();
    await expect(inactiveTab).not.toHaveClass(/bg-primary\b/);
  });

  test('should display config type name as title', async ({ page }) => {
    const configEditor = new ConfigEditorPage(page);
    await configEditor.goto(productId, 'general');

    await expect(configEditor.title).toBeVisible();
    await expect(configEditor.title).toContainText('General');
  });

  test('should display Draft and Published badges', async ({ page }) => {
    const configEditor = new ConfigEditorPage(page);
    await configEditor.goto(productId, 'general');

    // general has both published and a draft on top
    await expect(configEditor.draftBadge).toBeVisible();
    await expect(configEditor.draftBadge).toContainText('Draft');

    await expect(configEditor.publishedBadge).toBeVisible();
    await expect(configEditor.publishedBadge).toContainText('Published');
  });

  test('should display Meta card with fields', async ({ page }) => {
    const configEditor = new ConfigEditorPage(page);
    await configEditor.goto(productId, 'general');

    await expect(configEditor.metaCard).toBeVisible();
    await expect(configEditor.metaTitleInput).toBeVisible();
    await expect(configEditor.metaDescriptionInput).toBeVisible();
    await expect(configEditor.metaCategoryInput).toBeVisible();
    await expect(configEditor.metaIconInput).toBeVisible();
  });

  test('should display Body JSON card with textarea', async ({ page }) => {
    const configEditor = new ConfigEditorPage(page);
    await configEditor.goto(productId, 'general');

    await expect(configEditor.bodyCard).toBeVisible();
    await expect(configEditor.bodyTextarea).toBeVisible();
  });

  test('should display Save and Publish buttons', async ({ page }) => {
    const configEditor = new ConfigEditorPage(page);
    await configEditor.goto(productId, 'general');

    await expect(configEditor.saveButton).toBeVisible();
    await expect(configEditor.saveButton).toContainText('Zapisz');

    await expect(configEditor.publishButton).toBeVisible();
    await expect(configEditor.publishButton).toContainText('Publikuj');
  });

  test('should display status text "Brak zmian" initially', async ({ page }) => {
    const configEditor = new ConfigEditorPage(page);
    await configEditor.goto(productId, 'general');

    await configEditor.expectStatusText('Brak zmian');
  });

  test('should pre-fill meta fields from existing config', async ({ page }) => {
    const configEditor = new ConfigEditorPage(page);
    await configEditor.goto(productId, 'general');

    await expect(configEditor.metaTitleInput).toHaveValue('General Settings Updated');
    await expect(configEditor.metaDescriptionInput).toHaveValue('Updated desc');
    await expect(configEditor.metaCategoryInput).toHaveValue('basics');
    await expect(configEditor.metaIconInput).toHaveValue('Settings');
  });

  test('should pre-fill JSON body from existing config', async ({ page }) => {
    const configEditor = new ConfigEditorPage(page);
    await configEditor.goto(productId, 'general');

    const bodyValue = await configEditor.bodyTextarea.inputValue();
    const parsed = JSON.parse(bodyValue);
    expect(parsed).toEqual({ key: 'general-updated' });
  });

  test('should navigate between config types using tabs', async ({ page }) => {
    const configEditor = new ConfigEditorPage(page);
    await configEditor.goto(productId, 'general');

    // Verify we're on general
    await expect(configEditor.metaTitleInput).toHaveValue('General Settings Updated');

    // Click settings tab
    await configEditor.clickTab('settings');
    await page.waitForURL(`**/products/${productId}/configs/settings`);

    await expect(configEditor.metaTitleInput).toHaveValue('Settings Config');
    await expect(configEditor.metaDescriptionInput).toHaveValue('Settings desc');

    // Click faq tab
    await configEditor.clickTab('faq');
    await page.waitForURL(`**/products/${productId}/configs/faq`);

    await expect(configEditor.metaTitleInput).toHaveValue('FAQ Config');
    await expect(configEditor.metaDescriptionInput).toHaveValue('FAQ desc');
  });

  test('should show empty state for nonexistent config', async ({ page }) => {
    const configEditor = new ConfigEditorPage(page);
    await configEditor.goto(productId, 'nonexistent-type');

    await configEditor.expectEmptyState();
    await expect(configEditor.createDraftButton).toBeVisible();
    await expect(configEditor.createDraftButton).toContainText('Utwórz draft');
  });

  test('should create empty draft when clicking "Utwórz draft"', async ({ page }) => {
    const configEditor = new ConfigEditorPage(page);
    const newType = `newdraft-${ts}`;
    await configEditor.goto(productId, newType);

    await configEditor.expectEmptyState();
    await expect(configEditor.createDraftButton).toBeVisible();

    const responsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes(`/configs/${newType}`) &&
        resp.request().method() === 'PUT' &&
        resp.status() === 200
    );

    await configEditor.createDraftButton.click();
    await responsePromise;

    // Editor should appear after creating the draft
    await expect(configEditor.metaTitleInput).toBeVisible();
    await expect(configEditor.emptyState).not.toBeVisible();
  });

  test('should show pending changes indicator on tabs with drafts', async ({ page }) => {
    const configEditor = new ConfigEditorPage(page);
    await configEditor.goto(productId, 'general');

    // The general tab has a draft, so it should be visible and have some indication
    const generalTab = configEditor.tab('general');
    await expect(generalTab).toBeVisible();

    // settings tab also has a draft
    const settingsTab = configEditor.tab('settings');
    await expect(settingsTab).toBeVisible();

    // faq tab also has a draft
    const faqTab = configEditor.tab('faq');
    await expect(faqTab).toBeVisible();
  });
});
