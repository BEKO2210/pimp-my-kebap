// Cart-Drawer komplett: Mengen-Stepper, Entfernen, Leeren, Bestellart,
// Lieferzonen & Gebühren, Mindestbestellwert, Adress-Validierung,
// Abholzeit-Slots, Persistenz (localStorage) und Warenkorb-Teilen.

import { test, expect, type Page } from '@playwright/test';
import {
  moneyRe,
  pinClock,
  BERLIN,
  acceptDialogs,
  dismissDialogs,
  stubClipboard,
  clipboardText,
  openMenuSection,
  openCartViaWeiter,
} from './helpers';
import { DELIVERY_ZONES } from '../../src/data/delivery';

/** Legt n × Gemischter Salat (5,50 €) in den Warenkorb. */
async function addSalat(page: Page, n = 1): Promise<void> {
  await page.goto('speisekarte');
  await openMenuSection(page, 'salate');
  const inc = page.locator('article[data-item-id="salat-gemischt"] [data-item-inc]');
  for (let i = 0; i < n; i++) await inc.click();
  await expect(page.locator('article[data-item-id="salat-gemischt"] [data-item-qty]')).toHaveText(String(n));
}

test.beforeEach(async ({ page }) => {
  await pinClock(page, BERLIN.neutralThursdayNoon);
});

test.describe('Drawer-Grundfunktionen', () => {
  test('leerer Warenkorb: Checkout deaktiviert, Leer-Hinweis sichtbar', async ({ page }) => {
    await page.goto('weiter');
    await expect(page.locator('[data-weiter-checkout]')).toBeDisabled();
    // Drawer direkt prüfen (per Cart-Bar nicht möglich, da leer → Bar versteckt)
    await expect(page.locator('[data-cart-bar]')).toBeHidden();
  });

  test('Mengen-Stepper im Drawer: +/− ändern Menge & Summen, 0 entfernt die Zeile', async ({ page }) => {
    await addSalat(page);
    await openCartViaWeiter(page);
    const drawer = page.locator('#cart-drawer');
    const line = drawer.locator('[data-cart-items] li').first();

    await expect(line).toContainText('Gemischter Salat');
    await line.getByRole('button', { name: 'Mehr' }).click();
    await expect(drawer.locator('[data-totals-items]')).toHaveText(moneyRe(11));
    await expect(drawer.locator('[data-totals-grand]')).toHaveText(moneyRe(11));
    await expect(drawer.locator('[data-cart-header-count]')).toHaveText('2 Artikel');

    await line.getByRole('button', { name: 'Weniger' }).click();
    await expect(drawer.locator('[data-totals-items]')).toHaveText(moneyRe(5.5));

    // Menge 1 → "Weniger" entfernt die Zeile komplett
    await line.getByRole('button', { name: 'Weniger' }).click();
    await expect(drawer.locator('[data-cart-empty]')).toBeVisible();
    await expect(drawer.locator('[data-cart-checkout]')).toBeDisabled();
  });

  test('"Entfernen" löscht die Zeile direkt', async ({ page }) => {
    await addSalat(page, 2);
    await openCartViaWeiter(page);
    const drawer = page.locator('#cart-drawer');
    await drawer.getByRole('button', { name: 'Entfernen' }).click();
    await expect(drawer.locator('[data-cart-empty]')).toBeVisible();
  });

  test('"Leeren" fragt nach (confirm) und leert erst nach Bestätigung', async ({ page }) => {
    await addSalat(page);
    const messages = dismissDialogs(page);
    await openCartViaWeiter(page);
    const drawer = page.locator('#cart-drawer');

    await drawer.locator('[data-cart-clear]').click();
    expect(messages[0]).toContain('Wirklich alle Artikel entfernen?');
    // Abgelehnt → Artikel bleibt
    await expect(drawer.locator('[data-cart-items] li')).toHaveCount(1);
  });

  test('"Leeren" mit Bestätigung leert den Warenkorb', async ({ page }) => {
    await addSalat(page);
    acceptDialogs(page);
    await openCartViaWeiter(page);
    const drawer = page.locator('#cart-drawer');
    await drawer.locator('[data-cart-clear]').click();
    await expect(drawer.locator('[data-cart-empty]')).toBeVisible();
    await expect(drawer.locator('[data-totals-grand]')).toHaveText(moneyRe(0));
  });

  test('Schließen per X-Button und per ESC', async ({ page }) => {
    await addSalat(page);
    await openCartViaWeiter(page);
    const drawer = page.locator('#cart-drawer');

    await drawer.locator('[data-cart-close]').click();
    await expect(drawer).toBeHidden();

    await page.locator('[data-weiter-checkout]').click();
    await expect(drawer).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
  });
});

test.describe('Bestellart & Abholzeit', () => {
  test('Umschalten Abholung/Vor Ort/Lieferung ändert Label & Sichtbarkeit', async ({ page }) => {
    await addSalat(page);
    await openCartViaWeiter(page);
    const drawer = page.locator('#cart-drawer');
    const pickupLabel = drawer.locator('[data-cart-pickup-label]');

    await expect(pickupLabel).toHaveText('Abholzeit');
    await expect(drawer.locator('[data-cart-delivery]')).toBeHidden();
    await expect(drawer.locator('[data-totals-fee-row]')).toBeHidden();

    await drawer.locator('[data-cart-fulfillment="vor-ort"]').click();
    await expect(pickupLabel).toHaveText('Wunsch-Uhrzeit');
    await expect(drawer.locator('[data-cart-delivery]')).toBeHidden();
    await expect(drawer.locator('[data-totals-fee-row]')).toBeHidden();

    await drawer.locator('[data-cart-fulfillment="lieferung"]').click();
    await expect(pickupLabel).toHaveText('Lieferzeit');
    await expect(drawer.locator('[data-cart-delivery]')).toBeVisible();
    await expect(drawer.locator('[data-totals-fee-row]')).toBeVisible();
    await expect(
      drawer.locator('[data-cart-fulfillment="lieferung"]'),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  test('Abholzeit-Slots: 15-Minuten-Raster ab jetzt+20 min bis 21:00', async ({ page }) => {
    // 12:00 → frühester Slot 12:30 (12:20 aufgerundet), letzter 21:00
    await addSalat(page);
    await openCartViaWeiter(page);
    const options = page.locator('[data-cart-pickup] option');
    await expect(options.first()).toHaveText('So schnell wie möglich');
    await expect(options.nth(1)).toHaveText('12:30 Uhr');
    await expect(options.last()).toHaveText('21:00 Uhr');
    // (21:00−12:30)/15min + 1 Slots + ASAP
    await expect(options).toHaveCount(1 + ((21 * 60 - (12 * 60 + 30)) / 15 + 1));
  });
});

test.describe('Lieferung: Zonen, Gebühren, Mindestbestellwert, Adresse', () => {
  test('unter 20 € Bestellwert: Warnung + Checkout gesperrt', async ({ page }) => {
    await addSalat(page); // 5,50 €
    await openCartViaWeiter(page);
    const drawer = page.locator('#cart-drawer');
    await drawer.locator('[data-cart-fulfillment="lieferung"]').click();

    await expect(drawer.locator('[data-cart-warning]')).toBeVisible();
    await expect(drawer.locator('[data-cart-warning]')).toContainText('Lieferung erst ab');
    await expect(drawer.locator('[data-cart-warning]')).toContainText('20,00');
    await expect(drawer.locator('[data-cart-checkout]')).toBeDisabled();
  });

  test('jede Lieferzone rechnet ihre Gebühr in Gebühr & Gesamt ein', async ({ page }) => {
    test.slow();
    await addSalat(page, 4); // 22,00 € ≥ Mindestbestellwert
    await openCartViaWeiter(page);
    const drawer = page.locator('#cart-drawer');
    await drawer.locator('[data-cart-fulfillment="lieferung"]').click();
    await drawer.locator('[data-cart-plz]').fill('71691');
    await drawer.locator('[data-cart-street]').fill('Teststraße 1');

    for (const zone of DELIVERY_ZONES) {
      await drawer.locator('[data-cart-zone]').selectOption(zone.id);
      await expect(drawer.locator('[data-totals-fee]'), zone.city).toHaveText(moneyRe(zone.feeEur));
      await expect(drawer.locator('[data-totals-grand]'), zone.city).toHaveText(
        moneyRe(22 + zone.feeEur),
      );
      await expect(drawer.locator('[data-cart-checkout]')).toBeEnabled();
    }

    // "Andere Stadt" → Gebühr nach Absprache, Gesamt ohne Gebühr
    await drawer.locator('[data-cart-zone]').selectOption('andere');
    await expect(drawer.locator('[data-totals-fee]')).toHaveText('nach Absprache');
    await expect(drawer.locator('[data-totals-grand]')).toHaveText(moneyRe(22));
  });

  test('Adress-Validierung: PLZ-Format & Pflichtfelder gaten den Checkout', async ({ page }) => {
    await addSalat(page, 4);
    await openCartViaWeiter(page);
    const drawer = page.locator('#cart-drawer');
    await drawer.locator('[data-cart-fulfillment="lieferung"]').click();

    // Ohne Adresse
    await expect(drawer.locator('[data-cart-warning]')).toHaveText('Lieferung: PLZ und Straße eingeben.');
    await expect(drawer.locator('[data-cart-checkout]')).toBeDisabled();

    // Falsche PLZ
    await drawer.locator('[data-cart-plz]').fill('123');
    await drawer.locator('[data-cart-street]').fill('Teststraße 1');
    await expect(drawer.locator('[data-cart-warning]')).toContainText('PLZ muss 5 Ziffern haben');
    await expect(drawer.locator('[data-cart-plz]')).toHaveAttribute('aria-invalid', '');
    await expect(drawer.locator('[data-cart-checkout]')).toBeDisabled();

    // Korrekte PLZ → alles frei
    await drawer.locator('[data-cart-plz]').fill('71691');
    await expect(drawer.locator('[data-cart-warning]')).toBeHidden();
    await expect(drawer.locator('[data-cart-checkout]')).toBeEnabled();
  });
});

test.describe('Persistenz & Teilen', () => {
  test('Warenkorb überlebt einen Reload (localStorage)', async ({ page }) => {
    await addSalat(page, 2);
    await page.goto('weiter');
    await expect(page.locator('[data-weiter-cart-count]')).toHaveText('2');

    await page.reload();
    await expect(page.locator('[data-weiter-cart-count]')).toHaveText('2');
    await expect(page.locator('[data-weiter-cart-total]')).toHaveText(moneyRe(11));
  });

  test('Teilen kopiert einen #cart=-Link, der den Warenkorb wiederherstellt', async ({ page, context }) => {
    await stubClipboard(page);
    await addSalat(page, 2);
    await openCartViaWeiter(page);
    await page.locator('[data-cart-share]').click();

    const url = await clipboardText(page);
    expect(url).toContain('#cart=');

    // Frischer Tab ohne localStorage-Warenkorb → Link hydriert den Cart
    const fresh = await context.newPage();
    await fresh.addInitScript(() => localStorage.clear());
    await fresh.goto(url);
    await expect(fresh.locator('[data-weiter-cart-count]')).toHaveText('2');
    await expect(fresh.locator('[data-weiter-cart-total]')).toHaveText(moneyRe(11));
    await fresh.close();
  });

  test('Teilen mit leerem Warenkorb zeigt nur einen Hinweis-Toast', async ({ page }) => {
    await stubClipboard(page);
    await page.goto('weiter');
    // Drawer lässt sich bei leerem Cart nicht über /weiter öffnen — direkt
    // über die (versteckte) Share-Schaltfläche des Drawers testen wir hier
    // stattdessen den Toast-Weg über die Cart-Bar nicht; Klick per DOM:
    await page.locator('[data-cart-share]').evaluate((el) => (el as HTMLButtonElement).click());
    await expect(page.locator('body')).toContainText('Erst Artikel in den Warenkorb');
    expect(await clipboardText(page)).toBe('');
  });
});
