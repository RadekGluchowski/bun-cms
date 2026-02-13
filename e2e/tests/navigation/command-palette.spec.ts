import { test, expect } from '@playwright/test';
import { CommandPalettePO } from '../../page-objects/CommandPalettePO.po';
import { loginViaAPI } from '../../helpers/auth.helper';
import { SEED_PRODUCT } from '../../fixtures/test-data';

test.describe('Command Palette', () => {
  let palette: CommandPalettePO;

  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page);
    palette = new CommandPalettePO(page);
  });

  test('should open command palette with Ctrl+K', async ({ page }) => {
    // Palette should be closed initially
    await palette.expectClosed();

    // Open with keyboard shortcut
    await page.keyboard.press('Control+k');

    // Palette should now be open
    await palette.expectOpen();
  });

  test('should show search input when palette is open', async ({ page }) => {
    // Open the palette
    await page.keyboard.press('Control+k');
    await palette.expectOpen();

    // Search input should be visible
    await expect(palette.input).toBeVisible();
    await expect(palette.input).toHaveAttribute(
      'placeholder',
      'Szukaj produktów i konfiguracji...'
    );
  });

  test('should show hint when typing less than 2 characters', async ({ page }) => {
    // Open the palette
    await page.keyboard.press('Control+k');
    await palette.expectOpen();

    // With empty input, should show hint about minimum characters
    const hintEmpty = page.getByText('Wpisz minimum 2 znaki, aby wyszukać');
    await expect(hintEmpty).toBeVisible();

    // Type a single character
    await palette.search('a');

    // Should show hint that 1 more character is needed
    const hintOneChar = page.getByText('Wpisz jeszcze 1 znak');
    await expect(hintOneChar).toBeVisible();
  });

  test('should show search results for valid query', async ({ page }) => {
    // Open the palette
    await page.keyboard.press('Control+k');
    await palette.expectOpen();

    // Type a query that should match the SAMPLE seed product
    await palette.search(SEED_PRODUCT.name);

    // Wait for debounce (300ms) and API response; look for results section
    const productsSection = page.getByTestId('command-palette').getByText('Produkty');
    await expect(productsSection).toBeVisible({ timeout: 5_000 });

    // Should see at least one result item with the seed product name
    const resultItem = page.locator('[data-result-index="0"]');
    await expect(resultItem).toBeVisible();
    await expect(resultItem).toContainText(SEED_PRODUCT.name);
  });

  test('should navigate to result on click', async ({ page }) => {
    // Open the palette
    await page.keyboard.press('Control+k');
    await palette.expectOpen();

    // Search for the seed product
    await palette.search(SEED_PRODUCT.name);

    // Wait for results to appear
    const resultItem = page.locator('[data-result-index="0"]');
    await expect(resultItem).toBeVisible({ timeout: 5_000 });

    // Click the first result
    await resultItem.click();

    // Palette should close
    await palette.expectClosed();

    // Should navigate to the product or config URL
    await page.waitForURL(/\/products\//, { timeout: 10_000 });
    expect(page.url()).toMatch(/\/products\//);
  });

  test('should close palette on Escape', async ({ page }) => {
    // Open the palette
    await page.keyboard.press('Control+k');
    await palette.expectOpen();

    // Press Escape to close
    await palette.close();

    // Palette should be closed
    await palette.expectClosed();
  });

  test('should show no results message for non-matching query', async ({ page }) => {
    // Open the palette
    await page.keyboard.press('Control+k');
    await palette.expectOpen();

    // Type a query that should not match anything
    const nonsenseQuery = 'zzzznonexistentxyz';
    await palette.search(nonsenseQuery);

    // Wait for debounce and API response; should show no results message
    const noResultsMessage = page.getByText(`Brak wyników dla "${nonsenseQuery}"`);
    await expect(noResultsMessage).toBeVisible({ timeout: 5_000 });
  });

  test('should navigate results with arrow keys and Enter', async ({ page }) => {
    // Open the palette
    await page.keyboard.press('Control+k');
    await palette.expectOpen();

    // Search for the seed product
    await palette.search(SEED_PRODUCT.name);

    // Wait for results to appear
    const firstResult = page.locator('[data-result-index="0"]');
    await expect(firstResult).toBeVisible({ timeout: 5_000 });

    // The first result should be selected by default (has bg-accent class)
    await expect(firstResult).toHaveClass(/bg-accent/);

    // Press ArrowDown to move to next result (if there is one)
    await page.keyboard.press('ArrowDown');

    // Now press ArrowUp to go back to first result
    await page.keyboard.press('ArrowUp');

    // First result should be selected again
    await expect(firstResult).toHaveClass(/bg-accent/);

    // Press Enter to navigate to the selected result
    await page.keyboard.press('Enter');

    // Palette should close and we should navigate
    await palette.expectClosed();
    await page.waitForURL(/\/products\//, { timeout: 10_000 });
    expect(page.url()).toMatch(/\/products\//);
  });
});
