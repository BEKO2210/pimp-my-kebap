// Powered by skill: accessibility
//
// E2E smoke for the order flow as it stands today:
//   /konfigurator → Basis (+ optional Brot) → Add → /weiter
//   /speisekarte  → + on a card → cart bar reflects it, drawer stays shut
//   Hamburger     → opens on mobile only, ESC closes
//
// Not wired into CI (build/lint/typecheck/vitest run there). Useful as a
// hand-run smoke (`npm run test:e2e`) when touching the flow.

import { test, expect } from '@playwright/test';

test.describe('Konfigurator + Cart flow', () => {
  test('Kebap Basic: pick base + bread → redirect to /weiter', async ({ page }) => {
    await page.goto('/konfigurator');

    // Step 1 — Basis. Kebap Basic is "im Brot", so the Bread step appears.
    await page.locator('[data-cfg-base="kebap_basic"]').click();
    await expect(page.locator('fieldset[data-cfg-step="bread"]')).toBeVisible();

    // Add disabled until a bread is picked.
    const add = page.locator('[data-cfg-add]');
    await expect(add).toBeDisabled();

    // Step 2 — Brot.
    await page.locator('[data-cfg-bread="klassisch"]').click();
    await expect(add).toBeEnabled();
    await add.click();

    // The customer lands on /weiter with a confirmation banner; the cart
    // drawer is NOT auto-opened anymore.
    await expect(page).toHaveURL(/\/weiter\?added=kebap/);
    await expect(page.locator('[data-weiter-success]')).toBeVisible();
    await expect(page.locator('#cart-drawer')).toBeHidden();
  });

  test('Yufka Basic: bread step stays hidden, add enabled immediately', async ({ page }) => {
    await page.goto('/konfigurator');
    await page.locator('[data-cfg-base="yufka_basic"]').click();

    // Yufka is rolled in its own bread → step 2 stays hidden.
    await expect(page.locator('fieldset[data-cfg-step="bread"]')).toBeHidden();

    const add = page.locator('[data-cfg-add]');
    await expect(add).toBeEnabled();
    await add.click();
    await expect(page).toHaveURL(/\/weiter\?added=kebap/);
  });

  test('Kebap Box: extras hidden, bread hidden, add enabled', async ({ page }) => {
    await page.goto('/konfigurator');
    await page.locator('[data-cfg-base="kebap_box"]').click();

    await expect(page.locator('fieldset[data-cfg-step="bread"]')).toBeHidden();
    await expect(page.locator('fieldset[data-cfg-step="pimp"]')).toBeHidden();
    await expect(page.locator('[data-cfg-box-hint]')).toBeVisible();
    await expect(page.locator('[data-cfg-add]')).toBeEnabled();
  });

  test('Speisekarte +-button updates the cart bar without opening the drawer', async ({ page }) => {
    await page.goto('/speisekarte');

    // Open the Pizza accordion via the quick-jump nav so its items render.
    await page.locator('[data-cat-jump="pizza"]').click();

    const margheritaInc = page.locator('article[data-item-id="pizza-margherita"] [data-item-inc]');
    await margheritaInc.click();

    // Drawer stays closed — confirmation lives on the cart bar + button pulse.
    await expect(page.locator('#cart-drawer')).toBeHidden();
    const bar = page.locator('[data-cart-bar]');
    await expect(bar).toBeVisible();
    await expect(page.locator('[data-cart-bar-count]')).toHaveText('1');
  });
});

test.describe('Hamburger menu (mobile only)', () => {
  test('opens on tap and closes via ESC', async ({ page }) => {
    const vp = page.viewportSize();
    test.skip(!vp || vp.width >= 768, 'Hamburger renders only below md');

    await page.goto('/');
    const toggle = page.locator('[data-mobile-nav-toggle]');
    await expect(toggle).toBeVisible();

    await toggle.click();
    const panel = page.locator('[data-mobile-nav-panel]');
    await expect(panel).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
  });
});
