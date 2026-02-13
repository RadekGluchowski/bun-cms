import { test, expect } from '../../fixtures/auth.fixture';
import { ConfigEditorPage } from '../../page-objects/ConfigEditorPage.po';
import { ProductDetailPage } from '../../page-objects/ProductDetailPage.po';
import { AddConfigDialogPO } from '../../page-objects/AddConfigDialogPO.po';
import { ToastPO } from '../../page-objects/ToastPO.po';
import { loginViaAPI } from '../../helpers/auth.helper';
import { createTestProduct, deleteTestProduct } from '../../helpers/product.helper';
import { saveConfigDraft } from '../../helpers/config.helper';

test.describe('Config Create', () => {
  let productId: string;
  const ts = Date.now();

  test.beforeAll(async () => {
    const product = await createTestProduct({ code: `CCRT-${ts}`, name: `Config Create Test ${ts}` });
    productId = product.id;
    // Create one config to test duplicate validation
    await saveConfigDraft(productId, 'existing-type');
  });

  test.afterAll(async () => {
    await deleteTestProduct(productId);
  });

  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page);
    await page.goto(`/products/${productId}`);
    await page.getByTestId('product-detail-add-config-card').waitFor({ state: 'visible' });
  });

  test('should open dialog when clicking add config card', async ({ page }) => {
    const productDetail = new ProductDetailPage(page);
    const dialog = new AddConfigDialogPO(page);

    await productDetail.clickAddConfig();

    await dialog.expectOpen();
    await expect(dialog.dialog).toContainText('Nowa konfiguracja');
  });

  test('should display input with placeholder "np. promocje"', async ({ page }) => {
    const productDetail = new ProductDetailPage(page);
    const dialog = new AddConfigDialogPO(page);

    await productDetail.clickAddConfig();
    await dialog.expectOpen();

    await expect(dialog.typeInput).toBeVisible();
    await expect(dialog.typeInput).toHaveAttribute('placeholder', 'np. promocje');
  });

  test('should display "Utwórz" and "Anuluj" buttons', async ({ page }) => {
    const productDetail = new ProductDetailPage(page);
    const dialog = new AddConfigDialogPO(page);

    await productDetail.clickAddConfig();
    await dialog.expectOpen();

    await expect(dialog.submitButton).toBeVisible();
    await expect(dialog.submitButton).toContainText('Utwórz');
    await expect(dialog.cancelButton).toBeVisible();
    await expect(dialog.cancelButton).toContainText('Anuluj');
  });

  test('should create new config type and navigate to editor', async ({ page }) => {
    const productDetail = new ProductDetailPage(page);
    const dialog = new AddConfigDialogPO(page);
    const newConfigType = `promotions-${ts}`;

    await productDetail.clickAddConfig();
    await dialog.expectOpen();
    await dialog.fillType(newConfigType);

    const responsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes(`/configs/${newConfigType}`) &&
        resp.request().method() === 'PUT' &&
        resp.status() === 200
    );

    await dialog.submit();
    await responsePromise;

    await page.waitForURL(`**/products/${productId}/configs/${newConfigType}`);

    const configEditor = new ConfigEditorPage(page);
    await expect(configEditor.title).toBeVisible();
  });

  test('should validate empty name', async ({ page }) => {
    const productDetail = new ProductDetailPage(page);
    const dialog = new AddConfigDialogPO(page);

    await productDetail.clickAddConfig();
    await dialog.expectOpen();

    // Type something then clear to trigger validation
    await dialog.fillType('a');
    await dialog.typeInput.clear();

    await dialog.submitWithEnter();

    await dialog.expectError('Nazwa typu jest wymagana');
  });

  test('should validate invalid characters', async ({ page }) => {
    const productDetail = new ProductDetailPage(page);
    const dialog = new AddConfigDialogPO(page);

    await productDetail.clickAddConfig();
    await dialog.expectOpen();

    // Starts with number - invalid
    await dialog.fillType('123invalid');
    await dialog.submit();

    await dialog.expectError('Dozwolone znaki: litery, cyfry, myślnik, podkreślenie. Musi zaczynać się od litery');
  });

  test('should validate max length', async ({ page }) => {
    const productDetail = new ProductDetailPage(page);
    const dialog = new AddConfigDialogPO(page);

    await productDetail.clickAddConfig();
    await dialog.expectOpen();

    // Type 101 characters (starts with letter)
    const longName = 'a' + 'b'.repeat(100);
    await dialog.fillType(longName);
    await dialog.submit();

    await dialog.expectError('Maksymalna długość to 100 znaków');
  });

  test('should validate duplicate name', async ({ page }) => {
    const productDetail = new ProductDetailPage(page);
    const dialog = new AddConfigDialogPO(page);

    await productDetail.clickAddConfig();
    await dialog.expectOpen();

    await dialog.fillType('existing-type');
    await dialog.submit();

    await dialog.expectError('Typ konfiguracji o tej nazwie już istnieje');
  });

  test('should submit on Enter key', async ({ page }) => {
    const productDetail = new ProductDetailPage(page);
    const dialog = new AddConfigDialogPO(page);
    const enterType = `entertype-${ts}`;

    await productDetail.clickAddConfig();
    await dialog.expectOpen();
    await dialog.fillType(enterType);

    const responsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes(`/configs/${enterType}`) &&
        resp.request().method() === 'PUT' &&
        resp.status() === 200
    );

    await dialog.submitWithEnter();
    await responsePromise;

    await page.waitForURL(`**/products/${productId}/configs/${enterType}`);
  });

  test('should clear form when dialog reopens', async ({ page }) => {
    const productDetail = new ProductDetailPage(page);
    const dialog = new AddConfigDialogPO(page);

    await productDetail.clickAddConfig();
    await dialog.expectOpen();

    await dialog.fillType('some-value');

    // Close dialog
    await dialog.cancel();
    await expect(dialog.dialog).not.toBeVisible();

    // Reopen dialog
    await productDetail.clickAddConfig();
    await dialog.expectOpen();

    await expect(dialog.typeInput).toHaveValue('');
  });

  test('should close dialog on cancel', async ({ page }) => {
    const productDetail = new ProductDetailPage(page);
    const dialog = new AddConfigDialogPO(page);

    await productDetail.clickAddConfig();
    await dialog.expectOpen();

    await dialog.fillType('should-not-create');
    await dialog.cancel();

    await expect(dialog.dialog).not.toBeVisible();

    // Verify we're still on the product detail page and the config was not created
    await expect(productDetail.title).toBeVisible();
    const configCard = productDetail.configCard('should-not-create');
    await expect(configCard).not.toBeVisible();
  });

  test('should validate name must start with letter', async ({ page }) => {
    const productDetail = new ProductDetailPage(page);
    const dialog = new AddConfigDialogPO(page);

    await productDetail.clickAddConfig();
    await dialog.expectOpen();

    // Starts with hyphen - invalid
    await dialog.fillType('-invalid');
    await dialog.submit();

    await dialog.expectError('Dozwolone znaki: litery, cyfry, myślnik, podkreślenie. Musi zaczynać się od litery');
  });
});
