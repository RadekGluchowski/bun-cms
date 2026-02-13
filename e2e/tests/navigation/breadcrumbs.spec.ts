import { test, expect } from '@playwright/test';
import { BreadcrumbsPO } from '../../page-objects/BreadcrumbsPO.po';
import { ProductDetailPage } from '../../page-objects/ProductDetailPage.po';
import { ConfigEditorPage } from '../../page-objects/ConfigEditorPage.po';
import { HistoryPage } from '../../page-objects/HistoryPage.po';
import { loginViaAPI } from '../../helpers/auth.helper';
import { createTestProduct, deleteTestProduct } from '../../helpers/product.helper';
import { saveConfigDraft } from '../../helpers/config.helper';

test.describe('Breadcrumbs Navigation', () => {
  let productId: string;
  const productCode = `BREAD-${Date.now()}`;
  const productName = 'Breadcrumb Test Product';

  test.beforeAll(async () => {
    const product = await createTestProduct({
      code: productCode,
      name: productName,
    });
    productId = product.id;
    await saveConfigDraft(productId, 'general');
  });

  test.afterAll(async () => {
    try {
      await deleteTestProduct(productId);
    } catch {
      // Ignore cleanup errors
    }
  });

  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page);
  });

  test('should display breadcrumbs on product detail page', async ({ page }) => {
    const productDetailPage = new ProductDetailPage(page);
    await productDetailPage.goto(productId);
    await productDetailPage.expectVisible();

    const breadcrumbs = new BreadcrumbsPO(page);
    await breadcrumbs.expectVisible();

    // Should show: "Produkty" > "Breadcrumb Test Product"
    await breadcrumbs.expectBreadcrumbs(['Produkty', productName]);
  });

  test('should display breadcrumbs on config editor page', async ({ page }) => {
    const configEditorPage = new ConfigEditorPage(page);
    await configEditorPage.goto(productId, 'general');

    // Wait for breadcrumbs to appear
    const breadcrumbs = new BreadcrumbsPO(page);
    await breadcrumbs.expectVisible();

    // Should show: "Produkty" > "..." > "Konfiguracje" > "general"
    // The breadcrumbs contain the product name (possibly truncated) and config type
    const breadcrumbNav = page.getByTestId('breadcrumbs');
    await expect(breadcrumbNav).toContainText('Produkty');
    await expect(breadcrumbNav).toContainText('General');
  });

  test('should display breadcrumbs on history page', async ({ page }) => {
    const historyPage = new HistoryPage(page);
    await historyPage.goto(productId);
    await historyPage.expectVisible();

    const breadcrumbs = new BreadcrumbsPO(page);
    await breadcrumbs.expectVisible();

    // Should show: "Produkty" > "Breadcrumb Test Product" > "Historia"
    const breadcrumbNav = page.getByTestId('breadcrumbs');
    await expect(breadcrumbNav).toContainText('Produkty');
    await expect(breadcrumbNav).toContainText(productName);
    await expect(breadcrumbNav).toContainText('Historia');
  });

  test('should navigate when clicking breadcrumb links', async ({ page }) => {
    // Start on the history page
    const historyPage = new HistoryPage(page);
    await historyPage.goto(productId);
    await historyPage.expectVisible();

    const breadcrumbs = new BreadcrumbsPO(page);
    await breadcrumbs.expectVisible();

    // Click the "Produkty" breadcrumb link (index 0)
    await breadcrumbs.clickBreadcrumb(0);

    // Should navigate to the products list
    await page.waitForURL('**/products', { timeout: 10_000 });
    expect(page.url()).toContain('/products');
  });

  test('should navigate to product detail from config editor breadcrumb', async ({ page }) => {
    // Start on the config editor page
    const configEditorPage = new ConfigEditorPage(page);
    await configEditorPage.goto(productId, 'general');

    const breadcrumbs = new BreadcrumbsPO(page);
    await breadcrumbs.expectVisible();

    // Click the product name breadcrumb link (index 1) to navigate to product detail
    await breadcrumbs.clickBreadcrumb(1);

    // Should navigate to product detail page
    await page.waitForURL(`**/products/${productId}`, { timeout: 10_000 });
    expect(page.url()).toContain(`/products/${productId}`);

    // Verify product detail page is displayed
    const productDetailPage = new ProductDetailPage(page);
    await productDetailPage.expectVisible();
  });
});
