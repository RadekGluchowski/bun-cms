import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class CommandPalettePO {
  readonly page: Page;
  readonly palette: Locator;
  readonly input: Locator;

  constructor(page: Page) {
    this.page = page;
    this.palette = page.getByTestId('command-palette');
    this.input = page.getByTestId('command-palette-input');
  }

  async expectOpen() {
    await expect(this.palette).toBeVisible();
  }

  async expectClosed() {
    await expect(this.palette).not.toBeVisible();
  }

  async search(query: string) {
    await this.input.fill(query);
  }

  async close() {
    await this.page.keyboard.press('Escape');
  }

  async openWithKeyboard(page: Page) {
    await page.keyboard.press('Control+k');
  }
}
