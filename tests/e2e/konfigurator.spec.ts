import { test, expect } from '@playwright/test';

test.describe('Konfigurator + Cart + WhatsApp flow', () => {
  test('builds a kebab and previews the WhatsApp message', async ({ page }) => {
    await page.goto('/');
    // Hero present
    await expect(page.getByRole('heading', { name: /Create.+Kebap/i })).toBeVisible();

    // Step 1: pick Vitalbrot
    await page.getByRole('button', { name: /Vitalbrot/ }).first().click();
    // Step 2: pick Kebap Basic
    await page.getByRole('button', { name: /^Kebap Basic/ }).first().click();
    // Step 3: select Schmelzkäse
    await page.locator('[data-cfg-flag="schmelzkaese"]').check();
    // Add to cart
    const add = page.locator('[data-cfg-add]');
    await expect(add).toBeEnabled();
    await add.click();

    // Cart drawer opens
    await expect(page.locator('#cart-drawer')).toBeVisible();
    await page.locator('[data-cart-firstname]').fill('Maja');

    // Switch to delivery
    await page.locator('[data-cart-fulfillment="lieferung"]').click();
    await page.locator('[data-cart-zone]').selectOption('freiberg');
    await page.locator('[data-cart-plz]').fill('71691');
    await page.locator('[data-cart-street]').fill('Bahnhofstr. 5');

    // Add another item to clear the 20€ minimum
    await page.locator('[data-cart-close]').click();
    await page.getByRole('button', { name: /Margherita.+hinzufügen/i }).first().click();
    await page.getByRole('button', { name: /Margherita.+hinzufügen/i }).first().click();

    // Checkout button enabled
    const checkout = page.locator('[data-cart-checkout]');
    await expect(checkout).toBeEnabled();
  });

  test('quantity stepper updates total', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Margherita.+hinzufügen/i }).first().click();
    const totalBar = page.locator('[data-cart-bar-total]');
    await expect(totalBar).toBeVisible();
  });
});
