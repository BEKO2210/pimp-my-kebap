// Speisekarte komplett: alle Sektionen & Items, Preise, Quick-Jump-Nav,
// Suche + Filter (vegetarisch/scharf/Allergene/Reset), Options-Dialog
// (Pflichtwahl, Aufpreise, Mehrfachwahl) und Getränke inkl. Pfand.

import { test, expect } from './fixtures';
import { moneyRe, pinClock, BERLIN, openMenuSection } from './helpers';
import { MENU, ALL_CATEGORIES } from '../../src/data/menu';
import { DRINKS } from '../../src/data/drinks';

test.beforeEach(async ({ page }) => {
  // Neutraler Donnerstag: keine Tagesaktion, Schülerfenster offen — so
  // entsprechen alle angezeigten Preise exakt den Kartenpreisen aus menu.ts.
  await pinClock(page, BERLIN.neutralThursdayNoon);
  await page.goto('speisekarte');
});

test.describe('Struktur & Vollständigkeit', () => {
  test('alle Kategorien haben Sektion + Quick-Jump, Accordion öffnet per Klick', async ({ page }) => {
    test.slow();
    for (const cat of [...ALL_CATEGORIES, 'getraenke']) {
      await expect(page.locator(`[data-cat-jump="${cat}"]`), `Jump ${cat}`).toBeVisible();
      const acc = page.locator(`#section-${cat} details[data-menu-accordion]`);
      await expect(acc, `Sektion ${cat}`).toBeAttached();
      await page.locator(`[data-cat-jump="${cat}"]`).click();
      expect(await acc.evaluate((el) => (el as HTMLDetailsElement).open), `Accordion ${cat} offen`).toBe(true);
    }
  });

  test('jedes einzelne Menü-Item ist mit korrektem Kartenpreis gerendert', async ({ page }) => {
    test.slow();
    // Karten existieren im DOM auch bei geschlossenem Accordion.
    await expect(page.locator('article[data-item-id]')).toHaveCount(MENU.length);
    for (const item of MENU) {
      const card = page.locator(`article[data-item-id="${item.id}"]`);
      await expect(card, `Item ${item.id}`).toHaveCount(1);
      if (item.priceEur !== null) {
        await expect(
          card.locator('[data-price-current]'),
          `Preis ${item.id}`,
        ).toHaveText(moneyRe(item.priceEur), { useInnerText: false });
        // Kein Aktionstag → kein Streichpreis, kein Badge
        await expect(card.locator('[data-price-original]')).toBeHidden();
        await expect(card.locator('[data-promo-badge]')).toBeHidden();
      }
    }
  });

  test('jede Getränke-Variante hat einen Hinzufügen-Button mit korrektem Preis/Pfand', async ({ page }) => {
    await openMenuSection(page, 'getraenke');
    for (const drink of DRINKS) {
      for (const v of drink.variants) {
        const btn = page.locator(
          `[data-drink-add][data-drink-id="${drink.id}"][data-variant-label="${v.label}"]`,
        );
        await expect(btn, `${drink.id} / ${v.label}`).toBeVisible();
        await expect(btn).toHaveAttribute('data-price', String(v.priceEur));
        await expect(btn).toHaveAttribute('data-deposit', String(v.depositEur));
      }
    }
  });
});

test.describe('Direkt-Stepper (Items ohne Optionen)', () => {
  test('+ fügt hinzu, Menge zählt hoch, − reduziert und entfernt', async ({ page }) => {
    await openMenuSection(page, 'salate');
    const card = page.locator('article[data-item-id="salat-gemischt"]');
    const qty = card.locator('[data-item-qty]');
    const dec = card.locator('[data-item-dec]');

    await expect(dec).toBeDisabled();
    await card.locator('[data-item-inc]').click();
    await expect(qty).toHaveText('1');
    await expect(dec).toBeEnabled();
    await card.locator('[data-item-inc]').click();
    await expect(qty).toHaveText('2');

    // Cart-Bar (mobil) spiegelt den Stand
    const vp = page.viewportSize();
    if (vp && vp.width < 1024) {
      await expect(page.locator('[data-cart-bar]')).toBeVisible();
      await expect(page.locator('[data-cart-bar-count]')).toHaveText('2');
      await expect(page.locator('[data-cart-bar-total]')).toHaveText(moneyRe(11));
    }

    await dec.click();
    await expect(qty).toHaveText('1');
    await dec.click();
    await expect(qty).toHaveText('0');
    await expect(dec).toBeDisabled();
  });

  test('Drawer öffnet beim Hinzufügen NICHT automatisch', async ({ page }) => {
    await openMenuSection(page, 'salate');
    await page.locator('article[data-item-id="salat-gemischt"] [data-item-inc]').click();
    await expect(page.locator('#cart-drawer')).toBeHidden();
  });
});

test.describe('Options-Dialog', () => {
  test('Dönerteller: Pflichtwahl gated Add, Aufpreise & Mehrfach-Soßen stimmen', async ({ page }) => {
    await openMenuSection(page, 'drehspiess');
    await page.locator('article[data-item-id="doenerteller"] [data-item-inc]').click();

    const dialog = page.locator('[data-item-options-dialog]');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('[data-options-title]')).toHaveText('Dönerteller');
    const price = dialog.locator('[data-options-price]');
    const add = dialog.locator('[data-options-add]');

    // Pflichtoptionen (Spieß + Beilage) noch offen → Add gesperrt
    await expect(add).toBeDisabled();
    await expect(price).toHaveText(moneyRe(13));

    // Spieß: Steak +1,00 €
    await dialog.locator('button[data-option-id="spiess"][data-choice-id="rindersteak"]').click();
    await expect(price).toHaveText(moneyRe(14));
    await expect(add).toBeDisabled(); // Beilage fehlt noch

    await dialog.locator('button[data-option-id="beilage"][data-choice-id="reis"]').click();
    await expect(add).toBeEnabled();

    // Zwei Soßen (multi, gratis) + Schmelzkäse +1,00 €
    await dialog.locator('button[data-option-id="saucen"][data-choice-id="naturjoghurt"]').click();
    await dialog.locator('button[data-option-id="saucen"][data-choice-id="bbq"]').click();
    await dialog.locator('button[data-option-id="schmelzkaese"][data-choice-id="ja"]').click();
    await expect(price).toHaveText(moneyRe(15));

    await add.click();
    await expect(dialog).toBeHidden();
    // Menge auf der Karte spiegelt den konfigurierten Artikel
    await expect(
      page.locator('article[data-item-id="doenerteller"] [data-item-qty]'),
    ).toHaveText('1');
  });

  test('Schließen-Button bricht ab, ohne etwas in den Warenkorb zu legen', async ({ page }) => {
    await openMenuSection(page, 'drehspiess');
    await page.locator('article[data-item-id="doenerteller"] [data-item-inc]').click();
    const dialog = page.locator('[data-item-options-dialog]');
    await expect(dialog).toBeVisible();
    await dialog.locator('[data-options-close]').click();
    await expect(dialog).toBeHidden();
    await expect(
      page.locator('article[data-item-id="doenerteller"] [data-item-qty]'),
    ).toHaveText('0');
  });

  test('Schmelzkäse ist mit "Ohne" vorbelegt (kein versteckter Aufpreis)', async ({ page }) => {
    await openMenuSection(page, 'pizza');
    await page.locator('article[data-item-id="pizza-margherita"] [data-item-inc]').click();
    const dialog = page.locator('[data-item-options-dialog]');
    await expect(
      dialog.locator('button[data-option-id="schmelzkaese"][data-choice-id="nein"]'),
    ).toHaveAttribute('aria-pressed', 'true');
    await expect(dialog.locator('[data-options-price]')).toHaveText(moneyRe(8));
    // Keine Pflichtoptionen → sofort hinzufügbar
    await expect(dialog.locator('[data-options-add]')).toBeEnabled();
  });
});

test.describe('Suche & Filter', () => {
  test('Suche filtert Karten und meldet die Trefferzahl', async ({ page }) => {
    const search = page.locator('[data-menu-search]');
    await search.fill('margherita');
    await expect(page.locator('article[data-item-id="pizza-margherita"]')).toBeVisible();
    await expect(page.locator('article[data-item-id="doenerteller"]')).toBeHidden();
    await expect(page.locator('[data-filter-status]')).toHaveText(
      new RegExp(`1 von ${MENU.length} Speisen sichtbar`),
    );

    await search.fill('gibtesnicht-xyz');
    await expect(page.locator('[data-filter-status]')).toContainText('Keine Treffer');
  });

  test('Vegetarisch-Filter zeigt nur vegetarisch getaggte Items', async ({ page }) => {
    await page.locator('[data-menu-filter-dropdown] > summary').click();
    await page.locator('[data-filter-veg]').click();
    const expected = MENU.filter((m) => m.tag === 'vegetarisch').length;
    await expect(page.locator('[data-filter-status]')).toHaveText(
      new RegExp(`${expected} von ${MENU.length} Speisen sichtbar`),
    );
    await expect(page.locator('article[data-item-id="veg-fladen"]')).toBeVisible();
    await expect(page.locator('article[data-item-id="doenerteller"]')).toBeHidden();
  });

  test('Allergen-Ausschluss blendet markierte Items aus, Reset stellt alles wieder her', async ({ page }) => {
    await page.locator('[data-menu-filter-dropdown] > summary').click();
    // Allergen "c" (Fisch) ausschließen → Thunfisch-Items verschwinden
    await page.locator('[data-filter-allergen="c"]').click();
    await expect(page.locator('article[data-item-id="pizza-thunfisch"]')).toBeHidden();
    await expect(page.locator('article[data-item-id="salat-thunfisch"]')).toBeHidden();
    const expected = MENU.filter((m) => !(m.markings ?? []).includes('c')).length;
    await expect(page.locator('[data-filter-status]')).toHaveText(
      new RegExp(`${expected} von ${MENU.length} Speisen sichtbar`),
    );

    // Dropdown ist noch offen (Allergen-Klick schließt es nicht)
    await page.locator('[data-filter-reset]').click();
    await expect(page.locator('[data-filter-status]')).toHaveText('');
    await expect(page.locator('article[data-item-id="pizza-thunfisch"]')).toBeVisible();
  });
});

test.describe('Getränke & Pfand', () => {
  test('Cola-Dose bucht 2,50 € + 0,25 € Pfand, Ayran ohne Pfand', async ({ page }) => {
    await openMenuSection(page, 'getraenke');
    await page
      .locator('[data-drink-add][data-drink-id="cola"][data-variant-label^="Dose"]')
      .click();
    await page.locator('[data-drink-add][data-drink-id="ayran"]').click();

    // Im Drawer (über /weiter geöffnet) erscheinen Pfand-Zeile und Summen
    await page.goto('weiter');
    await page.locator('[data-weiter-checkout]').click();
    const drawer = page.locator('#cart-drawer');
    await expect(drawer).toBeVisible();
    await expect(drawer.locator('[data-totals-items]')).toHaveText(moneyRe(4.5));
    await expect(drawer.locator('[data-totals-deposit-row]')).toBeVisible();
    await expect(drawer.locator('[data-totals-deposit]')).toHaveText(moneyRe(0.25));
    await expect(drawer.locator('[data-totals-grand]')).toHaveText(moneyRe(4.75));

    const colaLine = drawer.locator('[data-cart-items] li', { hasText: 'Cola' });
    await expect(colaLine).toContainText('Pfand pro Stück');
  });
});
