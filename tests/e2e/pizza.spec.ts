// Pimp-My-Pizza-Konfigurator: alle Toppings, Standard- vs. Premium-Preis,
// Summary-Text und Add-to-Cart-Redirect.

import { test, expect, type Page } from '@playwright/test';
import { moneyRe, pinClock, BERLIN } from './helpers';
import {
  PIZZA_TOPPINGS,
  PIZZA_BASE_PRICE_EUR,
  pizzaToppingPrice,
} from '../../src/data/pizza';

const total = (page: Page) => page.locator('[data-pizza-total]');
const summary = (page: Page) => page.locator('[data-pizza-summary]');

test.beforeEach(async ({ page }) => {
  await pinClock(page, BERLIN.neutralThursdayNoon);
  await page.goto('pimp-my-pizza');
});

test('Startzustand: Margherita-Stil für 8,00 €, Add sofort möglich', async ({ page }) => {
  await expect(total(page)).toHaveText(moneyRe(PIZZA_BASE_PRICE_EUR));
  await expect(summary(page)).toHaveText('Margherita-Stil');
  await expect(page.locator('[data-pizza-add]')).toBeEnabled();
});

test('jedes einzelne Topping ist klickbar und bepreist (Standard 1 €, Premium 2 €)', async ({ page }) => {
  test.slow(); // 22 Toppings × An/Abwahl mit Preis-Assertion
  for (const t of PIZZA_TOPPINGS) {
    const card = page.locator(`[data-pizza-topping-card="${t.id}"]`);
    await expect(card, `Topping ${t.id}`).toBeVisible();
    await card.click();
    await expect(total(page), `Preis nach ${t.id}`).toHaveText(
      moneyRe(PIZZA_BASE_PRICE_EUR + pizzaToppingPrice(t)),
    );
    await expect(summary(page)).toHaveText(t.name);
    // wieder abwählen → zurück auf Basis
    await card.click();
    await expect(total(page)).toHaveText(moneyRe(PIZZA_BASE_PRICE_EUR));
    await expect(summary(page)).toHaveText('Margherita-Stil');
  }
});

test('alle Toppings zusammen summieren exakt', async ({ page }) => {
  let expected = PIZZA_BASE_PRICE_EUR;
  for (const t of PIZZA_TOPPINGS) {
    await page.locator(`[data-pizza-topping-card="${t.id}"]`).click();
    expected += pizzaToppingPrice(t);
  }
  await expect(total(page)).toHaveText(moneyRe(expected));
  await expect(summary(page)).toHaveText(`${PIZZA_TOPPINGS.length} Toppings`);
});

test('Add → /weiter?added=pizza mit korrektem Warenkorb-Wert', async ({ page }) => {
  // Salami (1 €) + Sucuk (Premium 2 €) = 11,00 €
  await page.locator('[data-pizza-topping-card="salami"]').click();
  await page.locator('[data-pizza-topping-card="sucuk"]').click();
  await expect(total(page)).toHaveText(moneyRe(11));

  await page.locator('[data-pizza-add]').click();
  await expect(page).toHaveURL(/\/weiter\?added=pizza$/);
  const banner = page.locator('[data-weiter-success]');
  await expect(banner).toBeVisible();
  await expect(banner.locator('[data-weiter-success-item]')).toHaveText('Pizza');
  await expect(page.locator('[data-weiter-cart-count]')).toHaveText('1');
  await expect(page.locator('[data-weiter-cart-total]')).toHaveText(moneyRe(11));
});
