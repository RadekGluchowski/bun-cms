import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class ToastPO {
  readonly page: Page;
  readonly container: Locator;
  readonly title: Locator;
  readonly description: Locator;
  readonly closeButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.container = page.getByTestId('toast-container');
    this.title = page.getByTestId('toast-title');
    this.description = page.getByTestId('toast-description');
    this.closeButton = page.getByTestId('toast-close-button');
  }

  async expectToast(title: string) {
    const toastTitle = this.page
      .getByTestId('toast-title')
      .filter({ hasText: title });
    await expect(toastTitle.first()).toBeVisible({ timeout: 5000 });
  }

  async expectToastWithDescription(title: string, description: string) {
    const container = this.page
      .getByTestId('toast-container')
      .filter({ hasText: title });
    await expect(container.first()).toBeVisible({ timeout: 5000 });

    const desc = container.first().getByTestId('toast-description');
    await expect(desc).toContainText(description);
  }

  async dismissToast() {
    await this.closeButton.click();
  }

  async waitForToastToDisappear() {
    await expect(this.container).not.toBeVisible();
  }
}
