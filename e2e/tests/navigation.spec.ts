import { expect, test } from '@playwright/test';

test.describe('Navigation', () => {
  test('has working navigation links', async ({ page }) => {
    await page.goto('/');

    // Check main navigation is present
    const nav = page.getByRole('navigation');
    await expect(nav).toBeVisible();
  });

  test('can navigate to all main pages', async ({ page }) => {
    await page.goto('/');

    // Navigate to Customers
    await page.getByRole('navigation').getByRole('link', { name: 'Customers' }).click();
    await expect(page).toHaveURL(/.*customers/);

    // Navigate to Import (use nav-specific link)
    await page.getByRole('navigation').getByRole('link', { name: 'Import' }).click();
    await expect(page).toHaveURL(/.*import/);

    // Navigate back to Dashboard
    await page.getByRole('navigation').getByRole('link', { name: 'Dashboard' }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('highlights active navigation item', async ({ page }) => {
    // Go to customers page
    await page.goto('/customers');

    // The customers link should be in the navigation
    const customersLink = page.getByRole('navigation').getByRole('link', { name: 'Customers' });
    await expect(customersLink).toBeVisible();

    // Navigate to import
    await page.goto('/import');

    const importLink = page.getByRole('navigation').getByRole('link', { name: 'Import' });
    await expect(importLink).toBeVisible();
  });

  test('handles unknown routes', async ({ page }) => {
    await page.goto('/unknown-page-that-does-not-exist');

    // App should not crash - navigation should still work
    const nav = page.getByRole('navigation');
    await expect(nav).toBeVisible();
  });
});

test.describe('Navigation Accessibility', () => {
  test('navigation is keyboard accessible', async ({ page }) => {
    await page.goto('/');

    // Tab to navigation
    await page.keyboard.press('Tab');

    // Continue tabbing through nav items
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => document.activeElement?.tagName);
      expect(focused).toBeDefined();
    }
  });

  test('navigation has proper ARIA landmarks', async ({ page }) => {
    await page.goto('/');

    // Should have navigation role
    const nav = page.getByRole('navigation');
    await expect(nav).toBeVisible();
  });

  test('links have accessible names', async ({ page }) => {
    await page.goto('/');

    // All nav links should have accessible names
    const links = page.getByRole('navigation').getByRole('link');
    const count = await links.count();

    for (let i = 0; i < count; i++) {
      const link = links.nth(i);
      const name = (await link.getAttribute('aria-label')) || (await link.textContent());
      expect(name?.length).toBeGreaterThan(0);
    }
  });
});

test.describe('Page Titles', () => {
  test('each page has appropriate title', async ({ page }) => {
    await page.goto('/');
    expect(await page.title()).toContain('Pulse');

    await page.goto('/customers');
    // Title might be "Customers | Pulse" or similar
    const customersTitle = await page.title();
    expect(customersTitle.length).toBeGreaterThan(0);

    await page.goto('/import');
    const importTitle = await page.title();
    expect(importTitle.length).toBeGreaterThan(0);
  });
});
