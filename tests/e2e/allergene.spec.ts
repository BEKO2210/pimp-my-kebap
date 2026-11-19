// Allergen-Kennzeichnung (Soßen/Dips) und Sortiment ohne Grill-/Ofengemüse —
// sichtbar auf Speisekarte, im Kebap-Konfigurator und im Options-Dialog.

import { test, expect } from './fixtures';
import { pinClock, BERLIN, openMenuSection } from './helpers';

test.beforeEach(async ({ page }) => {
  await pinClock(page, BERLIN.neutralThursdayNoon);
});

test('Speisekarte zeigt den Allergen-Hinweis gut sichtbar', async ({ page }) => {
  await page.goto('speisekarte');
  const notice = page.locator('[data-allergen-notice]');
  await expect(notice).toBeVisible();
  await expect(notice).toContainText('Allergien oder Unverträglichkeiten?');
  await expect(notice).toContainText(
    'Bitte sprechen Sie uns vor Ihrer Bestellung an.',
  );
  await expect(notice).toContainText(
    'enthaltenen Allergene und Zutaten unserer Speisen und Soßen',
  );
});

test('Konfigurator: Soßen tragen Allergen-Badges (Ei bei Mayo, Milch bei Joghurt)', async ({ page }) => {
  await page.goto('konfigurator');

  await expect(page.locator('[data-cfg-allergen-note]')).toContainText('Mayonnaise');

  // Mayo-Soße → Eier (f)
  const bbq = page.locator('[data-cfg-sauce-card="bbq"]');
  await expect(bbq.locator('[aria-label^="Allergene"]')).toHaveAttribute(
    'aria-label',
    /Eier/,
  );
  // Joghurt-Soße → Milch (d), kein Ei
  const joghurt = page.locator('[data-cfg-sauce-card="naturjoghurt"]');
  const joghurtLabel = await joghurt
    .locator('[aria-label^="Allergene"]')
    .getAttribute('aria-label');
  expect(joghurtLabel).toContain('Milch');
  expect(joghurtLabel).not.toContain('Eier');
});

test('Konfigurator: Ofengemüse/Grillgemüse ist aus den Toppings verschwunden', async ({ page }) => {
  await page.goto('konfigurator');
  await expect(page.locator('[data-cfg-topping-card]')).toHaveCount(18);
  await expect(page.locator('[data-cfg-topping-card="ofengemuese"]')).toHaveCount(0);
  await expect(
    page.locator('fieldset[data-cfg-step="toppings"]').getByText(/gemüse/i),
  ).toHaveCount(0);
});

test('Options-Dialog: Soßen-Auswahl zeigt Allergen-Kürzel, Label bleibt sauber', async ({ page }) => {
  await page.goto('speisekarte');
  await openMenuSection(page, 'drehspiess');
  await page.locator('article[data-item-id="doenerteller"] [data-item-inc]').click();
  const dialog = page.locator('[data-item-options-dialog]');
  await expect(dialog).toBeVisible();

  const bbqBtn = dialog.locator('button[data-option-id="saucen"][data-choice-id="bbq"]');
  await expect(bbqBtn.locator('[aria-label^="Allergene"]')).toHaveAttribute(
    'aria-label',
    /Eier/,
  );
  const joghurtBtn = dialog.locator(
    'button[data-option-id="saucen"][data-choice-id="naturjoghurt"]',
  );
  await expect(joghurtBtn.locator('[aria-label^="Allergene"]')).toHaveAttribute(
    'aria-label',
    /Milch/,
  );
});

test('Options-Dialog: Mayo-Dips mit Ei-Kürzel, Ketchup ohne', async ({ page }) => {
  await page.goto('speisekarte');
  await openMenuSection(page, 'pommes');
  await page
    .locator('article[data-item-id="chili-cheese-pommes"] [data-item-inc]')
    .click();
  const dialog = page.locator('[data-item-options-dialog]');
  await expect(dialog).toBeVisible();

  await expect(
    dialog
      .locator('button[data-option-id="dips"][data-choice-id="mayo"]')
      .locator('[aria-label^="Allergene"]'),
  ).toHaveAttribute('aria-label', /Eier/);
  await expect(
    dialog
      .locator('button[data-option-id="dips"][data-choice-id="ketchup"]')
      .locator('[aria-label^="Allergene"]'),
  ).toHaveCount(0);
});
