import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class HistoryPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly filterDropdown: Locator;
  readonly timelineCard: Locator;
  readonly emptyState: Locator;
  readonly loadingSkeleton: Locator;
  readonly loadMoreButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.getByTestId('history-page-title');
    this.filterDropdown = page.getByTestId('history-filter-dropdown');
    this.timelineCard = page.getByTestId('history-timeline-card');
    this.emptyState = page.getByTestId('history-empty-state');
    this.loadingSkeleton = page.getByTestId('history-loading-skeleton');
    this.loadMoreButton = page.getByTestId('history-load-more-button');
  }

  async goto(productId: string) {
    await this.page.goto(`/products/${productId}/history`);
  }

  async expectVisible() {
    await expect(this.pageTitle).toBeVisible();
    await expect(this.pageTitle).toContainText('Historia zmian');
  }

  entry(entryId: string): Locator {
    return this.page.getByTestId(`history-entry-${entryId}`);
  }

  entryTime(entryId: string): Locator {
    return this.page.getByTestId(`history-entry-time-${entryId}`);
  }

  entryType(entryId: string): Locator {
    return this.page.getByTestId(`history-entry-type-${entryId}`);
  }

  entryVersion(entryId: string): Locator {
    return this.page.getByTestId(`history-entry-version-${entryId}`);
  }

  entryAction(entryId: string): Locator {
    return this.page.getByTestId(`history-entry-action-${entryId}`);
  }

  entryPreviewButton(entryId: string): Locator {
    return this.page.getByTestId(`history-entry-preview-button-${entryId}`);
  }

  entryRollbackButton(entryId: string): Locator {
    return this.page.getByTestId(`history-entry-rollback-button-${entryId}`);
  }

  dateGroup(label: string): Locator {
    return this.page.getByTestId(`history-date-group-${label}`);
  }

  async selectFilter(value: string) {
    await this.filterDropdown.selectOption(value);
  }

  async clickLoadMore() {
    await this.loadMoreButton.click();
  }

  async expectEmptyState() {
    await expect(this.emptyState).toBeVisible();
  }

  async expectLoadingSkeleton() {
    await expect(this.loadingSkeleton).toBeVisible();
  }
}
