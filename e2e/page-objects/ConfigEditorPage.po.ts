import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class ConfigEditorPage {
  readonly page: Page;
  readonly breadcrumbs: Locator;
  readonly tabs: Locator;
  readonly title: Locator;
  readonly draftBadge: Locator;
  readonly publishedBadge: Locator;
  readonly metaCard: Locator;
  readonly metaTitleInput: Locator;
  readonly metaTitleError: Locator;
  readonly metaDescriptionInput: Locator;
  readonly metaCategoryInput: Locator;
  readonly metaIconInput: Locator;
  readonly bodyCard: Locator;
  readonly bodyTextarea: Locator;
  readonly bodyError: Locator;
  readonly statusText: Locator;
  readonly saveButton: Locator;
  readonly publishButton: Locator;
  readonly previewButton: Locator;
  readonly emptyState: Locator;
  readonly createDraftButton: Locator;
  readonly loadingSkeleton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.breadcrumbs = page.getByTestId('config-editor-breadcrumbs');
    this.tabs = page.getByTestId('config-editor-tabs');
    this.title = page.getByTestId('config-editor-title');
    this.draftBadge = page.getByTestId('config-editor-draft-badge');
    this.publishedBadge = page.getByTestId('config-editor-published-badge');
    this.metaCard = page.getByTestId('config-editor-meta-card');
    this.metaTitleInput = page.getByTestId('config-editor-meta-title-input');
    this.metaTitleError = page.getByTestId('config-editor-meta-title-error');
    this.metaDescriptionInput = page.getByTestId('config-editor-meta-description-input');
    this.metaCategoryInput = page.getByTestId('config-editor-meta-category-input');
    this.metaIconInput = page.getByTestId('config-editor-meta-icon-input');
    this.bodyCard = page.getByTestId('config-editor-body-card');
    this.bodyTextarea = page.getByTestId('config-editor-body-textarea');
    this.bodyError = page.getByTestId('config-editor-body-error');
    this.statusText = page.getByTestId('config-editor-status-text');
    this.saveButton = page.getByTestId('config-editor-save-button');
    this.publishButton = page.getByTestId('config-editor-publish-button');
    this.previewButton = page.getByTestId('config-editor-preview-button');
    this.emptyState = page.getByTestId('config-editor-empty-state');
    this.createDraftButton = page.getByTestId('config-editor-create-draft-button');
    this.loadingSkeleton = page.getByTestId('config-editor-loading-skeleton');
  }

  async goto(productId: string, configType: string) {
    await this.page.goto(`/products/${productId}/configs/${configType}`);
  }

  tab(configType: string): Locator {
    return this.page.getByTestId(`config-editor-tab-${configType}`);
  }

  async clickTab(configType: string) {
    await this.tab(configType).click();
  }

  async fillMetaTitle(value: string) {
    await this.metaTitleInput.clear();
    await this.metaTitleInput.fill(value);
  }

  async fillMetaDescription(value: string) {
    await this.metaDescriptionInput.clear();
    await this.metaDescriptionInput.fill(value);
  }

  async fillMetaCategory(value: string) {
    await this.metaCategoryInput.clear();
    await this.metaCategoryInput.fill(value);
  }

  async fillMetaIcon(value: string) {
    await this.metaIconInput.clear();
    await this.metaIconInput.fill(value);
  }

  async fillBody(json: string) {
    await this.bodyTextarea.clear();
    await this.bodyTextarea.fill(json);
  }

  async clickSave() {
    await this.saveButton.click();
  }

  async clickPublish() {
    await this.publishButton.click();
  }

  async expectStatusText(text: string) {
    await expect(this.statusText).toContainText(text);
  }

  async expectSaveDisabled() {
    await expect(this.saveButton).toBeDisabled();
  }

  async expectSaveEnabled() {
    await expect(this.saveButton).toBeEnabled();
  }

  async expectPublishDisabled() {
    await expect(this.publishButton).toBeDisabled();
  }

  async expectPublishEnabled() {
    await expect(this.publishButton).toBeEnabled();
  }

  async expectEmptyState() {
    await expect(this.emptyState).toBeVisible({ timeout: 15_000 });
  }
}
