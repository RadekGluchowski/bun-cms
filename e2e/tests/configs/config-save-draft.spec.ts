import { test, expect } from '../../fixtures/auth.fixture';
import { ConfigEditorPage } from '../../page-objects/ConfigEditorPage.po';
import { ToastPO } from '../../page-objects/ToastPO.po';
import { loginViaAPI } from '../../helpers/auth.helper';
import { createTestProduct, deleteTestProduct } from '../../helpers/product.helper';
import { saveConfigDraft, getConfig } from '../../helpers/config.helper';
import { ApiHelper } from '../../helpers/api.helper';

test.describe('Config Save Draft', () => {
  let productId: string;
  const ts = Date.now();
  const api = new ApiHelper();

  test.beforeAll(async () => {
    const product = await createTestProduct({ code: `CSAV-${ts}`, name: `Config Save Test ${ts}` });
    productId = product.id;
    await saveConfigDraft(productId, 'general', {
      meta: { title: 'Original Title', description: 'Original desc', category: 'test', icon: 'Settings' },
      body: { original: true },
    });
  });

  test.afterAll(async () => {
    await deleteTestProduct(productId);
  });

  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page);
    await page.goto(`/products/${productId}/configs/general`);
    await page.getByTestId('config-editor-meta-title-input').waitFor({ state: 'visible' });
  });

  test('should disable Save button when no changes', async ({ page }) => {
    const configEditor = new ConfigEditorPage(page);
    await configEditor.expectSaveDisabled();
  });

  test('should enable Save button when meta title is changed', async ({ page }) => {
    const configEditor = new ConfigEditorPage(page);

    // Initially save should be disabled
    await configEditor.expectSaveDisabled();

    // Make a change
    await configEditor.fillMetaTitle('Changed Title');

    // Save should now be enabled
    await configEditor.expectSaveEnabled();
  });

  test('should show "Masz niezapisane zmiany" when modified', async ({ page }) => {
    const configEditor = new ConfigEditorPage(page);

    // Initially should show no changes
    await configEditor.expectStatusText('Brak zmian');

    // Make a change
    await configEditor.fillMetaTitle('Unsaved change');

    await configEditor.expectStatusText('Masz niezapisane zmiany');
  });

  test('should save draft and show "Brak zmian" after', async ({ page }) => {
    const configEditor = new ConfigEditorPage(page);

    // Make a change
    await configEditor.fillMetaCategory('new-category-save');

    await configEditor.expectStatusText('Masz niezapisane zmiany');

    const responsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/configs/general') &&
        resp.request().method() === 'PUT' &&
        resp.status() === 200
    );

    await configEditor.clickSave();
    await responsePromise;

    await configEditor.expectStatusText('Brak zmian');
  });

  test('should show toast "Draft zapisany" after save', async ({ page }) => {
    const configEditor = new ConfigEditorPage(page);
    const toast = new ToastPO(page);

    await configEditor.fillMetaDescription('Toast test description');

    const responsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/configs/general') &&
        resp.request().method() === 'PUT' &&
        resp.status() === 200
    );

    await configEditor.clickSave();
    await responsePromise;

    await toast.expectToast('Draft zapisany');
  });

  test('should update meta title and verify via API', async ({ page }) => {
    const configEditor = new ConfigEditorPage(page);
    const toast = new ToastPO(page);

    const newTitle = `Updated Title ${ts}`;
    await configEditor.fillMetaTitle(newTitle);

    const responsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/configs/general') &&
        resp.request().method() === 'PUT' &&
        resp.status() === 200
    );

    await configEditor.clickSave();
    await responsePromise;

    await toast.expectToast('Draft zapisany');

    // Verify via API that the title was saved
    const savedConfig = await getConfig(productId, 'general');
    expect((savedConfig?.data as { meta?: { title?: string } })?.meta?.title).toBe(newTitle);
  });

  test('should update meta description and verify via API', async ({ page }) => {
    const configEditor = new ConfigEditorPage(page);
    const toast = new ToastPO(page);

    const newDescription = `Updated Description ${ts}`;
    await configEditor.fillMetaDescription(newDescription);

    const responsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/configs/general') &&
        resp.request().method() === 'PUT' &&
        resp.status() === 200
    );

    await configEditor.clickSave();
    await responsePromise;

    await toast.expectToast('Draft zapisany');

    const savedConfig = await getConfig(productId, 'general');
    expect((savedConfig?.data as { meta?: { description?: string } })?.meta?.description).toBe(newDescription);
  });

  test('should update meta category and verify via API', async ({ page }) => {
    const configEditor = new ConfigEditorPage(page);
    const toast = new ToastPO(page);

    const newCategory = `category-${ts}`;
    await configEditor.fillMetaCategory(newCategory);

    const responsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/configs/general') &&
        resp.request().method() === 'PUT' &&
        resp.status() === 200
    );

    await configEditor.clickSave();
    await responsePromise;

    await toast.expectToast('Draft zapisany');

    const savedConfig = await getConfig(productId, 'general');
    expect((savedConfig?.data as { meta?: { category?: string } })?.meta?.category).toBe(newCategory);
  });

  test('should update meta icon and verify via API', async ({ page }) => {
    const configEditor = new ConfigEditorPage(page);
    const toast = new ToastPO(page);

    const newIcon = 'Star';
    await configEditor.fillMetaIcon(newIcon);

    const responsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/configs/general') &&
        resp.request().method() === 'PUT' &&
        resp.status() === 200
    );

    await configEditor.clickSave();
    await responsePromise;

    await toast.expectToast('Draft zapisany');

    const savedConfig = await getConfig(productId, 'general');
    expect((savedConfig?.data as { meta?: { icon?: string } })?.meta?.icon).toBe(newIcon);
  });

  test('should update JSON body and verify via API', async ({ page }) => {
    const configEditor = new ConfigEditorPage(page);
    const toast = new ToastPO(page);

    const newBody = JSON.stringify({ updated: true, timestamp: ts }, null, 2);
    await configEditor.fillBody(newBody);

    const responsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/configs/general') &&
        resp.request().method() === 'PUT' &&
        resp.status() === 200
    );

    await configEditor.clickSave();
    await responsePromise;

    await toast.expectToast('Draft zapisany');

    const savedConfig = await getConfig(productId, 'general');
    const body = (savedConfig?.data as { body?: object })?.body;
    expect(body).toHaveProperty('updated', true);
    expect(body).toHaveProperty('timestamp', ts);
  });

  test('should persist changes after page reload', async ({ page }) => {
    const configEditor = new ConfigEditorPage(page);
    const toast = new ToastPO(page);

    const persistTitle = `Persisted Title ${ts}`;
    const persistDescription = `Persisted Desc ${ts}`;

    await configEditor.fillMetaTitle(persistTitle);
    await configEditor.fillMetaDescription(persistDescription);

    const responsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/configs/general') &&
        resp.request().method() === 'PUT' &&
        resp.status() === 200
    );

    await configEditor.clickSave();
    await responsePromise;

    await toast.expectToast('Draft zapisany');
    await configEditor.expectStatusText('Brak zmian');

    // Reload the page
    await page.reload();

    // Wait for the editor to load
    await expect(configEditor.metaTitleInput).toBeVisible();

    // Verify persisted values
    await expect(configEditor.metaTitleInput).toHaveValue(persistTitle);
    await expect(configEditor.metaDescriptionInput).toHaveValue(persistDescription);
    await configEditor.expectStatusText('Brak zmian');
  });

  test('should show loading state on Save button during save', async ({ page }) => {
    const configEditor = new ConfigEditorPage(page);

    // Intercept the PUT request with a delay
    await page.route('**/api/products/*/configs/general', async (route) => {
      if (route.request().method() === 'PUT') {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await route.continue();
      } else {
        await route.continue();
      }
    });

    await configEditor.fillMetaTitle('Loading state test');

    await configEditor.clickSave();

    // While saving, the button should be disabled
    await configEditor.expectSaveDisabled();

    // Wait for the response to complete
    await page.waitForResponse(
      (resp) =>
        resp.url().includes('/configs/general') &&
        resp.request().method() === 'PUT'
    );

    // After save completes, remove the route interceptor
    await page.unroute('**/api/products/*/configs/general');
  });

  test('should disable Save button during save operation', async ({ page }) => {
    const configEditor = new ConfigEditorPage(page);

    await configEditor.fillMetaTitle('Disable during save test');

    const responsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/configs/general') &&
        resp.request().method() === 'PUT' &&
        resp.status() === 200
    );

    await configEditor.clickSave();

    // Button should be disabled during the save operation
    await configEditor.expectSaveDisabled();

    await responsePromise;
  });

  test('should enable Save when different change is made after save', async ({ page }) => {
    const configEditor = new ConfigEditorPage(page);
    const toast = new ToastPO(page);

    // Make a change and save
    await configEditor.fillMetaTitle('First save');

    const responsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/configs/general') &&
        resp.request().method() === 'PUT' &&
        resp.status() === 200
    );

    await configEditor.clickSave();
    await responsePromise;

    await toast.expectToast('Draft zapisany');
    await configEditor.expectStatusText('Brak zmian');
    await configEditor.expectSaveDisabled();

    // Make a new change
    await configEditor.fillMetaTitle('Second change after save');

    // Save should be enabled again
    await configEditor.expectSaveEnabled();
    await configEditor.expectStatusText('Masz niezapisane zmiany');
  });
});
