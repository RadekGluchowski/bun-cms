import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class BreadcrumbsPO {
  readonly page: Page;
  readonly breadcrumbs: Locator;

  constructor(page: Page) {
    this.page = page;
    this.breadcrumbs = page.getByTestId('breadcrumbs');
  }

  breadcrumbLink(index: number): Locator {
    return this.page.getByTestId(`breadcrumb-link-${index}`);
  }

  breadcrumbItem(index: number): Locator {
    return this.page.getByTestId(`breadcrumb-item-${index}`);
  }

  /** Matches either a link or a plain item at given index */
  breadcrumbElement(index: number): Locator {
    return this.page.locator(
      `[data-testid="breadcrumb-link-${index}"], [data-testid="breadcrumb-item-${index}"]`
    );
  }

  async expectBreadcrumbs(items: string[]) {
    for (let i = 0; i < items.length; i++) {
      const element = this.breadcrumbElement(i);
      await expect(element).toBeVisible();
      await expect(element).toContainText(items[i]);
    }
  }

  async clickBreadcrumb(index: number) {
    await this.breadcrumbLink(index).click();
  }

  async expectVisible() {
    await expect(this.breadcrumbs).toBeVisible();
  }
}
