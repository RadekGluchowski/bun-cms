import { test, expect } from '@playwright/test';
import { SidebarPO } from '../../page-objects/Sidebar.po';
import { loginViaAPI } from '../../helpers/auth.helper';

test.describe('Sidebar Navigation', () => {
  let sidebar: SidebarPO;

  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page);
    sidebar = new SidebarPO(page);
  });

  test('should display CMS logo and title', async () => {
    await expect(sidebar.logo).toBeVisible();
    await expect(sidebar.logo).toContainText('CMS');
  });

  test('should display "Produkty" nav link', async () => {
    await expect(sidebar.navProducts).toBeVisible();
    await expect(sidebar.navProducts).toContainText('Produkty');
  });

  test('should highlight active nav item', async () => {
    // We are on /products after login, so "Produkty" should be the active item
    await expect(sidebar.navProducts).toBeVisible();

    // Check that the active nav item has the active styling via aria-current or CSS class
    // The active nav item gets the class "bg-primary text-primary-foreground"
    await expect(sidebar.navProducts).toHaveAttribute('aria-current', 'page');
  });

  test('should display "Wyloguj się" button at bottom', async () => {
    await expect(sidebar.logoutButton).toBeVisible();
    await expect(sidebar.logoutButton).toContainText('Wyloguj się');
  });
});

test.describe('Sidebar Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  let sidebar: SidebarPO;

  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page);
    sidebar = new SidebarPO(page);
  });

  test('should toggle mobile sidebar on hamburger menu click', async () => {
    // On mobile, the toggle button should be visible
    await expect(sidebar.toggle).toBeVisible();

    // Overlay should not be visible initially
    await sidebar.expectOverlayHidden();

    // Click toggle to open sidebar
    await sidebar.clickToggle();

    // Overlay should now be visible
    await sidebar.expectOverlayVisible();

    // Sidebar content should be visible
    await expect(sidebar.logo).toBeVisible();
    await expect(sidebar.navProducts).toBeVisible();
  });

  test('should show overlay when sidebar is open', async () => {
    // Initially overlay should be hidden
    await sidebar.expectOverlayHidden();

    // Open the sidebar
    await sidebar.clickToggle();

    // Overlay should now be visible
    await sidebar.expectOverlayVisible();
    await expect(sidebar.overlay).toBeVisible();
  });

  test('should close sidebar on Escape key', async ({ page }) => {
    // Open the sidebar first
    await expect(sidebar.toggle).toBeVisible();
    await sidebar.clickToggle();
    await sidebar.expectOverlayVisible();

    // Press Escape
    await page.keyboard.press('Escape');

    // Overlay should be hidden after pressing Escape
    await sidebar.expectOverlayHidden();
  });

  test('should close sidebar on overlay click', async () => {
    // Open the sidebar first
    await sidebar.clickToggle();
    await sidebar.expectOverlayVisible();

    // Click the overlay to close the sidebar
    await sidebar.overlay.click({ force: true });

    // Overlay should be hidden
    await sidebar.expectOverlayHidden();
  });
});
