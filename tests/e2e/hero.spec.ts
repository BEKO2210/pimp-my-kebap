// Startseiten-Hero: Kennzahlen aus den Daten, CTA-Layout (Haupt-CTA volle
// Breite, Neben-CTAs je halb) und mobile Zentrierung.

import { test, expect } from './fixtures';

test('Hero-Kennzahlen: 4 Brote, 6 Soßen, 18 Zutaten', async ({ page }) => {
  await page.goto('.');
  const stats = page.locator('#hero dl');
  await expect(stats.locator('dd')).toHaveText(['4', '6', '18']);
});

test('Hero-CTAs: Haupt-Button volle Breite, Neben-Buttons halbe Breite, zentriert', async ({ page }) => {
  const vw = page.viewportSize()?.width ?? 0;
  test.skip(vw >= 1024, 'Desktop: zweispaltiges Layout, linksbündig neben dem Logo');
  await page.goto('.');
  const primary = await page.locator('#hero a.btn-primary').boundingBox();
  const pizza = await page.locator('#hero a[href$="/pimp-my-pizza"]').boundingBox();
  const karte = await page.locator('#hero a[href$="/speisekarte"]').boundingBox();
  const dl = await page.locator('#hero dl').boundingBox();
  if (!primary || !pizza || !karte || !dl) throw new Error('Hero-Elemente fehlen');

  // Neben-Buttons in einer Reihe, je ~halbe Breite des Haupt-Buttons
  expect(Math.abs(pizza.y - karte.y)).toBeLessThan(2);
  expect(Math.abs(pizza.width - karte.width)).toBeLessThan(2);
  expect(pizza.width).toBeLessThan(primary.width * 0.55);
  expect(pizza.x).toBeCloseTo(primary.x, 0);
  expect(karte.x + karte.width).toBeCloseTo(primary.x + primary.width, 0);

  // Horizontal zentriert im Viewport
  const center = vw / 2;
  expect(Math.abs(primary.x + primary.width / 2 - center)).toBeLessThan(4);
  expect(Math.abs(dl.x + dl.width / 2 - center)).toBeLessThan(4);
  // Kein horizontaler Overflow
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});
