import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class AdminsPagePO {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly addButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.getByTestId('admins-page-title');
    this.addButton = page.getByTestId('admins-add-button');
  }

  async goto() {
    await this.page.goto('/admins');
  }

  async expectVisible() {
    await expect(this.pageTitle).toBeVisible();
    await expect(this.pageTitle).toContainText('Użytkownicy');
  }

  async clickAdd() {
    await this.addButton.click();
  }

  tableRow(index: number): Locator {
    return this.page.getByTestId(`admins-table-row-${index}`);
  }

  tableRowName(index: number): Locator {
    return this.page.getByTestId(`admins-table-row-name-${index}`);
  }

  tableRowEmail(index: number): Locator {
    return this.page.getByTestId(`admins-table-row-email-${index}`);
  }

  tableRowRole(index: number): Locator {
    return this.page.getByTestId(`admins-table-row-role-${index}`);
  }

  tableRowEditButton(index: number): Locator {
    return this.page.getByTestId(`admins-table-row-edit-button-${index}`);
  }

  tableRowDeleteButton(index: number): Locator {
    return this.page.getByTestId(`admins-table-row-delete-button-${index}`);
  }

  async clickEditAdmin(index: number) {
    await this.tableRowEditButton(index).click();
  }

  async clickDeleteAdmin(index: number) {
    await this.tableRowDeleteButton(index).click();
  }
}
