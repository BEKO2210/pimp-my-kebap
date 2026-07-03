// Zeitabhängige Geschäftsregeln mit eingefrorener Uhr (Europe/Berlin):
// Aktionstage (Mo Dönerteller, Di Pide, Mi Pizza), Schüler-Zeitfenster
// (Mo–Fr ≤ 16:00) und der Sonntags-Ruhetag.

import { test, expect } from './fixtures';
import { moneyRe, pinClock, BERLIN, openMenuSection, acceptDialogs, stubWindowOpen, openedUrls, decodeWhatsAppUrl, openCartViaWeiter } from './helpers';
import { MENU } from '../../src/data/menu';

test.describe('Aktionstage (Promo-Preise)', () => {
  test('Montag: Dönerteller 11,00 € statt 13,00 € — bis in die WhatsApp-Nachricht', async ({ page }) => {
    await pinClock(page, BERLIN.mondayNoon);
    await stubWindowOpen(page);
    acceptDialogs(page);
    await page.goto('speisekarte');

    const card = page.locator('article[data-item-id="doenerteller"]');
    await openMenuSection(page, 'drehspiess');
    await expect(card.locator('[data-price-current]')).toHaveText(moneyRe(11));
    await expect(card.locator('[data-price-original]')).toBeVisible();
    await expect(card.locator('[data-price-original]')).toHaveText(moneyRe(13));
    await expect(card.locator('[data-promo-badge]')).toBeVisible();
    await expect(card.locator('[data-price-savings]')).toContainText('Mo-Special');

    // Über den Options-Dialog landet der Aktionspreis im Warenkorb
    await card.locator('[data-item-inc]').click();
    const dialog = page.locator('[data-item-options-dialog]');
    await expect(dialog.locator('[data-options-price]')).toHaveText(moneyRe(11));
    await dialog.locator('button[data-option-id="spiess"][data-choice-id="rinderhack"]').click();
    await dialog.locator('button[data-option-id="beilage"][data-choice-id="pommes"]').click();
    await dialog.locator('[data-options-add]').click();

    await openCartViaWeiter(page);
    const drawer = page.locator('#cart-drawer');
    await expect(drawer.locator('[data-cart-items] li').first()).toContainText('(Aktion)');
    await expect(drawer.locator('[data-totals-grand]')).toHaveText(moneyRe(11));

    await drawer.locator('[data-cart-checkout]').click();
    const { text } = decodeWhatsAppUrl((await openedUrls(page))[0]!);
    expect(text).toContain('1x Dönerteller (Aktion)');
    expect(text).toContain('GESAMT:        11,00 €');
  });

  test('Mittwoch: jede Pizza mit Kartenpreis > 9 € kostet 9,00 €', async ({ page }) => {
    test.slow();
    await pinClock(page, BERLIN.wednesdayNoon);
    await page.goto('speisekarte');
    await openMenuSection(page, 'pizza');

    for (const item of MENU.filter((m) => m.category === 'pizza' && m.promoPriceMap?.[3])) {
      const promo = item.promoPriceMap![3]!;
      const effective = Math.min(promo, item.priceEur!);
      const isPromo = promo < item.priceEur!;
      const card = page.locator(`article[data-item-id="${item.id}"]`);
      await expect(card.locator('[data-price-current]'), item.id).toHaveText(moneyRe(effective));
      if (isPromo) {
        await expect(card.locator('[data-promo-badge]'), item.id).toBeVisible();
        await expect(card.locator('[data-price-original]'), item.id).toHaveText(moneyRe(item.priceEur!));
      } else {
        // Karte günstiger/gleich dem Aktionspreis → keine Fake-Aktion anzeigen
        await expect(card.locator('[data-promo-badge]'), item.id).toBeHidden();
      }
    }
  });

  test('Dienstag: Pide-Tag — Pide Kebap 9,00 € statt 11,00 €', async ({ page }) => {
    await pinClock(page, BERLIN.tuesdayNoon);
    await page.goto('speisekarte');
    await openMenuSection(page, 'pide');
    const card = page.locator('article[data-item-id="pide-kebap"]');
    await expect(card.locator('[data-price-current]')).toHaveText(moneyRe(9));
    await expect(card.locator('[data-price-original]')).toHaveText(moneyRe(11));
    await expect(card.locator('[data-price-savings]')).toContainText('Di-Special');
  });

  test('Donnerstag: kein Aktionstag — Dönerteller & Pizzen zum Kartenpreis', async ({ page }) => {
    await pinClock(page, BERLIN.neutralThursdayNoon);
    await page.goto('speisekarte');
    await openMenuSection(page, 'drehspiess');
    const card = page.locator('article[data-item-id="doenerteller"]');
    await expect(card.locator('[data-price-current]')).toHaveText(moneyRe(13));
    await expect(card.locator('[data-promo-badge]')).toBeHidden();
  });
});

test.describe('Schüler-Angebote (Mo–Fr ≤ 16:00)', () => {
  test('werktags 12:00: Schüler-Items bestellbar', async ({ page }) => {
    await pinClock(page, BERLIN.neutralThursdayNoon);
    await page.goto('speisekarte');
    await openMenuSection(page, 'schueler');
    const card = page.locator('article[data-item-id="schueler-doener"]');
    await expect(card).toHaveAttribute('data-item-orderable', 'true');
    await expect(card.locator('[data-order-stepper]')).toBeVisible();
    await expect(card.locator('[data-order-reason]')).toBeHidden();
    await expect(page.locator('[data-school-badge]')).toHaveText('Mo–Fr ≤16:00');
  });

  test('werktags 17:30: Stepper versteckt, Hinweis sichtbar, Klick fügt nichts hinzu', async ({ page }) => {
    await pinClock(page, BERLIN.neutralThursdayEvening);
    await page.goto('speisekarte');
    await openMenuSection(page, 'schueler');
    const card = page.locator('article[data-item-id="schueler-doener"]');
    await expect(card).toHaveAttribute('data-item-orderable', 'false');
    await expect(card.locator('[data-order-stepper]')).toBeHidden();
    await expect(card.locator('[data-order-reason]')).toBeVisible();
    await expect(page.locator('[data-school-badge]')).toHaveText('außerhalb Schulzeit');

    // Selbst ein programmatischer Klick auf + darf nichts in den Cart legen
    await card.locator('[data-item-inc]').evaluate((el) => (el as HTMLButtonElement).click());
    await page.goto('weiter');
    await expect(page.locator('[data-weiter-cart-count]')).toHaveText('0');
  });

  test('Samstag: Schüler-Sektion ist komplett ausgeblendet', async ({ page }) => {
    await pinClock(page, BERLIN.saturdayNoon);
    await page.goto('speisekarte');
    const section = page.locator('[data-school-section]');
    await expect(section).toHaveClass(/school-day-off/);
  });
});

test.describe('Sonntag (Ruhetag)', () => {
  test('Abholzeit-Liste bietet sonntags nur ASAP an', async ({ page }) => {
    await pinClock(page, BERLIN.sundayNoon);
    await page.goto('speisekarte');
    await openMenuSection(page, 'salate');
    await page.locator('article[data-item-id="salat-gemischt"] [data-item-inc]').click();
    await openCartViaWeiter(page);
    await expect(page.locator('[data-cart-pickup] option')).toHaveCount(1);
    await expect(page.locator('[data-cart-pickup] option').first()).toHaveText(
      'So schnell wie möglich',
    );
  });

  test('Checkout-Vorschau warnt sonntags: geschlossen, Mo wieder', async ({ page }) => {
    await pinClock(page, BERLIN.sundayNoon);
    await stubWindowOpen(page);
    const dialogs = acceptDialogs(page);
    await page.goto('speisekarte');
    await openMenuSection(page, 'salate');
    await page.locator('article[data-item-id="salat-gemischt"] [data-item-inc]').click();
    await openCartViaWeiter(page);
    await page.locator('[data-cart-checkout]').click();
    expect(dialogs[0]).toContain('Wir haben gerade geschlossen');
    expect(dialogs[0]).toContain('Mo wieder ab 10:30 Uhr');
  });
});
