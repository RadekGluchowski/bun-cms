import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class SidebarPO {
  readonly page: Page;
  readonly logo: Locator;
  readonly navProducts: Locator;
  readonly navAdmins: Locator;
  readonly logoutButton: Locator;
  readonly toggle: Locator;
  readonly overlay: Locator;

  constructor(page: Page) {
    this.page = page;
    this.logo = page.getByTestId('sidebar-logo');
    this.navProducts = page.getByTestId('sidebar-nav-products');
    this.navAdmins = page.getByTestId('sidebar-nav-admins');
    this.logoutButton = page.getByTestId('sidebar-logout-button');
    this.toggle = page.getByTestId('sidebar-toggle');
    this.overlay = page.getByTestId('sidebar-overlay');
  }

  async expectVisible() {
    await expect(this.logo).toBeVisible();
    await expect(this.navProducts).toBeVisible();
    await expect(this.logoutButton).toBeVisible();
  }

  async clickProducts() {
    await this.navProducts.click();
  }

  async clickAdmins() {
    await this.navAdmins.click();
  }

  async clickLogout() {
    await this.logoutButton.click();
  }

  async clickToggle() {
    await this.toggle.click();
  }

  async expectAdminsNavVisible() {
    await expect(this.navAdmins).toBeVisible();
  }

  async expectAdminsNavHidden() {
    await expect(this.navAdmins).not.toBeVisible();
  }

  async expectOverlayVisible() {
    await expect(this.overlay).toBeVisible();
  }

  async expectOverlayHidden() {
    await expect(this.overlay).not.toBeVisible();
  }
}
