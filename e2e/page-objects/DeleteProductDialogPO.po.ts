import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class DeleteProductDialogPO {
  readonly page: Page;
  readonly dialog: Locator;
  readonly confirmButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByTestId('delete-product-dialog');
    this.confirmButton = page.getByTestId('delete-product-confirm-button');
    this.cancelButton = page.getByTestId('delete-product-cancel-button');
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
