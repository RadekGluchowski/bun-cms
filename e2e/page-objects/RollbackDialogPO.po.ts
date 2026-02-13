import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class RollbackDialogPO {
  readonly page: Page;
  readonly dialog: Locator;
  readonly confirmButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByTestId('rollback-dialog');
    this.confirmButton = page.getByTestId('rollback-confirm-button');
    this.cancelButton = page.getByTestId('rollback-cancel-button');
  }

  async expectOpen() {
    await expect(this.dialog).toBeVisible();
  }

  async confirm() {
    await this.confirmButton.click();
  }

  async cancel() {
    await this.cancelButton.click();
  }
}
