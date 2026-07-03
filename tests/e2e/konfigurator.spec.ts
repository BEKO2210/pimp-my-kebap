// Kebap-Konfigurator komplett: alle Basen, Spieße, Brote, Soßen, Toppings,
// Extras — inklusive zeichengenauer Preisprüfung nach jedem Schritt und dem
// Redirect-Verhalten nach "In den Warenkorb".

import { test, expect, type Page } from '@playwright/test';
import { moneyRe, pinClock, BERLIN } from './helpers';
import { BASES, MEATS } from '../../src/data/configurator';
import { BREADS } from '../../src/data/breads';
import { SAUCES } from '../../src/data/sauces';
import { TOPPINGS } from '../../src/data/ingredients';

const total = (page: Page) => page.locator('[data-cfg-total]');
const addBtn = (page: Page) => page.locator('[data-cfg-add]');

test.beforeEach(async ({ page }) => {
  await pinClock(page, BERLIN.neutralThursdayNoon);
  await page.goto('konfigurator');
});

test.describe('Schritt-Gating & Sichtbarkeit', () => {
  test('ohne Basis: Add gesperrt, Aufforderung "Wähle deine Basis"', async ({ page }) => {
    await expect(addBtn(page)).toBeDisabled();
    await expect(total(page)).toHaveText('Wähle deine Basis');
  });

  test('Kebap Basic: Brot-Schritt erscheint, Add erst nach Brotwahl', async ({ page }) => {
    await page.locator('[data-cfg-base="kebap_basic"]').click();
    await expect(page.locator('fieldset[data-cfg-step="bread"]')).toBeVisible();
    await expect(total(page)).toHaveText('Wähle dein Brot');
    await expect(addBtn(page)).toBeDisabled();

    await page.locator('[data-cfg-bread="klassisch"]').click();
    await expect(addBtn(page)).toBeEnabled();
    await expect(total(page)).toHaveText(moneyRe(6.5));
  });

  test('Yufka Basic: kein Brot-Schritt, Add sofort aktiv, 7,50 €', async ({ page }) => {
    await page.locator('[data-cfg-base="yufka_basic"]').click();
    await expect(page.locator('fieldset[data-cfg-step="bread"]')).toBeHidden();
    await expect(addBtn(page)).toBeEnabled();
    await expect(total(page)).toHaveText(moneyRe(7.5));
  });

  test('Kebap Box: Brot & Pimp-Schritte versteckt, Box-Hinweis sichtbar, 6,50 €', async ({ page }) => {
    await page.locator('[data-cfg-base="kebap_box"]').click();
    await expect(page.locator('fieldset[data-cfg-step="bread"]')).toBeHidden();
    await expect(page.locator('fieldset[data-cfg-step="pimp"]')).toBeHidden();
    await expect(page.locator('[data-cfg-box-hint]')).toBeVisible();
    await expect(addBtn(page)).toBeEnabled();
    await expect(total(page)).toHaveText(moneyRe(6.5));
  });

  test('Wechsel auf Kebap Box verwirft bereits gewählte Extras', async ({ page }) => {
    await page.locator('[data-cfg-base="yufka_basic"]').click();
    await page.locator('[data-cfg-sauce-card="bbq"]').click();
    await page.locator('input[data-cfg-flag="schmelzkaese"]').check();
    await expect(total(page)).toHaveText(moneyRe(8.5)); // 7,50 + 1,00 Schmelzkäse

    await page.locator('[data-cfg-base="kebap_box"]').click();
    await expect(total(page)).toHaveText(moneyRe(6.5)); // Extras weg
    // Zurück zu Yufka: Extras bleiben zurückgesetzt
    await page.locator('[data-cfg-base="yufka_basic"]').click();
    await expect(total(page)).toHaveText(moneyRe(7.5));
    await expect(page.locator('input[data-cfg-flag="schmelzkaese"]')).not.toBeChecked();
  });
});

test.describe('Vollständigkeit der Optionen', () => {
  test('alle Basen, Spieße, Brote, Soßen und Toppings sind klickbar vorhanden', async ({ page }) => {
    for (const b of BASES) {
      await expect(page.locator(`[data-cfg-base="${b.id}"]`), `Basis ${b.id}`).toBeVisible();
    }
    for (const m of MEATS) {
      await expect(page.locator(`[data-cfg-meat="${m.id}"]`), `Spieß ${m.id}`).toBeVisible();
    }
    // Brot-Schritt sichtbar machen
    await page.locator('[data-cfg-base="kebap_basic"]').click();
    for (const b of BREADS) {
      await expect(page.locator(`[data-cfg-bread="${b.id}"]`), `Brot ${b.id}`).toBeVisible();
    }
    for (const s of SAUCES) {
      await expect(page.locator(`[data-cfg-sauce-card="${s.id}"]`), `Soße ${s.id}`).toBeVisible();
    }
    for (const t of TOPPINGS) {
      await expect(page.locator(`[data-cfg-topping-card="${t.id}"]`), `Topping ${t.id}`).toBeVisible();
    }
  });

  test('Basis-Toppings (Salat, Kraut, Zwiebeln, Tomaten) sind vorab aktiv', async ({ page }) => {
    for (const t of TOPPINGS.filter((t) => t.baseIncluded)) {
      await expect(page.locator(`input[data-cfg-topping="${t.id}"]`)).toBeChecked();
    }
  });
});

test.describe('Preislogik (Live-Summe)', () => {
  test('jede Brotsorte lässt den Preis unverändert (6,50 €)', async ({ page }) => {
    await page.locator('[data-cfg-base="kebap_basic"]').click();
    for (const b of BREADS) {
      await page.locator(`[data-cfg-bread="${b.id}"]`).click();
      await expect(total(page)).toHaveText(moneyRe(6.5));
    }
  });

  test('Spieß-Aufpreise: Hack & Chicken +0, Steak +1,00 €', async ({ page }) => {
    await page.locator('[data-cfg-base="yufka_basic"]').click();
    for (const m of MEATS) {
      await page.locator(`[data-cfg-meat="${m.id}"]`).click();
      await expect(total(page)).toHaveText(moneyRe(7.5 + m.upchargeEur));
    }
  });

  test('Soßen: die ersten 2 gratis, jede weitere +0,50 €', async ({ page }) => {
    await page.locator('[data-cfg-base="yufka_basic"]').click();
    await page.locator('[data-cfg-sauce-card="naturjoghurt"]').click();
    await expect(total(page)).toHaveText(moneyRe(7.5));
    await page.locator('[data-cfg-sauce-card="bbq"]').click();
    await expect(total(page)).toHaveText(moneyRe(7.5));
    await page.locator('[data-cfg-sauce-card="cocktail"]').click();
    await expect(total(page)).toHaveText(moneyRe(8.0));
    await page.locator('[data-cfg-sauce-card="leicht_scharf"]').click();
    await expect(total(page)).toHaveText(moneyRe(8.5));
    // Abwählen rechnet zurück
    await page.locator('[data-cfg-sauce-card="leicht_scharf"]').click();
    await expect(total(page)).toHaveText(moneyRe(8.0));
  });

  test('Toppings: Basis-Zutaten kostenlos, Extra-Zutaten je +0,50 €', async ({ page }) => {
    await page.locator('[data-cfg-base="yufka_basic"]').click();
    // Basis-Topping abwählen & wieder anwählen — Preis bleibt 7,50 €
    await page.locator('[data-cfg-topping-card="kraut"]').click();
    await expect(total(page)).toHaveText(moneyRe(7.5));
    await page.locator('[data-cfg-topping-card="kraut"]').click();
    await expect(total(page)).toHaveText(moneyRe(7.5));
    // Kostenpflichtige Toppings
    await page.locator('[data-cfg-topping-card="feta"]').click();
    await expect(total(page)).toHaveText(moneyRe(8.0));
    await page.locator('[data-cfg-topping-card="jalapenos"]').click();
    await expect(total(page)).toHaveText(moneyRe(8.5));
  });

  test('Extras: Schmelzkäse +1,00 €, Mehr-Fleisch-Stepper (1,50 €/50 g, max 3, min 0)', async ({ page }) => {
    await page.locator('[data-cfg-base="yufka_basic"]').click();
    const inc = page.locator('[data-cfg-extra-meat="inc"]');
    const dec = page.locator('[data-cfg-extra-meat="dec"]');
    const value = page.locator('[data-cfg-extra-meat-value]');

    await page.locator('input[data-cfg-flag="schmelzkaese"]').check();
    await expect(total(page)).toHaveText(moneyRe(8.5));

    await inc.click();
    await expect(value).toHaveText('1');
    await expect(total(page)).toHaveText(moneyRe(10.0));
    await inc.click();
    await inc.click();
    await expect(value).toHaveText('3');
    await expect(total(page)).toHaveText(moneyRe(13.0));
    // Clamp oben: 4. Klick ändert nichts
    await inc.click();
    await expect(value).toHaveText('3');
    await expect(total(page)).toHaveText(moneyRe(13.0));
    // Clamp unten: nie unter 0
    for (let i = 0; i < 5; i++) await dec.click();
    await expect(value).toHaveText('0');
    await expect(total(page)).toHaveText(moneyRe(8.5));
  });

  test('Maximal-Konfiguration rechnet korrekt zusammen', async ({ page }) => {
    // Kebap Basic 6,50 + Steak 1,00 + 3×1,50 Fleisch + 1,00 Schmelzkäse
    // + alle 6 Soßen (4 × 0,50) + alle 15 Zahl-Toppings (15 × 0,50) = 22,50 €
    await page.locator('[data-cfg-base="kebap_basic"]').click();
    await page.locator('[data-cfg-bread="vital"]').click();
    await page.locator('[data-cfg-meat="rindersteak"]').click();
    for (const s of SAUCES) await page.locator(`[data-cfg-sauce-card="${s.id}"]`).click();
    for (const t of TOPPINGS.filter((t) => !t.baseIncluded)) {
      await page.locator(`[data-cfg-topping-card="${t.id}"]`).click();
    }
    await page.locator('input[data-cfg-flag="schmelzkaese"]').check();
    for (let i = 0; i < 3; i++) await page.locator('[data-cfg-extra-meat="inc"]').click();
    await expect(total(page)).toHaveText(moneyRe(22.5));
  });
});

test.describe('Add-to-Cart & Redirect', () => {
  test('Add → /weiter?added=kebap, Erfolgsbanner, Drawer bleibt zu, Summe stimmt', async ({ page }) => {
    await page.locator('[data-cfg-base="kebap_basic"]').click();
    await page.locator('[data-cfg-bread="klassisch"]').click();
    await page.locator('[data-cfg-meat="rindersteak"]').click();
    await addBtn(page).click();

    await expect(page).toHaveURL(/\/weiter\?added=kebap$/);
    const banner = page.locator('[data-weiter-success]');
    await expect(banner).toBeVisible();
    await expect(banner.locator('[data-weiter-success-item]')).toHaveText('Kebap');
    await expect(page.locator('#cart-drawer')).toBeHidden();

    await expect(page.locator('[data-weiter-cart-count]')).toHaveText('1');
    await expect(page.locator('[data-weiter-cart-total]')).toHaveText(moneyRe(7.5));
    await expect(page.locator('[data-weiter-checkout]')).toBeEnabled();
  });

  test('Surprise Me erzeugt eine gültige Konfiguration mit Preis', async ({ page }) => {
    await page.locator('[data-surprise-me]').first().click();
    await expect(addBtn(page)).toBeEnabled();
    await expect(page.locator('[data-cfg-total-label]')).toHaveText('Aktueller Preis');
    await expect(total(page)).toHaveText(/\d+,\d{2}\s*€/);
    // Add funktioniert direkt im Anschluss
    await addBtn(page).click();
    await expect(page).toHaveURL(/\/weiter\?added=kebap$/);
  });
});

test.describe('Hamburger menu (mobile only)', () => {
  test('opens on tap and closes via ESC', async ({ page }) => {
    const vp = page.viewportSize();
    test.skip(!vp || vp.width >= 768, 'Hamburger renders only below md');

    await page.goto('.');
    const toggle = page.locator('[data-mobile-nav-toggle]');
    await expect(toggle).toBeVisible();

    await toggle.click();
    const panel = page.locator('[data-mobile-nav-panel]');
    await expect(panel).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
  });
});
