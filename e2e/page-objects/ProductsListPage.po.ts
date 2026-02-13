import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class ProductsListPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly addButton: Locator;
  readonly searchInput: Locator;
  readonly table: Locator;
  readonly loadingSkeleton: Locator;
  readonly emptyState: Locator;
  readonly searchEmptyState: Locator;
  readonly errorState: Locator;
  readonly pagination: Locator;
  readonly paginationPrev: Locator;
  readonly paginationNext: Locator;
  readonly paginationInfo: Locator;
  readonly paginationShowing: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.getByTestId('products-page-title');
    this.addButton = page.getByTestId('products-add-button');
    this.searchInput = page.getByTestId('products-search-input');
    this.table = page.getByTestId('products-table');
    this.loadingSkeleton = page.getByTestId('products-loading-skeleton');
    this.emptyState = page.getByTestId('products-empty-state');
    this.searchEmptyState = page.getByTestId('products-search-empty-state');
    this.errorState = page.getByTestId('products-error-state');
    this.pagination = page.getByTestId('products-pagination');
    this.paginationPrev = page.getByTestId('products-pagination-prev');
    this.paginationNext = page.getByTestId('products-pagination-next');
    this.paginationInfo = page.getByTestId('products-pagination-info');
    this.paginationShowing = page.getByTestId('products-pagination-showing');
  }

  async goto() {
    await this.page.goto('/products');
  }

  async expectVisible() {
    await expect(this.pageTitle).toBeVisible();
    await expect(this.addButton).toBeVisible();
    await expect(this.searchInput).toBeVisible();
  }

  async search(query: string) {
    await this.searchInput.fill(query);
  }

  async clearSearch() {
    await this.searchInput.clear();
  }

  async clickAdd() {
    await this.addButton.click();
  }

  tableRow(index: number): Locator {
    return this.page.getByTestId(`products-table-row-${index}`);
  }

  tableRowName(index: number): Locator {
    return this.page.getByTestId(`products-table-row-name-${index}`);
  }

  tableRowCode(index: number): Locator {
    return this.page.getByTestId(`products-table-row-code-${index}`);
  }

  tableRowStatus(index: number): Locator {
    return this.page.getByTestId(`products-table-row-status-${index}`);
  }

  tableRowEditButton(index: number): Locator {
    return this.page.getByTestId(`products-table-row-edit-button-${index}`);
  }

  tableRowDeleteButton(index: number): Locator {
    return this.page.getByTestId(`products-table-row-delete-button-${index}`);
  }

  async clickProductName(index: number) {
    await this.tableRowName(index).click();
  }

  async clickEditProduct(index: number) {
    await this.tableRowEditButton(index).click();
  }

  async clickDeleteProduct(index: number) {
    await this.tableRowDeleteButton(index).click();
  }

  async expectTableVisible() {
    await expect(this.table).toBeVisible();
  }

  async expectEmptyState() {
    await expect(this.emptyState).toBeVisible();
  }

  async expectSearchEmptyState() {
    await expect(this.searchEmptyState).toBeVisible();
  }

  async expectErrorState() {
    await expect(this.errorState).toBeVisible();
  }

  async expectLoadingSkeleton() {
    await expect(this.loadingSkeleton).toBeVisible();
  }

  async expectPaginationVisible() {
    await expect(this.pagination).toBeVisible();
  }

  async expectPaginationHidden() {
    await expect(this.pagination).not.toBeVisible();
  }

  async clickNextPage() {
    await this.paginationNext.click();
  }

  async clickPrevPage() {
    await this.paginationPrev.click();
  }
}
