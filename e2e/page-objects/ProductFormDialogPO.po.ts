import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class ProductFormDialogPO {
  readonly page: Page;
  readonly dialog: Locator;
  readonly codeInput: Locator;
  readonly nameInput: Locator;
  readonly descriptionInput: Locator;
  readonly previewUrlInput: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;
  readonly errorMessage: Locator;
  readonly codeError: Locator;
  readonly nameError: Locator;
  readonly descriptionError: Locator;
  readonly previewUrlError: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByTestId('product-form-dialog');
    this.codeInput = page.getByTestId('product-form-code-input');
    this.nameInput = page.getByTestId('product-form-name-input');
    this.descriptionInput = page.getByTestId('product-form-description-input');
    this.previewUrlInput = page.getByTestId('product-form-preview-url-input');
    this.submitButton = page.getByTestId('product-form-submit-button');
    this.cancelButton = page.getByTestId('product-form-cancel-button');
    this.errorMessage = page.getByTestId('product-form-error-message');
    this.codeError = page.getByTestId('product-form-code-error');
    this.nameError = page.getByTestId('product-form-name-error');
    this.descriptionError = page.getByTestId('product-form-description-error');
    this.previewUrlError = page.getByTestId('product-form-preview-url-error');
  }

  async expectOpen() {
    await expect(this.dialog).toBeVisible();
  }

  async expectClosed() {
    await expect(this.dialog).not.toBeVisible();
  }

  async fillCode(value: string) {
    await this.codeInput.clear();
    await this.codeInput.fill(value);
  }

  async fillName(value: string) {
    await this.nameInput.clear();
    await this.nameInput.fill(value);
  }

  async fillDescription(value: string) {
    await this.descriptionInput.clear();
    await this.descriptionInput.fill(value);
  }

  async fillPreviewUrl(value: string) {
    await this.previewUrlInput.clear();
    await this.previewUrlInput.fill(value);
  }

  async clearField(locator: Locator) {
    await locator.clear();
  }

  async submit() {
    await this.submitButton.click();
  }

  async cancel() {
    await this.cancelButton.click();
  }

  private fieldErrorLocator(field: 'code' | 'name' | 'description' | 'preview-url'): Locator {
    const map: Record<string, Locator> = {
      code: this.codeError,
      name: this.nameError,
      description: this.descriptionError,
      'preview-url': this.previewUrlError,
    };
    return map[field];
  }

  async expectFieldError(field: 'code' | 'name' | 'description' | 'preview-url', message: string) {
    const locator = this.fieldErrorLocator(field);
    await expect(locator).toBeVisible();
    await expect(locator).toContainText(message);
  }

  async expectNoFieldError(field: 'code' | 'name' | 'description' | 'preview-url') {
    const locator = this.fieldErrorLocator(field);
    await expect(locator).not.toBeVisible();
  }

  async expectSubmitError(message: string) {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toContainText(message);
  }

  async expectCodeDisabled() {
    await expect(this.codeInput).toBeDisabled();
  }

  async expectSubmitButtonText(text: string) {
    await expect(this.submitButton).toContainText(text);
  }
}
