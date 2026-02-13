/**
 * Demo recording — full CMS walkthrough at human pace.
 *
 * Run:  npx playwright test tests/demo.spec.ts --headed
 * Video is saved to:  e2e/test-results/
 *
 * This test is NOT part of the regular suite (skipped by default).
 * Remove `.skip` or run with `--grep demo` to execute it.
 */
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
import { AdminsPagePO } from '../page-objects/AdminsPage.po';
import { AdminFormDialogPO } from '../page-objects/AdminFormDialogPO.po';
import { DeleteAdminDialogPO } from '../page-objects/DeleteAdminDialogPO.po';
import { ADMIN, EDITOR } from '../fixtures/test-data';
import { ApiHelper } from '../helpers/api.helper';

// ── Force video recording and larger viewport for demo ──────────────
test.use({
  video: 'on',
  viewport: { width: 1440, height: 900 },
});

// ── Human-like delays ───────────────────────────────────────────────
const TYPING_DELAY = 60;       // ms between keystrokes
const PAUSE_SHORT = 600;       // quick glance
const PAUSE_MEDIUM = 1200;     // read a section
const PAUSE_LONG = 2000;       // admire the result

/** Type text character-by-character like a real user */
async function humanType(locator: import('@playwright/test').Locator, text: string) {
  await locator.click();
  await locator.clear();
  await locator.pressSequentially(text, { delay: TYPING_DELAY });
}

// ── Test data ───────────────────────────────────────────────────────
const PRODUCT_CODE = 'INSURANCE-HOME';
const PRODUCT_NAME = 'Ubezpieczenie Domowe';
const PRODUCT_DESC = 'Kompleksowe ubezpieczenie nieruchomości mieszkalnych';
const PRODUCT_URL = 'https://preview.viennainsurance.com/home';
const CONFIG_TYPE = 'pricing';
const DEMO_EDITOR_EMAIL = 'demo-editor@example.com';
const DEMO_EDITOR_NAME = 'Jan Kowalski';

const api = new ApiHelper();

test.describe('CMS Demo — Full Application Walkthrough', () => {
  test.setTimeout(600_000); // 10 min for the slow demo

  let productId: string;

  // ── Clean up leftover data from previous failed runs ────────────────
  test.beforeAll(async () => {
    await api.login();

    // Delete ALL non-seed products (not just by search — iterate everything)
    const { products } = await api.getProducts({ limit: 100 });
    for (const p of products) {
      if (p.code !== 'SAMPLE') {
        await api.deleteProduct(p.id).catch(() => {});
      }
    }

    // Delete demo editor if it exists
    try {
      const { admins } = await api.listAdmins();
      const demoEditor = admins.find((a) => a.email === DEMO_EDITOR_EMAIL);
      if (demoEditor) {
        await api.deleteAdmin(demoEditor.id);
      }
    } catch {
      // Ignore
    }
  });

  test.afterAll(async () => {
    if (productId) {
      await api.login();
      await api.deleteProduct(productId).catch(() => {});
    }
    await api.cleanupTestProducts(PRODUCT_CODE);

    // Clean up demo editor
    try {
      await api.login();
      const { admins } = await api.listAdmins();
      const demoEditor = admins.find((a) => a.email === DEMO_EDITOR_EMAIL);
      if (demoEditor) {
        await api.deleteAdmin(demoEditor.id);
      }
    } catch {
      // Ignore cleanup failures
    }
  });

  test('Complete CMS demo walkthrough', async ({ page }) => {
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
    const adminsPagePO = new AdminsPagePO(page);
    const adminFormDialog = new AdminFormDialogPO(page);
    const deleteAdminDialog = new DeleteAdminDialogPO(page);

    const pause = (ms: number) => page.waitForTimeout(ms);

    // ═════════════════════════════════════════════════════════════════
    //  1. LOGIN AS ADMIN
    // ═════════════════════════════════════════════════════════════════
    await test.step('Login as admin', async () => {
      await loginPage.goto();
      await loginPage.expectVisible();
      await pause(PAUSE_MEDIUM);

      await humanType(loginPage.emailInput, ADMIN.email);
      await pause(PAUSE_SHORT);
      await humanType(loginPage.passwordInput, ADMIN.password);
      await pause(PAUSE_SHORT);

      await loginPage.submitButton.click();
      await loginPage.expectRedirectToProducts();
      await pause(PAUSE_LONG);
    });

    // ═════════════════════════════════════════════════════════════════
    //  2. BROWSE PRODUCTS LIST
    // ═════════════════════════════════════════════════════════════════
    await test.step('Browse products list', async () => {
      await productsPage.expectVisible();
      await productsPage.expectTableVisible();
      await pause(PAUSE_LONG);

      await humanType(productsPage.searchInput, 'Sample');
      await pause(PAUSE_MEDIUM);

      await productsPage.searchInput.clear();
      await pause(PAUSE_MEDIUM);
    });

    // ═════════════════════════════════════════════════════════════════
    //  3. CREATE NEW PRODUCT
    // ═════════════════════════════════════════════════════════════════
    await test.step('Create new product', async () => {
      await productsPage.clickAdd();
      await formDialog.expectOpen();
      await pause(PAUSE_MEDIUM);

      await humanType(formDialog.codeInput, PRODUCT_CODE);
      await pause(PAUSE_SHORT);
      await humanType(formDialog.nameInput, PRODUCT_NAME);
      await pause(PAUSE_SHORT);
      await humanType(formDialog.descriptionInput, PRODUCT_DESC);
      await pause(PAUSE_SHORT);
      await humanType(formDialog.previewUrlInput, PRODUCT_URL);
      await pause(PAUSE_MEDIUM);

      const responsePromise = page.waitForResponse(
        (res) =>
          res.url().includes('/api/products') &&
          res.request().method() === 'POST'
      );
      await formDialog.submit();
      const response = await responsePromise;
      expect(response.status(), 'Product creation should succeed (200/201)').toBeLessThan(300);
      const body = await response.json();
      productId = body.id;

      await formDialog.expectClosed();
      await toast.expectToast('Produkt utworzony');
      await pause(PAUSE_LONG);
    });

    // ═════════════════════════════════════════════════════════════════
    //  4. FIND & OPEN THE NEW PRODUCT
    // ═════════════════════════════════════════════════════════════════
    await test.step('Search and open new product', async () => {
      await humanType(productsPage.searchInput, PRODUCT_CODE);
      await expect(productsPage.tableRowCode(0)).toContainText(PRODUCT_CODE, { timeout: 10_000 });
      await pause(PAUSE_MEDIUM);

      await productsPage.clickProductName(0);
      await page.waitForURL(/\/products\/[a-zA-Z0-9-]+$/);
      await productDetail.expectVisible();
      await pause(PAUSE_LONG);
    });

    // ═════════════════════════════════════════════════════════════════
    //  5. EDIT PRODUCT
    // ═════════════════════════════════════════════════════════════════
    await test.step('Edit product details', async () => {
      await productDetail.clickEdit();
      await formDialog.expectOpen();
      await pause(PAUSE_MEDIUM);

      const updatedName = `${PRODUCT_NAME} Premium`;
      await humanType(formDialog.nameInput, updatedName);
      await pause(PAUSE_SHORT);

      const updatePromise = page.waitForResponse(
        (res) =>
          res.url().includes(`/api/products/${productId}`) &&
          res.request().method() === 'PUT' &&
          res.status() === 200
      );
      await formDialog.submit();
      await updatePromise;

      await formDialog.expectClosed();
      await expect(productDetail.title).toContainText(updatedName);
      await pause(PAUSE_LONG);
    });

    // ═════════════════════════════════════════════════════════════════
    //  6. ADD NEW CONFIG TYPE
    // ═════════════════════════════════════════════════════════════════
    await test.step('Add config type', async () => {
      await productDetail.clickAddConfig();
      await addConfigDialog.expectOpen();
      await pause(PAUSE_SHORT);

      await humanType(addConfigDialog.typeInput, CONFIG_TYPE);
      await pause(PAUSE_SHORT);

      await addConfigDialog.submit();
      await page.waitForURL(`**/products/${productId}/configs/${CONFIG_TYPE}`);
      await expect(configEditor.metaTitleInput).toBeVisible({ timeout: 10_000 });
      await pause(PAUSE_LONG);
    });

    // ═════════════════════════════════════════════════════════════════
    //  7. FILL CONFIG & SAVE DRAFT
    // ═════════════════════════════════════════════════════════════════
    await test.step('Fill config fields and save draft', async () => {
      await humanType(configEditor.metaTitleInput, 'Cennik podstawowy');
      await pause(PAUSE_SHORT);
      await humanType(configEditor.metaDescriptionInput, 'Ustawienia cennika ubezpieczenia');
      await pause(PAUSE_SHORT);
      await humanType(configEditor.metaCategoryInput, 'finanse');
      await pause(PAUSE_SHORT);
      await humanType(configEditor.metaIconInput, 'DollarSign');
      await pause(PAUSE_SHORT);

      const jsonBody = JSON.stringify(
        {
          waluta: 'PLN',
          cenaBazowa: 249.99,
          skladkaMiesieczna: 29.99,
          zakres: ['ogien', 'zalanie', 'kradziez'],
        },
        null,
        2
      );
      await configEditor.bodyTextarea.click();
      await configEditor.bodyTextarea.clear();
      await configEditor.bodyTextarea.fill(jsonBody);
      await pause(PAUSE_MEDIUM);

      const savePromise = page.waitForResponse(
        (res) =>
          res.url().includes(`/configs/${CONFIG_TYPE}`) &&
          res.request().method() === 'PUT' &&
          res.status() === 200
      );
      await configEditor.clickSave();
      await savePromise;

      await toast.expectToast('Draft zapisany');
      await pause(PAUSE_LONG);
    });

    // ═════════════════════════════════════════════════════════════════
    //  8. PUBLISH CONFIG
    // ═════════════════════════════════════════════════════════════════
    await test.step('Publish configuration', async () => {
      await configEditor.clickPublish();
      await publishDialog.expectOpen();
      await pause(PAUSE_MEDIUM);

      const publishPromise = page.waitForResponse(
        (res) =>
          res.url().includes(`/configs/${CONFIG_TYPE}/publish`) &&
          res.request().method() === 'POST' &&
          res.status() === 200
      );
      await publishDialog.confirm();
      await publishPromise;

      await toast.expectToast('Konfiguracja opublikowana');
      await expect(configEditor.publishedBadge).toBeVisible();
      await pause(PAUSE_LONG);
    });

    // ═════════════════════════════════════════════════════════════════
    //  9. EDIT CONFIG AGAIN (new draft after publish)
    // ═════════════════════════════════════════════════════════════════
    await test.step('Create new draft after publish', async () => {
      await humanType(configEditor.metaTitleInput, 'Cennik premium');
      await pause(PAUSE_SHORT);

      const updatedBody = JSON.stringify(
        {
          waluta: 'PLN',
          cenaBazowa: 399.99,
          skladkaMiesieczna: 49.99,
          zakres: ['ogien', 'zalanie', 'kradziez', 'OC', 'NNW'],
          rabat: 15,
        },
        null,
        2
      );
      await configEditor.bodyTextarea.click();
      await configEditor.bodyTextarea.clear();
      await configEditor.bodyTextarea.fill(updatedBody);
      await pause(PAUSE_MEDIUM);

      const savePromise = page.waitForResponse(
        (res) =>
          res.url().includes(`/configs/${CONFIG_TYPE}`) &&
          res.request().method() === 'PUT' &&
          res.status() === 200
      );
      await configEditor.clickSave();
      await savePromise;

      await toast.expectToast('Draft zapisany');
      await expect(configEditor.draftBadge).toBeVisible();
      await expect(configEditor.publishedBadge).toBeVisible();
      await pause(PAUSE_LONG);
    });

    // ═════════════════════════════════════════════════════════════════
    // 10. NAVIGATE BACK VIA BREADCRUMBS
    // ═════════════════════════════════════════════════════════════════
    await test.step('Navigate via breadcrumbs', async () => {
      await pause(PAUSE_SHORT);
      await breadcrumbs.clickBreadcrumb(1);
      await page.waitForURL(`**/products/${productId}`);
      await productDetail.expectVisible();
      await pause(PAUSE_LONG);
    });

    // ═════════════════════════════════════════════════════════════════
    // 11. VIEW JSON EXPORT
    // ═════════════════════════════════════════════════════════════════
    await test.step('View JSON export', async () => {
      await productDetail.clickJson();
      await jsonDialog.expectOpen();
      await pause(PAUSE_LONG);

      await page.keyboard.press('Escape');
      await pause(PAUSE_SHORT);
    });

    // ═════════════════════════════════════════════════════════════════
    // 12. OPEN HISTORY PAGE
    // ═════════════════════════════════════════════════════════════════
    await test.step('Open history page', async () => {
      await productDetail.clickHistory();
      await page.waitForURL(`**/products/${productId}/history`);
      await historyPage.expectVisible();

      const entries = page.locator('[data-testid^="history-entry-"]').filter({
        has: page.locator('[data-testid^="history-entry-time-"]'),
      });
      await expect(entries.first()).toBeVisible({ timeout: 15_000 });
      await pause(PAUSE_LONG);
    });

    // ═════════════════════════════════════════════════════════════════
    // 13. FILTER HISTORY
    // ═════════════════════════════════════════════════════════════════
    await test.step('Filter history by config type', async () => {
      await historyPage.selectFilter(CONFIG_TYPE);
      await expect(historyPage.filterDropdown).toHaveValue(CONFIG_TYPE);
      await pause(PAUSE_MEDIUM);

      await historyPage.selectFilter('all');
      await expect(historyPage.filterDropdown).toHaveValue('all');
      await pause(PAUSE_MEDIUM);
    });

    // ═════════════════════════════════════════════════════════════════
    // 14. PREVIEW HISTORY ENTRY
    // ═════════════════════════════════════════════════════════════════
    await test.step('Preview history entry', async () => {
      const { history } = await api.getHistory(productId);
      expect(history.length).toBeGreaterThan(0);

      const firstEntry = history[0];
      await expect(historyPage.entry(firstEntry.id)).toBeVisible();
      await historyPage.entryPreviewButton(firstEntry.id).click();

      await historyPreview.expectOpen();
      await historyPreview.expectJsonVisible();
      await pause(PAUSE_LONG);

      await historyPreview.close();
      await pause(PAUSE_SHORT);
    });

    // ═════════════════════════════════════════════════════════════════
    // 15. ROLLBACK TO PREVIOUS VERSION
    // ═════════════════════════════════════════════════════════════════
    await test.step('Rollback to previous version', async () => {
      const { history } = await api.getHistory(productId, { configType: CONFIG_TYPE });
      const rollbackTarget = history.find((e) => e.action === 'publish') ?? history[history.length - 1];
      expect(rollbackTarget).toBeTruthy();

      await expect(historyPage.entry(rollbackTarget.id)).toBeVisible();
      await historyPage.entryRollbackButton(rollbackTarget.id).click();

      await rollbackDialog.expectOpen();
      await pause(PAUSE_MEDIUM);

      const rollbackPromise = page.waitForResponse(
        (res) => res.url().includes('/rollback') && res.request().method() === 'POST' && res.status() === 200
      );
      await rollbackDialog.confirm();
      await rollbackPromise;

      await toast.expectToast('Rollback wykonany');
      await pause(PAUSE_LONG);
    });

    // ═════════════════════════════════════════════════════════════════
    // 16. COMMAND PALETTE SEARCH
    // ═════════════════════════════════════════════════════════════════
    await test.step('Use command palette search', async () => {
      await page.keyboard.press('Control+k');
      const paletteInput = page.getByTestId('command-palette-input');
      await expect(paletteInput).toBeVisible();
      await pause(PAUSE_SHORT);

      await humanType(paletteInput, 'Sample');
      await pause(PAUSE_MEDIUM);

      await page.keyboard.press('Escape');
      await pause(PAUSE_SHORT);
    });

    // ═════════════════════════════════════════════════════════════════
    // 17. ADMIN MANAGEMENT — CREATE EDITOR USER
    // ═════════════════════════════════════════════════════════════════
    await test.step('Navigate to admin management page', async () => {
      await sidebar.expectAdminsNavVisible();
      await sidebar.clickAdmins();
      await page.waitForURL('**/admins');
      await adminsPagePO.expectVisible();
      await pause(PAUSE_LONG);
    });

    await test.step('Create a new editor user', async () => {
      await adminsPagePO.clickAdd();
      await adminFormDialog.expectOpen();
      await pause(PAUSE_MEDIUM);

      await humanType(adminFormDialog.emailInput, DEMO_EDITOR_EMAIL);
      await pause(PAUSE_SHORT);
      await humanType(adminFormDialog.passwordInput, 'editor123!@#');
      await pause(PAUSE_SHORT);
      await humanType(adminFormDialog.nameInput, DEMO_EDITOR_NAME);
      await pause(PAUSE_SHORT);
      await adminFormDialog.selectRole('editor');
      await pause(PAUSE_SHORT);

      const createResponse = page.waitForResponse(
        (res) =>
          res.url().includes('/api/admins') &&
          res.request().method() === 'POST' &&
          (res.status() === 200 || res.status() === 201)
      );
      await adminFormDialog.submit();
      await createResponse;

      await adminFormDialog.expectClosed();
      await toast.expectToast('Użytkownik utworzony');
      await pause(PAUSE_LONG);

      await expect(page.getByText(DEMO_EDITOR_EMAIL)).toBeVisible({ timeout: 5000 });
    });

    // ═════════════════════════════════════════════════════════════════
    // 18. SWITCH TO EDITOR — SHOW RESTRICTED UI
    // ═════════════════════════════════════════════════════════════════
    await test.step('Logout admin and login as editor', async () => {
      await sidebar.clickLogout();
      await page.waitForURL('**/login');
      await loginPage.expectVisible();
      await pause(PAUSE_MEDIUM);

      await humanType(loginPage.emailInput, EDITOR.email);
      await pause(PAUSE_SHORT);
      await humanType(loginPage.passwordInput, EDITOR.password);
      await pause(PAUSE_SHORT);

      await loginPage.submitButton.click();
      await loginPage.expectRedirectToProducts();
      await pause(PAUSE_LONG);
    });

    await test.step('Editor sees restricted sidebar', async () => {
      await sidebar.expectVisible();
      await sidebar.expectAdminsNavHidden();
      await pause(PAUSE_MEDIUM);
    });

    await test.step('Editor cannot see delete button on products', async () => {
      await productsPage.expectTableVisible();
      await expect(productsPage.tableRowDeleteButton(0)).not.toBeVisible();
      await pause(PAUSE_MEDIUM);
    });

    await test.step('Editor cannot see publish button on config', async () => {
      await humanType(productsPage.searchInput, PRODUCT_CODE);
      await expect(productsPage.tableRowCode(0)).toContainText(PRODUCT_CODE, { timeout: 10_000 });
      await pause(PAUSE_MEDIUM);

      await productsPage.clickProductName(0);
      await page.waitForURL(/\/products\/[a-zA-Z0-9-]+$/);
      await productDetail.expectVisible();
      await pause(PAUSE_MEDIUM);

      await productDetail.clickConfigEdit(CONFIG_TYPE);
      await page.waitForURL(`**/configs/${CONFIG_TYPE}`);
      await expect(configEditor.metaTitleInput).toBeVisible({ timeout: 10_000 });
      await pause(PAUSE_MEDIUM);

      await expect(configEditor.publishButton).not.toBeVisible();
      await expect(configEditor.saveButton).toBeVisible();
      await pause(PAUSE_LONG);
    });

    // ═════════════════════════════════════════════════════════════════
    // 19. LOGIN BACK AS ADMIN, DELETE PRODUCT, CLEANUP, LOGOUT
    // ═════════════════════════════════════════════════════════════════
    await test.step('Logout editor and login back as admin', async () => {
      await sidebar.clickLogout();
      await page.waitForURL('**/login');
      await pause(PAUSE_SHORT);

      await humanType(loginPage.emailInput, ADMIN.email);
      await pause(PAUSE_SHORT);
      await humanType(loginPage.passwordInput, ADMIN.password);
      await pause(PAUSE_SHORT);

      await loginPage.submitButton.click();
      await loginPage.expectRedirectToProducts();
      await pause(PAUSE_MEDIUM);
    });

    await test.step('Delete product', async () => {
      await humanType(productsPage.searchInput, PRODUCT_CODE);
      await expect(productsPage.tableRowCode(0)).toContainText(PRODUCT_CODE, { timeout: 10_000 });
      await pause(PAUSE_MEDIUM);

      await productsPage.clickDeleteProduct(0);
      await deleteDialog.expectOpen();
      await pause(PAUSE_MEDIUM);

      const deletePromise = page.waitForResponse(
        (res) =>
          res.url().includes('/api/products/') && res.request().method() === 'DELETE' && res.status() === 200
      );
      await deleteDialog.confirm();
      await deletePromise;

      await productsPage.expectSearchEmptyState();
      productId = '';
      await pause(PAUSE_LONG);
    });

    await test.step('Delete demo editor user', async () => {
      await sidebar.clickAdmins();
      await page.waitForURL('**/admins');
      await adminsPagePO.expectVisible();
      await pause(PAUSE_MEDIUM);

      const rows = page.locator('[data-testid^="admins-table-row-email-"]');
      const count = await rows.count();

      for (let i = 0; i < count; i++) {
        const email = await adminsPagePO.tableRowEmail(i).textContent();
        if (email === DEMO_EDITOR_EMAIL) {
          await adminsPagePO.clickDeleteAdmin(i);
          await deleteAdminDialog.expectOpen();
          await pause(PAUSE_SHORT);

          const delResponse = page.waitForResponse(
            (res) => res.url().includes('/api/admins/') && res.request().method() === 'DELETE' && res.status() === 200
          );
          await deleteAdminDialog.confirm();
          await delResponse;

          await toast.expectToast('Użytkownik usunięty');
          break;
        }
      }
      await pause(PAUSE_LONG);
    });

    await test.step('Logout', async () => {
      await sidebar.clickProducts();
      await page.waitForURL('**/products');
      await productsPage.expectVisible();
      await pause(PAUSE_SHORT);

      await sidebar.clickLogout();
      await page.waitForURL('**/login');
      await loginPage.expectVisible();
      await pause(PAUSE_LONG);
    });
  });
});
