import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class ProductJsonDialogPO {
  readonly page: Page;
  readonly dialog: Locator;
  readonly copyButton: Locator;
  readonly downloadButton: Locator;
  readonly textarea: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByTestId('product-json-dialog');
    this.copyButton = page.getByTestId('product-json-copy-button');
    this.downloadButton = page.getByTestId('product-json-download-button');
    this.textarea = page.getByTestId('product-json-textarea');
  }

  async expectOpen() {
    await expect(this.dialog).toBeVisible();
  }

  async copy() {
    await this.copyButton.click();
  }

  async download() {
    await this.downloadButton.click();
  }

  async getJsonText(): Promise<string> {
    return await this.textarea.inputValue();
  }
}
