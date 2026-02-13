import { test, expect } from '../../fixtures/auth.fixture';
import { ConfigEditorPage } from '../../page-objects/ConfigEditorPage.po';
import { ToastPO } from '../../page-objects/ToastPO.po';
import { loginViaAPI } from '../../helpers/auth.helper';
import { createTestProduct, deleteTestProduct } from '../../helpers/product.helper';
import { saveConfigDraft } from '../../helpers/config.helper';

test.describe('Config Validation', () => {
  let productId: string;
  const ts = Date.now();

  test.beforeAll(async () => {
    const product = await createTestProduct({ code: `CVAL-${ts}`, name: `Config Validation Test ${ts}` });
    productId = product.id;
    await saveConfigDraft(productId, 'general', {
      meta: { title: 'Valid Title', description: 'desc', category: 'test', icon: 'Settings' },
      body: { valid: true },
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

  test('should show "Tytuł jest wymagany" when title is cleared', async ({ page }) => {
    const configEditor = new ConfigEditorPage(page);

    // Wait for the title input to be pre-filled
    await expect(configEditor.metaTitleInput).not.toHaveValue('');

    // Clear the title
    await configEditor.metaTitleInput.clear();
    // Trigger blur/change by clicking elsewhere
    await configEditor.metaDescriptionInput.click();

    await expect(configEditor.metaTitleError).toBeVisible();
    await expect(configEditor.metaTitleError).toContainText('Tytuł jest wymagany');
  });

  test('should disable Save button with validation errors', async ({ page }) => {
    const configEditor = new ConfigEditorPage(page);

    await expect(configEditor.metaTitleInput).not.toHaveValue('');

    // Clear title to create a validation error
    await configEditor.metaTitleInput.clear();
    await configEditor.metaDescriptionInput.click();

    await expect(configEditor.metaTitleError).toBeVisible();

    // Save should be disabled due to validation errors
    await configEditor.expectSaveDisabled();
  });

  test('should disable Publish button with validation errors', async ({ page }) => {
    const configEditor = new ConfigEditorPage(page);

    await expect(configEditor.metaTitleInput).not.toHaveValue('');

    // Clear title to create a validation error
    await configEditor.metaTitleInput.clear();
    await configEditor.metaDescriptionInput.click();

    await expect(configEditor.metaTitleError).toBeVisible();

    // Publish should be disabled due to validation errors
    await configEditor.expectPublishDisabled();
  });

  test('should show "Napraw błędy przed zapisem/publikacją" status', async ({ page }) => {
    const configEditor = new ConfigEditorPage(page);

    await expect(configEditor.metaTitleInput).not.toHaveValue('');

    // Clear title to create a validation error
    await configEditor.metaTitleInput.clear();
    await configEditor.metaDescriptionInput.click();

    await expect(configEditor.metaTitleError).toBeVisible();

    await configEditor.expectStatusText('Napraw błędy przed zapisem/publikacją');
  });

  test('should show JSON error when invalid JSON is typed', async ({ page }) => {
    const configEditor = new ConfigEditorPage(page);

    // Type invalid JSON
    await configEditor.fillBody('{ invalid json }');

    await expect(configEditor.bodyError).toBeVisible();
  });

  test('should clear JSON error when valid JSON is entered', async ({ page }) => {
    const configEditor = new ConfigEditorPage(page);

    // First type invalid JSON
    await configEditor.fillBody('{ invalid json }');
    await expect(configEditor.bodyError).toBeVisible();

    // Now type valid JSON
    await configEditor.fillBody('{"valid": true}');
    await expect(configEditor.bodyError).not.toBeVisible();
  });

  test('should clear meta title error when title is filled', async ({ page }) => {
    const configEditor = new ConfigEditorPage(page);

    await expect(configEditor.metaTitleInput).not.toHaveValue('');

    // Clear title to trigger error
    await configEditor.metaTitleInput.clear();
    await configEditor.metaDescriptionInput.click();

    await expect(configEditor.metaTitleError).toBeVisible();
    await expect(configEditor.metaTitleError).toContainText('Tytuł jest wymagany');

    // Fill the title back in
    await configEditor.fillMetaTitle('Restored Title');

    // Error should be gone
    await expect(configEditor.metaTitleError).not.toBeVisible();

    // Status text should no longer show validation error message
    await configEditor.expectStatusText('Masz niezapisane zmiany');
  });

  test('should show error for empty JSON body', async ({ page }) => {
    const configEditor = new ConfigEditorPage(page);

    // Clear body completely
    await configEditor.bodyTextarea.clear();

    // Trigger blur by clicking elsewhere
    await configEditor.metaTitleInput.click();

    await expect(configEditor.bodyError).toBeVisible();
  });

  test('should handle multiple validation errors simultaneously', async ({ page }) => {
    const configEditor = new ConfigEditorPage(page);

    await expect(configEditor.metaTitleInput).not.toHaveValue('');

    // Clear title to trigger title error
    await configEditor.metaTitleInput.clear();
    await configEditor.metaDescriptionInput.click();

    // Type invalid JSON to trigger body error
    await configEditor.fillBody('{ invalid json }');

    // Both errors should be visible
    await expect(configEditor.metaTitleError).toBeVisible();
    await expect(configEditor.metaTitleError).toContainText('Tytuł jest wymagany');
    await expect(configEditor.bodyError).toBeVisible();

    // Save and Publish should both be disabled
    await configEditor.expectSaveDisabled();
    await configEditor.expectPublishDisabled();

    // Status should show error message
    await configEditor.expectStatusText('Napraw błędy przed zapisem/publikacją');
  });
});
