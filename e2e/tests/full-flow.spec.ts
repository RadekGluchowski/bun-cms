import { test, expect } from '@playwright/test';
import { LoginPage } from '../page-objects/LoginPage.po';
import { ProductsListPage } from '../page-objects/ProductsListPage.po';
import { ProductFormDialogPO } from '../page-objects/ProductFormDialogPO.po';
import { ProductDetailPage } from '../page-objects/ProductDetailPage.po';
import { ConfigEditorPage } from '../page-objects/ConfigEditorPage.po';
import { AddConfigDialogPO } from '../page-objects/AddConfigDialogPO.po';
import { PublishDialogPO } from '../page-objects/PublishDialogPO.po';
import { HistoryPage } from '../page-objects/HistoryPage.po';
import { HistoryPreviewDialogPO } from '../page-objects/HistoryPreviewDialogPO.po';
import { RollbackDialogPO } from '../page-objects/RollbackDialogPO.po';
import { DeleteProductDialogPO } from '../page-objects/DeleteProductDialogPO.po';
import { ProductJsonDialogPO } from '../page-objects/ProductJsonDialogPO.po';
import { SidebarPO } from '../page-objects/Sidebar.po';
import { BreadcrumbsPO } from '../page-objects/BreadcrumbsPO.po';
import { ToastPO } from '../page-objects/ToastPO.po';
import { ADMIN, SEED_PRODUCT } from '../fixtures/test-data';
import { ApiHelper } from '../helpers/api.helper';

const api = new ApiHelper();
const ts = Date.now();
const PRODUCT_CODE = `FLOW-${ts}`;
const PRODUCT_NAME = `Full Flow Product ${ts}`;
const PRODUCT_DESC = 'E2E full flow test description';
const PRODUCT_URL = 'https://preview.example.com/flow';
const CONFIG_TYPE = 'pricing';

test.describe('Full CMS Flow — end-to-end lifecycle', () => {
  // Generous timeout for the comprehensive flow (24+ steps)
  test.setTimeout(300_000);

  let productId: string;

  test.afterAll(async () => {
    // Safety cleanup in case the test fails midway
    if (productId) {
      await api.login();
      await api.deleteProduct(productId).catch(() => {});
    }
    await api.cleanupTestProducts(`FLOW-${ts}`);
  });

  test('complete CMS lifecycle: login → create → config → publish → history → rollback → delete → logout', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const productsPage = new ProductsListPage(page);
    const formDialog = new ProductFormDialogPO(page);
    const productDetail = new ProductDetailPage(page);
    const configEditor = new ConfigEditorPage(page);
    const addConfigDialog = new AddConfigDialogPO(page);
    const publishDialog = new PublishDialogPO(page);
    const historyPage = new HistoryPage(page);
    const historyPreview = new HistoryPreviewDialogPO(page);
    const rollbackDialog = new RollbackDialogPO(page);
    const deleteDialog = new DeleteProductDialogPO(page);
    const jsonDialog = new ProductJsonDialogPO(page);
    const sidebar = new SidebarPO(page);
    const breadcrumbs = new BreadcrumbsPO(page);
    const toast = new ToastPO(page);

    // ═══════════════════════════════════════════════════════════
    // STEP 1: Login via UI
    // ═══════════════════════════════════════════════════════════
    await test.step('Login via UI with valid credentials', async () => {
      await loginPage.goto();
      await loginPage.expectVisible();

      await loginPage.login(ADMIN.email, ADMIN.password);
      await loginPage.expectRedirectToProducts();
    });

    // ═══════════════════════════════════════════════════════════
    // STEP 2: Verify Products List page structure
    // ═══════════════════════════════════════════════════════════
    await test.step('Verify products list page elements', async () => {
      await productsPage.expectVisible();
      await expect(productsPage.pageTitle).toHaveText('Produkty');
      await expect(productsPage.addButton).toContainText('Dodaj produkt');
      await expect(productsPage.searchInput).toBeVisible();
      await productsPage.expectTableVisible();

      // Verify sidebar
      await sidebar.expectVisible();
    });

    // ═══════════════════════════════════════════════════════════
    // STEP 3: Search for seed product
    // ═══════════════════════════════════════════════════════════
    await test.step('Search for seed product and verify results', async () => {
      await productsPage.search(SEED_PRODUCT.code);

      await page.waitForResponse(
        (res) =>
          res.url().includes('/api/products') &&
          res.url().includes(`search=${SEED_PRODUCT.code}`) &&
          res.status() === 200
      );

      await productsPage.expectTableVisible();
      await expect(productsPage.tableRowCode(0)).toHaveText(SEED_PRODUCT.code);
      await expect(productsPage.tableRowName(0)).toHaveText(SEED_PRODUCT.name);

      // Clear search
      await productsPage.clearSearch();
    });

    // ═══════════════════════════════════════════════════════════
    // STEP 4: Create a new product via UI form
    // ═══════════════════════════════════════════════════════════
    await test.step('Create new product with all fields', async () => {
      await productsPage.clickAdd();
      await formDialog.expectOpen();

      // Verify dialog title
      await expect(formDialog.dialog).toContainText('Nowy produkt');

      // Fill all fields
      await formDialog.fillCode(PRODUCT_CODE);
      await formDialog.fillName(PRODUCT_NAME);
      await formDialog.fillDescription(PRODUCT_DESC);
      await formDialog.fillPreviewUrl(PRODUCT_URL);

      // Submit and capture response
      const responsePromise = page.waitForResponse(
        (res) =>
          res.url().includes('/api/products') &&
          res.request().method() === 'POST' &&
          (res.status() === 200 || res.status() === 201)
      );

      await formDialog.submit();

      const response = await responsePromise;
      const body = await response.json();
      productId = body.id;

      // Dialog should close
      await formDialog.expectClosed();

      // Toast should confirm creation
      await toast.expectToast('Produkt utworzony');
    });

    // ═══════════════════════════════════════════════════════════
    // STEP 5: Search for the new product and navigate to detail
    // ═══════════════════════════════════════════════════════════
    await test.step('Find new product and navigate to detail page', async () => {
      const expectedCode = PRODUCT_CODE.toUpperCase();
      await productsPage.search(expectedCode);

      await page.waitForResponse(
        (res) =>
          res.url().includes('/api/products') &&
          res.url().includes('search=') &&
          res.status() === 200
      );

      await productsPage.expectTableVisible();
      await expect(productsPage.tableRowCode(0)).toHaveText(expectedCode);

      // Click product name to navigate to detail
      await productsPage.clickProductName(0);
      await page.waitForURL(/\/products\/[a-zA-Z0-9-]+$/);
    });

    // ═══════════════════════════════════════════════════════════
    // STEP 6: Verify product detail page
    // ═══════════════════════════════════════════════════════════
    await test.step('Verify product detail page elements', async () => {
      await productDetail.expectVisible();

      // Info card
      await expect(productDetail.infoCard).toBeVisible();
      await expect(productDetail.title).toContainText(PRODUCT_NAME);

      // Action buttons
      await expect(productDetail.historyButton).toBeVisible();
      await expect(productDetail.editButton).toBeVisible();
      await expect(productDetail.jsonButton).toBeVisible();

      // Configs section with add card
      await expect(productDetail.configsSection).toBeVisible();
      await expect(productDetail.addConfigCard).toBeVisible();
    });

    // ═══════════════════════════════════════════════════════════
    // STEP 7: Edit product via dialog
    // ═══════════════════════════════════════════════════════════
    await test.step('Edit product name and description', async () => {
      await productDetail.clickEdit();
      await formDialog.expectOpen();

      // Verify edit dialog title
      await expect(formDialog.dialog).toContainText('Edytuj produkt');

      // Code should be disabled in edit mode
      await formDialog.expectCodeDisabled();

      // Change name
      const updatedName = `${PRODUCT_NAME} Updated`;
      await formDialog.fillName(updatedName);

      const updatePromise = page.waitForResponse(
        (res) =>
          res.url().includes(`/api/products/${productId}`) &&
          res.request().method() === 'PUT' &&
          res.status() === 200
      );

      await formDialog.submit();
      await updatePromise;

      await formDialog.expectClosed();

      // Verify updated name on detail page
      await expect(productDetail.title).toContainText(updatedName);
    });

    // ═══════════════════════════════════════════════════════════
    // STEP 8: Add a new config type via AddConfigDialog
    // ═══════════════════════════════════════════════════════════
    await test.step('Add new config type via dialog', async () => {
      await productDetail.clickAddConfig();
      await addConfigDialog.expectOpen();

      await addConfigDialog.fillType(CONFIG_TYPE);
      await addConfigDialog.submit();

      // Should navigate to config editor for the new type
      await page.waitForURL(`**/products/${productId}/configs/${CONFIG_TYPE}`);
    });

    // ═══════════════════════════════════════════════════════════
    // STEP 9: Verify config editor loaded with empty draft
    // ═══════════════════════════════════════════════════════════
    await test.step('Verify config editor loaded with empty draft from AddConfigDialog', async () => {
      // AddConfigDialog already creates an empty draft on submit, so the editor should appear directly
      await expect(configEditor.metaTitleInput).toBeVisible({ timeout: 10_000 });
      await expect(configEditor.emptyState).not.toBeVisible();
    });

    // ═══════════════════════════════════════════════════════════
    // STEP 10: Fill config meta fields and body, save draft
    // ═══════════════════════════════════════════════════════════
    await test.step('Fill config fields and save draft', async () => {
      // Fill meta fields
      await configEditor.fillMetaTitle('Pricing Configuration');
      await configEditor.fillMetaDescription('Product pricing settings');
      await configEditor.fillMetaCategory('business');
      await configEditor.fillMetaIcon('DollarSign');

      // Fill body JSON
      await configEditor.fillBody(JSON.stringify({ basePrice: 99.99, currency: 'PLN' }, null, 2));

      // Status should indicate unsaved changes
      await configEditor.expectStatusText('niezapisane zmiany');

      // Save draft
      const savePromise = page.waitForResponse(
        (res) =>
          res.url().includes(`/configs/${CONFIG_TYPE}`) &&
          res.request().method() === 'PUT' &&
          res.status() === 200
      );

      await configEditor.clickSave();
      await savePromise;

      await toast.expectToast('Draft zapisany');

      // Status should reset
      await configEditor.expectStatusText('Brak zmian');

      // Draft badge should be visible
      await expect(configEditor.draftBadge).toBeVisible();
    });

    // ═══════════════════════════════════════════════════════════
    // STEP 11: Publish the config
    // ═══════════════════════════════════════════════════════════
    await test.step('Publish the config', async () => {
      await configEditor.clickPublish();
      await publishDialog.expectOpen();

      const publishPromise = page.waitForResponse(
        (res) =>
          res.url().includes(`/configs/${CONFIG_TYPE}/publish`) &&
          res.request().method() === 'POST' &&
          res.status() === 200
      );

      await publishDialog.confirm();
      await publishPromise;

      await toast.expectToast('Konfiguracja opublikowana');

      // Published badge should appear
      await expect(configEditor.publishedBadge).toBeVisible();
    });

    // ═══════════════════════════════════════════════════════════
    // STEP 12: Create another draft (edit config after publish)
    // ═══════════════════════════════════════════════════════════
    await test.step('Edit config after publish — create new draft', async () => {
      // Change meta title
      await configEditor.fillMetaTitle('Pricing Configuration v2');

      // Change body
      await configEditor.fillBody(JSON.stringify(
        { basePrice: 129.99, currency: 'PLN', discount: 10 },
        null, 2
      ));

      await configEditor.expectStatusText('niezapisane zmiany');

      const savePromise = page.waitForResponse(
        (res) =>
          res.url().includes(`/configs/${CONFIG_TYPE}`) &&
          res.request().method() === 'PUT' &&
          res.status() === 200
      );

      await configEditor.clickSave();
      await savePromise;

      await toast.expectToast('Draft zapisany');

      // Both badges should be visible (draft + published)
      await expect(configEditor.draftBadge).toBeVisible();
      await expect(configEditor.publishedBadge).toBeVisible();
    });

    // ═══════════════════════════════════════════════════════════
    // STEP 13: Navigate to product detail via breadcrumbs
    // ═══════════════════════════════════════════════════════════
    await test.step('Navigate back to product detail via breadcrumbs', async () => {
      // Breadcrumb index 1 should be the product name (0 = "Produkty")
      await breadcrumbs.clickBreadcrumb(1);
      await page.waitForURL(`**/products/${productId}`);
      await productDetail.expectVisible();
    });

    // ═══════════════════════════════════════════════════════════
    // STEP 14: Verify config card on product detail shows badges
    // ═══════════════════════════════════════════════════════════
    await test.step('Verify config card shows draft and published badges', async () => {
      const configCard = productDetail.configCard(CONFIG_TYPE);
      await expect(configCard).toBeVisible();

      await expect(productDetail.configCardDraftBadge(CONFIG_TYPE)).toBeVisible();
      await expect(productDetail.configCardPublishedBadge(CONFIG_TYPE)).toBeVisible();
    });

    // ═══════════════════════════════════════════════════════════
    // STEP 15: View product JSON export
    // ═══════════════════════════════════════════════════════════
    await test.step('Open product JSON export dialog', async () => {
      await productDetail.clickJson();
      await jsonDialog.expectOpen();

      // JSON should contain product data
      const jsonText = await jsonDialog.getJsonText();
      expect(jsonText).toBeTruthy();
      expect(jsonText.length).toBeGreaterThan(10);

      // Close the dialog
      await page.keyboard.press('Escape');
    });

    // ═══════════════════════════════════════════════════════════
    // STEP 16: Navigate to history page from product detail
    // ═══════════════════════════════════════════════════════════
    await test.step('Navigate to history page', async () => {
      await productDetail.clickHistory();
      await page.waitForURL(`**/products/${productId}/history`);
      await historyPage.expectVisible();
    });

    // ═══════════════════════════════════════════════════════════
    // STEP 17: Verify history entries exist
    // ═══════════════════════════════════════════════════════════
    await test.step('Verify history page shows entries', async () => {
      await expect(historyPage.timelineCard).toBeVisible();

      // Wait for at least one history entry to appear (API might take a moment)
      const entries = page.locator('[data-testid^="history-entry-"]').filter({
        has: page.locator('[data-testid^="history-entry-time-"]'),
      });
      await expect(entries.first()).toBeVisible({ timeout: 15_000 });

      // Empty state should not be visible when entries exist
      await expect(historyPage.emptyState).not.toBeVisible();

      // Filter dropdown should be visible with "Wszystkie" selected
      await expect(historyPage.filterDropdown).toBeVisible();
      await expect(historyPage.filterDropdown).toHaveValue('all');
    });

    // ═══════════════════════════════════════════════════════════
    // STEP 18: Filter history by config type
    // ═══════════════════════════════════════════════════════════
    await test.step('Filter history entries by config type', async () => {
      await historyPage.selectFilter(CONFIG_TYPE);
      await expect(historyPage.filterDropdown).toHaveValue(CONFIG_TYPE);

      // Wait for filtered entries to load
      await expect(historyPage.timelineCard).toBeVisible({ timeout: 10_000 });

      // Switch back to all
      await historyPage.selectFilter('all');
      await expect(historyPage.filterDropdown).toHaveValue('all');
      await expect(historyPage.timelineCard).toBeVisible({ timeout: 10_000 });
    });

    // ═══════════════════════════════════════════════════════════
    // STEP 19: Preview a history entry
    // ═══════════════════════════════════════════════════════════
    await test.step('Preview a history entry', async () => {
      // Get first entry's ID via API
      const { history } = await api.getHistory(productId);
      expect(history.length).toBeGreaterThan(0);

      const firstEntry = history[0];
      const previewButton = historyPage.entryPreviewButton(firstEntry.id);

      // The entry might need to be visible first
      await expect(historyPage.entry(firstEntry.id)).toBeVisible();
      await previewButton.click();

      await historyPreview.expectOpen();
      await historyPreview.expectJsonVisible();

      // Close preview
      await historyPreview.close();
    });

    // ═══════════════════════════════════════════════════════════
    // STEP 20: Rollback to a previous version
    // ═══════════════════════════════════════════════════════════
    await test.step('Rollback to a previous history version', async () => {
      // Get history entries — we want to rollback to the first (publish) entry
      const { history } = await api.getHistory(productId, { configType: CONFIG_TYPE });
      // Find a create or publish entry to rollback to
      const rollbackTarget = history.find((e) => e.action === 'publish') ?? history[history.length - 1];
      expect(rollbackTarget).toBeTruthy();

      const rollbackButton = historyPage.entryRollbackButton(rollbackTarget.id);
      await expect(historyPage.entry(rollbackTarget.id)).toBeVisible();
      await rollbackButton.click();

      await rollbackDialog.expectOpen();

      const rollbackPromise = page.waitForResponse(
        (res) =>
          res.url().includes('/rollback') &&
          res.request().method() === 'POST' &&
          res.status() === 200
      );

      await rollbackDialog.confirm();
      await rollbackPromise;

      await toast.expectToast('Rollback wykonany');
    });

    // ═══════════════════════════════════════════════════════════
    // STEP 21: Navigate to products list via sidebar
    // ═══════════════════════════════════════════════════════════
    await test.step('Navigate to products list via sidebar', async () => {
      await sidebar.clickProducts();
      await page.waitForURL('**/products');
      await productsPage.expectVisible();
    });

    // ═══════════════════════════════════════════════════════════
    // STEP 22: Delete the test product
    // ═══════════════════════════════════════════════════════════
    await test.step('Delete the test product', async () => {
      const expectedCode = PRODUCT_CODE.toUpperCase();
      await productsPage.search(expectedCode);

      await page.waitForResponse(
        (res) =>
          res.url().includes('/api/products') &&
          res.url().includes('search=') &&
          res.status() === 200
      );

      await productsPage.expectTableVisible();
      await productsPage.clickDeleteProduct(0);

      await deleteDialog.expectOpen();

      const deletePromise = page.waitForResponse(
        (res) =>
          res.url().includes(`/api/products/`) &&
          res.request().method() === 'DELETE' &&
          res.status() === 200
      );

      await deleteDialog.confirm();
      await deletePromise;

      // Product should no longer appear
      await productsPage.expectSearchEmptyState();

      // Clear productId so afterAll cleanup doesn't fail
      productId = '';
    });

    // ═══════════════════════════════════════════════════════════
    // STEP 23: Logout via sidebar
    // ═══════════════════════════════════════════════════════════
    await test.step('Logout via sidebar', async () => {
      // First navigate to products (might be on empty search)
      await productsPage.clearSearch();
      await productsPage.expectTableVisible();

      await sidebar.clickLogout();
      await page.waitForURL('**/login');

      // Login page should be visible
      await loginPage.expectVisible();
    });

    // ═══════════════════════════════════════════════════════════
    // STEP 24: Verify protected route redirect
    // ═══════════════════════════════════════════════════════════
    await test.step('Verify protected routes redirect to login', async () => {
      // Try to access protected route without auth
      await page.goto('/products');
      await page.waitForURL('**/login', { timeout: 10_000 });
      expect(page.url()).toContain('/login');
    });
  });
});
