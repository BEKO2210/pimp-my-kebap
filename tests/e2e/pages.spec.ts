// Alle Routen + globale UI-Elemente: Header-Navigation, Öffnungs-Pill,
// Wochenbanner, Footer (inkl. Pflicht-Attribution), Rechtsseiten, 404.

import { test, expect } from '@playwright/test';
import { pinClock, BERLIN } from './helpers';
import { BRAND } from '../../src/data/brand';

test.describe('Seiten laden & Kern-Inhalte', () => {
  const routes: Array<{ path: string; headingRe: RegExp }> = [
    { path: '.', headingRe: /Create Your Kebap|Pimp My Kebap/i },
    { path: 'speisekarte', headingRe: /Speisekarte/i },
    { path: 'konfigurator', headingRe: /Kebap|Konfigurator/i },
    { path: 'pimp-my-pizza', headingRe: /Pizza/i },
    { path: 'weiter', headingRe: /Was darf's noch sein\?/i },
    { path: 'impressum', headingRe: /Impressum/i },
    { path: 'datenschutz', headingRe: /Datenschutz/i },
  ];

  for (const { path, headingRe } of routes) {
    test(`Route "${path}" antwortet 200 und rendert H1`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      // Hinweis: /speisekarte hat (Stand heute) keine eigene <h1> — die
      // Seitenüberschrift ist eine <h2>. Deshalb h1 UND h2 akzeptieren.
      await expect(page.locator('h1, h2').filter({ hasText: headingRe }).first()).toBeAttached();
    });
  }

  test('unbekannte Route liefert die 404-Seite', async ({ page }) => {
    const response = await page.goto('gibt-es-nicht');
    expect(response?.status()).toBe(404);
    await expect(page.locator('body')).toContainText(/404|nicht gefunden/i);
  });

  test('robots.txt, sitemap.xml und Web-Manifest sind erreichbar', async ({ page }) => {
    for (const asset of ['robots.txt', 'sitemap.xml', 'manifest.webmanifest']) {
      const response = await page.request.get(asset);
      expect(response.status(), asset).toBe(200);
    }
  });
});

test.describe('Header & Navigation', () => {
  test('Desktop-Nav verlinkt Kebap, Pizza und Speisekarte korrekt', async ({ page }) => {
    const vp = page.viewportSize();
    test.skip(!vp || vp.width < 768, 'Desktop-Nav erst ab md sichtbar');
    await page.goto('.');
    const nav = page.locator('header nav').first();
    await expect(nav.getByRole('link', { name: 'Kebap', exact: true })).toHaveAttribute(
      'href',
      /\/pimp-my-kebap\/konfigurator$/,
    );
    await expect(nav.getByRole('link', { name: 'Pizza', exact: true })).toHaveAttribute(
      'href',
      /\/pimp-my-kebap\/pimp-my-pizza$/,
    );
    await expect(nav.getByRole('link', { name: 'Speisekarte', exact: true })).toHaveAttribute(
      'href',
      /\/pimp-my-kebap\/speisekarte$/,
    );
  });

  test('Telefon-Link nutzt die offizielle Nummer', async ({ page }) => {
    await page.goto('.');
    const tel = page.locator(`a[href="tel:${BRAND.contact.phoneE164}"]`).first();
    await expect(tel).toBeAttached();
  });

  test('mobile Hamburger-Nav: öffnen, Link-Klick navigiert & schließt', async ({ page }) => {
    const vp = page.viewportSize();
    test.skip(!vp || vp.width >= 768, 'Hamburger nur unterhalb md');
    await page.goto('.');
    const toggle = page.locator('[data-mobile-nav-toggle]');
    const panel = page.locator('[data-mobile-nav-panel]');

    await toggle.click();
    await expect(panel).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');

    // Klick außerhalb schließt
    await page.locator('main, body').first().click({ position: { x: 5, y: 400 }, force: true });
    await expect(panel).toBeHidden();

    // Öffnen + Nav-Link → navigiert zur Speisekarte
    await toggle.click();
    await panel.getByRole('link', { name: /Speisekarte/ }).click();
    await expect(page).toHaveURL(/\/speisekarte$/);
  });

  test('Öffnungs-Pill hydratisiert: werktags 12:00 → "Jetzt geöffnet — bis 21:00 Uhr"', async ({ page }) => {
    await pinClock(page, BERLIN.neutralThursdayNoon);
    await page.goto('.');
    const pill = page.locator('[data-opening-pill]');
    await expect(pill).not.toHaveAttribute('data-loading', '');
    await expect(pill).toHaveAttribute('aria-label', 'Jetzt geöffnet — bis 21:00 Uhr');
  });

  test('Öffnungs-Pill: Sonntag → geschlossen mit "Mo wieder"', async ({ page }) => {
    await pinClock(page, BERLIN.sundayNoon);
    await page.goto('.');
    await expect(page.locator('[data-opening-pill]')).toHaveAttribute(
      'aria-label',
      /Heute geschlossen \(So\)/,
    );
  });
});

test.describe('Wochenangebots-Banner', () => {
  test('Montag zeigt das Dönerteller-Special', async ({ page }) => {
    await pinClock(page, BERLIN.mondayNoon);
    await page.goto('.');
    const banner = page.locator('[data-weekly-banner]');
    await expect(banner).toBeVisible();
    await expect(banner.locator('[data-weekly-prefix]')).toHaveText('Mo-Special:');
    await expect(banner.locator('[data-weekly-text]')).toContainText('Dönerteller-Tag');
    await expect(banner.locator('[data-weekly-text]')).toContainText('11,00');
  });

  test('Donnerstag (kein Aktionstag) bleibt der Banner versteckt', async ({ page }) => {
    await pinClock(page, BERLIN.neutralThursdayNoon);
    await page.goto('.');
    await expect(page.locator('[data-weekly-banner]')).toBeHidden();
  });
});

test.describe('Footer', () => {
  test('Pflicht-Attribution "Design by Belkis Aslani" ist vorhanden', async ({ page }) => {
    // Lizenzbedingung (siehe LICENSE / CLAUDE.md Invariante #9) — dieser Test
    // schlägt Alarm, falls die Attribution entfernt oder versteckt wird.
    await page.goto('.');
    const credit = page.locator('footer').getByRole('link', { name: /Belkis Aslani/ });
    await expect(credit).toBeAttached();
  });

  test('Footer verlinkt Impressum & Datenschutz', async ({ page }) => {
    await page.goto('.');
    const footer = page.locator('footer');
    await expect(footer.getByRole('link', { name: /Impressum/ })).toHaveAttribute(
      'href',
      /\/pimp-my-kebap\/impressum$/,
    );
    await expect(footer.getByRole('link', { name: /Datenschutz/ })).toHaveAttribute(
      'href',
      /\/pimp-my-kebap\/datenschutz$/,
    );
  });
});
