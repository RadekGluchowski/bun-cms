import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class HistoryPreviewDialogPO {
  readonly page: Page;
  readonly dialog: Locator;
  readonly json: Locator;
  readonly closeButton: Locator;
  readonly rollbackButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByTestId('history-preview-dialog');
    this.json = page.getByTestId('history-preview-json');
    this.closeButton = page.getByTestId('history-preview-close-button');
    this.rollbackButton = page.getByTestId('history-preview-rollback-button');
  }

  async expectOpen() {
    await expect(this.dialog).toBeVisible();
  }

  async close() {
    await this.closeButton.click();
  }

  async clickRollback() {
    await this.rollbackButton.click();
  }

  async expectJsonVisible() {
    await expect(this.json).toBeVisible();
  }

  async expectRollbackButtonVisible() {
    await expect(this.rollbackButton).toBeVisible();
  }

  async expectRollbackButtonHidden() {
    await expect(this.rollbackButton).not.toBeVisible();
  }
}
