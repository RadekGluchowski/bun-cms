import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class AddConfigDialogPO {
  readonly page: Page;
  readonly dialog: Locator;
  readonly typeInput: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByTestId('add-config-dialog');
    this.typeInput = page.getByTestId('add-config-type-input');
    this.submitButton = page.getByTestId('add-config-submit-button');
    this.cancelButton = page.getByTestId('add-config-cancel-button');
    this.errorMessage = page.getByTestId('add-config-error-message');
  }

  async expectOpen() {
    await expect(this.dialog).toBeVisible();
  }

  async fillType(value: string) {
    await this.typeInput.clear();
    await this.typeInput.fill(value);
  }

  async submit() {
    await this.submitButton.click();
  }

  async cancel() {
    await this.cancelButton.click();
  }

  async submitWithEnter() {
    await this.typeInput.press('Enter');
  }

  async expectError(message: string) {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toContainText(message);
  }

  async expectNoError() {
    await expect(this.errorMessage).not.toBeVisible();
  }

  async expectSubmitDisabled() {
    await expect(this.submitButton).toBeDisabled();
  }

  async expectSubmitEnabled() {
    await expect(this.submitButton).toBeEnabled();
  }
}
