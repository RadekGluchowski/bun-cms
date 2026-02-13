import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class ProductDetailPage {
  readonly page: Page;
  readonly title: Locator;
  readonly code: Locator;
  readonly infoCard: Locator;
  readonly nameValue: Locator;
  readonly descriptionValue: Locator;
  readonly previewUrlValue: Locator;
  readonly statusBadge: Locator;
  readonly historyButton: Locator;
  readonly jsonButton: Locator;
  readonly editButton: Locator;
  readonly configsSection: Locator;
  readonly addConfigCard: Locator;
  readonly loadingSkeleton: Locator;
  readonly errorState: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.getByTestId('product-detail-title');
    this.code = page.getByTestId('product-detail-code');
    this.infoCard = page.getByTestId('product-detail-info-card');
    this.nameValue = page.getByTestId('product-detail-name');
    this.descriptionValue = page.getByTestId('product-detail-description');
    this.previewUrlValue = page.getByTestId('product-detail-preview-url');
    this.statusBadge = page.getByTestId('product-detail-status-badge');
    this.historyButton = page.getByTestId('product-detail-history-button');
    this.jsonButton = page.getByTestId('product-detail-json-button');
    this.editButton = page.getByTestId('product-detail-edit-button');
    this.configsSection = page.getByTestId('product-detail-configs-section');
    this.addConfigCard = page.getByTestId('product-detail-add-config-card');
    this.loadingSkeleton = page.getByTestId('product-detail-loading-skeleton');
    this.errorState = page.getByTestId('product-detail-error-state');
  }

  async goto(productId: string) {
    await this.page.goto(`/products/${productId}`);
  }

  async expectVisible() {
    await expect(this.title).toBeVisible();
    await expect(this.infoCard).toBeVisible();
  }

  configCard(configType: string): Locator {
    return this.page.getByTestId(`product-detail-config-card-${configType}`);
  }

  configCardDraftBadge(configType: string): Locator {
    return this.page.getByTestId(`product-detail-config-card-draft-badge-${configType}`);
  }

  configCardPublishedBadge(configType: string): Locator {
    return this.page.getByTestId(`product-detail-config-card-published-badge-${configType}`);
  }

  configCardEditButton(configType: string): Locator {
    return this.page.getByTestId(`product-detail-config-card-edit-button-${configType}`);
  }

  async clickHistory() {
    await this.historyButton.click();
  }

  async clickJson() {
    await this.jsonButton.click();
  }

  async clickEdit() {
    await this.editButton.click();
  }

  async clickAddConfig() {
    await this.addConfigCard.click();
  }

  async clickConfigEdit(configType: string) {
    await this.configCardEditButton(configType).click();
  }
}
