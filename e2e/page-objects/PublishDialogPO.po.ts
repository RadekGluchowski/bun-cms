import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class PublishDialogPO {
  readonly page: Page;
  readonly dialog: Locator;
  readonly confirmButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByTestId('publish-dialog');
    this.confirmButton = page.getByTestId('publish-confirm-button');
    this.cancelButton = page.getByTestId('publish-cancel-button');
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

  async expectContainsText(text: string) {
    await expect(this.dialog).toContainText(text);
  }
}
