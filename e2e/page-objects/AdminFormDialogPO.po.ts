import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class AdminFormDialogPO {
  readonly page: Page;
  readonly dialog: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly nameInput: Locator;
  readonly roleSelect: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByTestId('admin-form-dialog');
    this.emailInput = page.getByTestId('admin-form-email-input');
    this.passwordInput = page.getByTestId('admin-form-password-input');
    this.nameInput = page.getByTestId('admin-form-name-input');
    this.roleSelect = page.getByTestId('admin-form-role-select');
    this.submitButton = page.getByTestId('admin-form-submit-button');
  }

  async expectOpen() {
    await expect(this.dialog).toBeVisible();
  }

  async expectClosed() {
    await expect(this.dialog).not.toBeVisible();
  }

  async fillEmail(email: string) {
    await this.emailInput.clear();
    await this.emailInput.fill(email);
  }

  async fillPassword(password: string) {
    await this.passwordInput.clear();
    await this.passwordInput.fill(password);
  }

  async fillName(name: string) {
    await this.nameInput.clear();
    await this.nameInput.fill(name);
  }

  async selectRole(role: 'admin' | 'editor') {
    await this.roleSelect.selectOption(role);
  }

  async submit() {
    await this.submitButton.click();
  }

  async expectSubmitDisabled() {
    await expect(this.submitButton).toBeDisabled();
  }

  async expectSubmitEnabled() {
    await expect(this.submitButton).toBeEnabled();
  }
}
