// Der komplette Bestellabschluss — bis zum letzten Zeichen:
// Warenkorb wird über die echte UI aufgebaut (Konfigurator + Options-Dialog +
// Getränk), dann wird die confirm()-Vorschau und die generierte wa.me-URL
// abgefangen und die WhatsApp-Nachricht ZEICHENGENAU gegen den Erwartungswert
// verglichen (Preise, Aufpreise, Pfand, Liefergebühr, Adresse, Footer).

import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';
import {
  money,
  moneyRe,
  norm,
  pinClock,
  BERLIN,
  acceptDialogs,
  dismissDialogs,
  stubWindowOpen,
  openedUrls,
  decodeWhatsAppUrl,
  openMenuSection,
  openCartViaWeiter,
  WA_SEPARATOR as SEP,
} from './helpers';
import { BRAND } from '../../src/data/brand';

/**
 * Baut den Referenz-Warenkorb über die echte UI:
 *  1. Kebap Basic (Klassisch, Steak, 2× Fleisch, Schmelzkäse,
 *     3 Soßen, +Feta)                                            = 12,50 €
 *  2. Pizza Margherita (Soße Kräuter-Knoblauch, mit Schmelzkäse) =  9,00 €
 *  3. Cola Dose 330 ml                                           =  2,50 € + 0,25 € Pfand
 */
async function buildReferenceCart(page: Page): Promise<void> {
  // 1 — Kebap über den Konfigurator
  await page.goto('konfigurator');
  await page.locator('[data-cfg-base="kebap_basic"]').click();
  await page.locator('[data-cfg-bread="klassisch"]').click();
  await page.locator('[data-cfg-meat="rindersteak"]').click();
  await page.locator('[data-cfg-sauce-card="naturjoghurt"]').click();
  await page.locator('[data-cfg-sauce-card="bbq"]').click();
  await page.locator('[data-cfg-sauce-card="cocktail"]').click();
  await page.locator('[data-cfg-topping-card="feta"]').click();
  await page.locator('input[data-cfg-flag="schmelzkaese"]').check();
  await page.locator('[data-cfg-extra-meat="inc"]').click();
  await page.locator('[data-cfg-extra-meat="inc"]').click();
  await expect(page.locator('[data-cfg-total]')).toHaveText(moneyRe(12.5));
  await page.locator('[data-cfg-add]').click();
  await expect(page).toHaveURL(/\/weiter\?added=kebap$/);

  // 2 — Pizza Margherita über den Speisekarten-Dialog
  await page.goto('speisekarte');
  await openMenuSection(page, 'pizza');
  await page.locator('article[data-item-id="pizza-margherita"] [data-item-inc]').click();
  const dialog = page.locator('[data-item-options-dialog]');
  await dialog.locator('button[data-option-id="saucen"][data-choice-id="kraeuter_knoblauch"]').click();
  await dialog.locator('button[data-option-id="schmelzkaese"][data-choice-id="ja"]').click();
  await expect(dialog.locator('[data-options-price]')).toHaveText(moneyRe(9));
  await dialog.locator('[data-options-add]').click();

  // 3 — Cola Dose
  await openMenuSection(page, 'getraenke');
  await page.locator('[data-drink-add][data-drink-id="cola"][data-variant-label^="Dose"]').click();
}

/** Erwartete Artikel-Blöcke des Referenz-Warenkorbs (exakter Wortlaut). */
const REFERENCE_BLOCKS = [
  '1x Kebap Basic (Klassisches Dönerbrot)',
  `   • Fleisch: Steak Döner (+${money(1)})`,
  `   • Mehr Fleisch: 2× 50 g (+${money(3)})`,
  `   • Schmelzkäse: ja (+${money(1)})`,
  `   • Soßen: Naturjoghurt, BBQ, Cocktail (1× +${money(0.5)})`,
  `   • Toppings: Salat, Kraut, Zwiebeln, Tomaten, Feta (1× +${money(0.5)})`,
  `   = ${money(12.5)}`,
  '1x Pizza Margherita',
  '   • Soßen: Kräuter-Knoblauch-Joghurt · Mit Schmelzkäse',
  `   = ${money(9)}`,
  '1x Cola (Dose 330 ml)',
  `   = ${money(2.5)} + ${money(0.25)} Pfand`,
];

// expiresAtMs für den Seed-Cart: Referenz-Donnerstag + 12 h (Uhr ist gepinnt).
const BERLIN_EXPIRY = BERLIN.neutralThursdayNoon.getTime() + 12 * 60 * 60 * 1000;

test.beforeEach(async ({ page }) => {
  await pinClock(page, BERLIN.neutralThursdayNoon);
  await stubWindowOpen(page);
});

test('Abholung: WhatsApp-Nachricht stimmt Zeichen für Zeichen', async ({ page }) => {
  test.slow();
  const dialogs = acceptDialogs(page);
  await buildReferenceCart(page);
  await openCartViaWeiter(page);

  const drawer = page.locator('#cart-drawer');
  await drawer.locator('[data-cart-firstname]').fill('Testkunde');
  await drawer.locator('[data-cart-notes]').fill('Bitte extra Servietten');

  // Summen im Drawer stimmen vor dem Senden
  await expect(drawer.locator('[data-totals-items]')).toHaveText(moneyRe(24));
  await expect(drawer.locator('[data-totals-deposit]')).toHaveText(moneyRe(0.25));
  await expect(drawer.locator('[data-totals-grand]')).toHaveText(moneyRe(24.25));

  await drawer.locator('[data-cart-checkout]').click();

  // confirm()-Vorschau enthält die komplette Nachricht
  expect(dialogs).toHaveLength(1);
  expect(norm(dialogs[0]!)).toContain('Deine Bestellung wird in WhatsApp geöffnet:');
  expect(norm(dialogs[0]!)).toContain('PIMP MY KEBAP — Neue Bestellung');

  // wa.me-URL abfangen und dekodieren
  const urls = await openedUrls(page);
  expect(urls).toHaveLength(1);
  const { number, text } = decodeWhatsAppUrl(urls[0]!);
  expect(number).toBe(BRAND.contact.whatsappE164NoPlus);

  const expected = [
    'PIMP MY KEBAP — Neue Bestellung',
    SEP,
    'Name:    Testkunde',
    'Abholung: ASAP',
    'Verzehr: Abholung',
    SEP,
    ...REFERENCE_BLOCKS,
    SEP,
    `Zwischensumme: ${money(24)}`,
    `Pfand:          ${money(0.25)}`,
    `GESAMT:        ${money(24.25)}`,
    SEP,
    'Hinweis: Bitte extra Servietten',
    SEP,
    `Abholung bei: ${BRAND.address.street}, ${BRAND.address.postalCode} ${BRAND.address.city}`,
    `Rückfragen: ${BRAND.contact.phoneDisplay}`,
  ].join('\n');

  expect(text).toBe(expected);

  // Erfolgs-Toast erschienen
  await expect(page.locator('body')).toContainText('Bestellung gesendet');
});

test('Lieferung: Adresse, Zonengebühr und Gesamtsumme landen exakt in der Nachricht', async ({ page }) => {
  test.slow();
  acceptDialogs(page);
  await buildReferenceCart(page); // 24,00 € ≥ Mindestbestellwert
  await openCartViaWeiter(page);

  const drawer = page.locator('#cart-drawer');
  await drawer.locator('[data-cart-firstname]').fill('Liefer Kunde');
  await drawer.locator('[data-cart-fulfillment="lieferung"]').click();
  await drawer.locator('[data-cart-zone]').selectOption('benningen');
  await drawer.locator('[data-cart-plz]').fill('71726');
  await drawer.locator('[data-cart-street]').fill('Teststraße 1');

  await expect(drawer.locator('[data-totals-fee]')).toHaveText(moneyRe(4));
  await expect(drawer.locator('[data-totals-grand]')).toHaveText(moneyRe(28.25));
  await drawer.locator('[data-cart-checkout]').click();

  const urls = await openedUrls(page);
  const { text } = decodeWhatsAppUrl(urls[0]!);

  const expected = [
    'PIMP MY KEBAP — Neue Bestellung',
    SEP,
    'Name:    Liefer Kunde',
    'Lieferung: ASAP',
    'Verzehr: Lieferung',
    SEP,
    'Lieferadresse:',
    '   Teststraße 1',
    '   71726 Benningen',
    SEP,
    ...REFERENCE_BLOCKS,
    SEP,
    `Zwischensumme: ${money(24)}`,
    `Pfand:          ${money(0.25)}`,
    `Liefergebühr:  ${money(4)}`,
    `GESAMT:        ${money(28.25)}`,
    SEP,
    `Restaurant: ${BRAND.address.street}, ${BRAND.address.postalCode} ${BRAND.address.city}`,
    `Rückfragen: ${BRAND.contact.phoneDisplay}`,
  ].join('\n');

  expect(text).toBe(expected);
});

test('geplante Abholzeit erscheint als "HH:MM Uhr" in der Nachricht', async ({ page }) => {
  acceptDialogs(page);
  await page.goto('speisekarte');
  await openMenuSection(page, 'salate');
  await page.locator('article[data-item-id="salat-gemischt"] [data-item-inc]').click();
  await openCartViaWeiter(page);

  const drawer = page.locator('#cart-drawer');
  await drawer.locator('[data-cart-pickup]').selectOption({ label: '18:00 Uhr' });
  await drawer.locator('[data-cart-checkout]').click();

  const { text } = decodeWhatsAppUrl((await openedUrls(page))[0]!);
  expect(text).toContain('Abholung: 18:00 Uhr');
  expect(text).toContain(`1x Gemischter Salat`);
  expect(text).toContain(`GESAMT:        ${money(5.5)}`);
});

test('Abbrechen in der Vorschau sendet nichts und speichert keinen Verlauf', async ({ page }) => {
  dismissDialogs(page);
  await page.goto('speisekarte');
  await openMenuSection(page, 'salate');
  await page.locator('article[data-item-id="salat-gemischt"] [data-item-inc]').click();
  await openCartViaWeiter(page);

  await page.locator('[data-cart-checkout]').click();
  expect(await openedUrls(page)).toHaveLength(0);
  const history = await page.evaluate(() => localStorage.getItem('pmk-history-v1'));
  expect(history).toBeNull();
  // Warenkorb bleibt erhalten
  await expect(page.locator('#cart-drawer [data-cart-items] li')).toHaveCount(1);
});

test('Sende-Drossel: direkt erneut senden wird mit Hinweis geblockt', async ({ page }) => {
  acceptDialogs(page);
  await page.goto('speisekarte');
  await openMenuSection(page, 'salate');
  await page.locator('article[data-item-id="salat-gemischt"] [data-item-inc]').click();
  await openCartViaWeiter(page);

  const drawer = page.locator('#cart-drawer');
  await drawer.locator('[data-cart-checkout]').click();
  expect(await openedUrls(page)).toHaveLength(1);

  // Uhr ist eingefroren → zweiter Klick liegt garantiert < 5 s nach dem ersten
  await drawer.locator('[data-cart-checkout]').click();
  await expect(drawer.locator('[data-cart-warning]')).toHaveText(
    'Bitte einen Moment warten, bevor du erneut sendest.',
  );
  expect(await openedUrls(page)).toHaveLength(1); // kein zweiter Send
});

test('außerhalb der Öffnungszeiten warnt die Vorschau ("gerade geschlossen")', async ({ page }) => {
  // 22:00 Uhr — Laden hat um 21:00 geschlossen
  await pinClock(page, BERLIN.thursdayLate);
  const dialogs = acceptDialogs(page);
  await page.goto('speisekarte');
  await openMenuSection(page, 'salate');
  await page.locator('article[data-item-id="salat-gemischt"] [data-item-inc]').click();
  await openCartViaWeiter(page);

  await page.locator('[data-cart-checkout]').click();
  expect(dialogs[0]).toContain('Wir haben gerade geschlossen');
  expect(dialogs[0]).toContain('Fr ab 10:30 Uhr');
});

test('Überlange Bestellung (> 6,5 KB URL) warnt mit Telefon-Fallback', async ({ page }) => {
  // 40 Menü-Zeilen mit maximalen Notizen direkt in localStorage seeden — so
  // eine Bestellung ist per UI möglich (Dialog-Adds erzeugen je eine eigene
  // Zeile), aber hier zählt nur der Checkout-Pfad über dem URL-Limit.
  const lines = Array.from({ length: 40 }, (_, i) => ({
    kind: 'menu',
    id: `line-${i}`,
    quantity: 1,
    itemId: 'doenerteller',
    itemName: 'Dönerteller',
    category: 'drehspiess',
    unitPriceEur: 13,
    notes: `Sonderwunsch Nummer ${i}: `.padEnd(240, 'sehr wichtig bitte beachten '),
  }));
  await page.addInitScript(
    ([payload]) => localStorage.setItem('pmk-cart-v1', payload as string),
    [
      JSON.stringify({
        version: 1,
        lines,
        customer: { firstName: 'Test', fulfillment: 'abholung', pickup: { kind: 'asap' } },
        expiresAtMs: BERLIN_EXPIRY,
      }),
    ],
  );
  const dialogs = acceptDialogs(page);
  await openCartViaWeiter(page);
  await page.locator('[data-cart-checkout]').click();

  expect(dialogs[0]).toContain('Deine Bestellung ist sehr lang');
  expect(dialogs[0]).toContain(BRAND.contact.phoneDisplay);
  // Gesendet wird trotzdem (Kunde hat bestätigt) — URL ist über dem Limit
  const urls = await openedUrls(page);
  expect(urls[0]!.length).toBeGreaterThan(6500);
});

test('Bestellverlauf: gesendete Bestellung erscheint auf der Startseite und ist erneut bestellbar', async ({ page }) => {
  acceptDialogs(page);
  await page.goto('speisekarte');
  await openMenuSection(page, 'salate');
  await page.locator('article[data-item-id="salat-gemischt"] [data-item-inc]').click();
  await page.locator('article[data-item-id="salat-gemischt"] [data-item-inc]').click();
  await openCartViaWeiter(page);
  await page.locator('[data-cart-checkout]').click();
  expect(await openedUrls(page)).toHaveLength(1);

  await page.goto('.');
  const history = page.locator('[data-history-root]');
  await expect(history).toBeVisible();
  const entry = history.locator('[data-history-list] li').first();
  await expect(entry).toContainText('Gemischter Salat');
  await expect(entry).toContainText(/11,00\s*€/);

  await entry.getByRole('button', { name: /Erneut bestellen/ }).click();
  // Reorder legt die Zeilen zusätzlich in den (noch gefüllten) Warenkorb
  const drawer = page.locator('#cart-drawer');
  await expect(drawer).toBeVisible();
  await expect(drawer.locator('[data-totals-items]')).toHaveText(moneyRe(22));
});

