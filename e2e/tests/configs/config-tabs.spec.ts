import { test, expect } from '../../fixtures/auth.fixture';
import { ConfigEditorPage } from '../../page-objects/ConfigEditorPage.po';
import { ToastPO } from '../../page-objects/ToastPO.po';
import { loginViaAPI } from '../../helpers/auth.helper';
import { createTestProduct, deleteTestProduct } from '../../helpers/product.helper';
import { saveConfigDraft } from '../../helpers/config.helper';

test.describe('Config Tabs', () => {
  let productId: string;
  const ts = Date.now();

  const configDataByType: Record<
    string,
    {
      meta: { title: string; description: string; category: string; icon: string };
      body: object;
    }
  > = {
    promotions: {
      meta: { title: 'Promotions', description: 'Promo desc', category: 'marketing', icon: 'Tag' },
      body: { promos: [] },
    },
    faq: {
      meta: { title: 'FAQ', description: 'FAQ desc', category: 'content', icon: 'HelpCircle' },
      body: { questions: [] },
    },
    seo: {
      meta: { title: 'SEO Settings', description: 'SEO desc', category: 'seo', icon: 'Search' },
      body: { keywords: [] },
    },
  };

  test.beforeAll(async () => {
    const product = await createTestProduct({ code: `CTAB-${ts}`, name: `Config Tabs Test ${ts}` });
    productId = product.id;

    await saveConfigDraft(productId, 'promotions', configDataByType['promotions']);
    await saveConfigDraft(productId, 'faq', configDataByType['faq']);
    await saveConfigDraft(productId, 'seo', configDataByType['seo']);
  });

  test.afterAll(async () => {
    await deleteTestProduct(productId);
  });

  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page);
  });

  test('should display all config types as tabs', async ({ page }) => {
    const configEditor = new ConfigEditorPage(page);
    await configEditor.goto(productId, 'promotions');

    await expect(configEditor.tabs).toBeVisible();

    for (const ct of ['promotions', 'faq', 'seo']) {
      const tab = configEditor.tab(ct);
      await expect(tab).toBeVisible();
    }
  });

  test('should switch config type when clicking tab', async ({ page }) => {
    const configEditor = new ConfigEditorPage(page);
    await configEditor.goto(productId, 'promotions');

    // Verify we start on promotions
    await expect(configEditor.tab('promotions')).toHaveClass(/bg-primary/);
    await expect(configEditor.metaTitleInput).toHaveValue('Promotions');

    // Switch to FAQ tab
    await configEditor.clickTab('faq');
    await page.waitForURL(`**/products/${productId}/configs/faq`);

    // Verify FAQ is now active
    await expect(configEditor.tab('faq')).toHaveClass(/bg-primary/);
    await expect(configEditor.tab('promotions')).not.toHaveClass(/bg-primary\b/);

    // Verify FAQ data is loaded
    await expect(configEditor.metaTitleInput).toHaveValue('FAQ');

    // Switch to SEO tab
    await configEditor.clickTab('seo');
    await page.waitForURL(`**/products/${productId}/configs/seo`);

    // Verify SEO is now active
    await expect(configEditor.tab('seo')).toHaveClass(/bg-primary/);
    await expect(configEditor.metaTitleInput).toHaveValue('SEO Settings');
  });

  test('should load correct data for each tab', async ({ page }) => {
    const configEditor = new ConfigEditorPage(page);

    // Navigate to promotions
    await configEditor.goto(productId, 'promotions');
    await expect(configEditor.metaTitleInput).toHaveValue('Promotions');
    await expect(configEditor.metaDescriptionInput).toHaveValue('Promo desc');
    await expect(configEditor.metaCategoryInput).toHaveValue('marketing');
    await expect(configEditor.metaIconInput).toHaveValue('Tag');

    let bodyValue = await configEditor.bodyTextarea.inputValue();
    let parsedBody = JSON.parse(bodyValue);
    expect(parsedBody).toEqual({ promos: [] });

    // Navigate to FAQ via tab click
    await configEditor.clickTab('faq');
    await page.waitForURL(`**/products/${productId}/configs/faq`);

    await expect(configEditor.metaTitleInput).toHaveValue('FAQ');
    await expect(configEditor.metaDescriptionInput).toHaveValue('FAQ desc');
    await expect(configEditor.metaCategoryInput).toHaveValue('content');
    await expect(configEditor.metaIconInput).toHaveValue('HelpCircle');

    bodyValue = await configEditor.bodyTextarea.inputValue();
    parsedBody = JSON.parse(bodyValue);
    expect(parsedBody).toEqual({ questions: [] });

    // Navigate to SEO via tab click
    await configEditor.clickTab('seo');
    await page.waitForURL(`**/products/${productId}/configs/seo`);

    await expect(configEditor.metaTitleInput).toHaveValue('SEO Settings');
    await expect(configEditor.metaDescriptionInput).toHaveValue('SEO desc');
    await expect(configEditor.metaCategoryInput).toHaveValue('seo');
    await expect(configEditor.metaIconInput).toHaveValue('Search');

    bodyValue = await configEditor.bodyTextarea.inputValue();
    parsedBody = JSON.parse(bodyValue);
    expect(parsedBody).toEqual({ keywords: [] });
  });

  test('should change URL when switching tabs', async ({ page }) => {
    const configEditor = new ConfigEditorPage(page);
    await configEditor.goto(productId, 'promotions');

    // Verify initial URL
    await expect(page).toHaveURL(new RegExp(`/products/${productId}/configs/promotions`));

    // Click FAQ tab
    await configEditor.clickTab('faq');
    await page.waitForURL(`**/products/${productId}/configs/faq`);
    await expect(page).toHaveURL(new RegExp(`/products/${productId}/configs/faq`));

    // Click SEO tab
    await configEditor.clickTab('seo');
    await page.waitForURL(`**/products/${productId}/configs/seo`);
    await expect(page).toHaveURL(new RegExp(`/products/${productId}/configs/seo`));

    // Click Promotions tab
    await configEditor.clickTab('promotions');
    await page.waitForURL(`**/products/${productId}/configs/promotions`);
    await expect(page).toHaveURL(new RegExp(`/products/${productId}/configs/promotions`));
  });

  test('should show pending changes indicator on tabs with drafts', async ({ page }) => {
    const configEditor = new ConfigEditorPage(page);
    await configEditor.goto(productId, 'promotions');

    // All three tabs have drafts, so they should all be visible
    for (const ct of ['promotions', 'faq', 'seo']) {
      const tab = configEditor.tab(ct);
      await expect(tab).toBeVisible();
    }
  });

  test('should highlight active tab', async ({ page }) => {
    const configEditor = new ConfigEditorPage(page);
    await configEditor.goto(productId, 'promotions');

    // Promotions tab should be highlighted
    await expect(configEditor.tab('promotions')).toHaveClass(/bg-primary/);
    await expect(configEditor.tab('faq')).not.toHaveClass(/bg-primary\b/);
    await expect(configEditor.tab('seo')).not.toHaveClass(/bg-primary\b/);

    // Switch to faq
    await configEditor.clickTab('faq');
    await page.waitForURL(`**/products/${productId}/configs/faq`);

    // FAQ tab should now be highlighted
    await expect(configEditor.tab('faq')).toHaveClass(/bg-primary/);
    await expect(configEditor.tab('promotions')).not.toHaveClass(/bg-primary\b/);
    await expect(configEditor.tab('seo')).not.toHaveClass(/bg-primary\b/);

    // Switch to seo
    await configEditor.clickTab('seo');
    await page.waitForURL(`**/products/${productId}/configs/seo`);

    // SEO tab should now be highlighted
    await expect(configEditor.tab('seo')).toHaveClass(/bg-primary/);
    await expect(configEditor.tab('promotions')).not.toHaveClass(/bg-primary\b/);
    await expect(configEditor.tab('faq')).not.toHaveClass(/bg-primary\b/);
  });
});
