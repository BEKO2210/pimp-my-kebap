// Gemeinsame E2E-Utilities: Preis-Formatierung, Dialog-/window.open-Capture,
// Zeit-Pinning (Berlin) und Warenkorb-Navigation.
//
// Wichtig: Die Seite liegt unter dem GitHub-Pages-Base-Pfad /pimp-my-kebap.
// Die baseURL in playwright.config.ts endet deshalb mit "/" — alle goto()-
// Aufrufe nutzen RELATIVE Pfade ohne führenden Slash ("konfigurator", ".").

import type { Page } from '@playwright/test';

/* ── Geld ── */

/** "12,50 €" mit normalem Leerzeichen — zum Vergleich gegen norm()-Text. */
export function money(n: number): string {
  return n.toFixed(2).replace('.', ',') + ' €';
}

/** Regex, die "12,50 €" mit beliebigem Whitespace (NBSP etc.) matcht. */
export function moneyRe(n: number): RegExp {
  return new RegExp(n.toFixed(2).replace('.', ',') + '\\s*€');
}

/** Ersetzt NBSP/Narrow-NBSP durch normale Leerzeichen (Intl-Ausgaben). */
export function norm(s: string): string {
  return s.replace(/[\u00a0\u202f]/g, " ");
}

/* ── Fixe Testzeitpunkte (Europe/Berlin, Juli 2026 = CEST/+02:00) ── */

export const BERLIN = {
  /** Do 12:00 — neutraler Werktag: kein Aktionstag, Schulzeit offen, Laden offen. */
  neutralThursdayNoon: new Date('2026-07-09T12:00:00+02:00'),
  /** Do 17:30 — Werktag nach Schulschluss (>16:00), Laden offen. */
  neutralThursdayEvening: new Date('2026-07-09T17:30:00+02:00'),
  /** Mo 12:00 — Dönerteller-Aktionstag (11 € statt 13 €). */
  mondayNoon: new Date('2026-07-06T12:00:00+02:00'),
  /** Di 12:00 — Pide-Tag (alle Pide 9 €). */
  tuesdayNoon: new Date('2026-07-07T12:00:00+02:00'),
  /** Mi 12:00 — Pizza-Tag (alle Pizzen 9 €). */
  wednesdayNoon: new Date('2026-07-08T12:00:00+02:00'),
  /** Sa 12:00 — kein Schultag, Seelen-Tag-Banner. */
  saturdayNoon: new Date('2026-07-11T12:00:00+02:00'),
  /** So 12:00 — Ruhetag, Laden komplett zu. */
  sundayNoon: new Date('2026-07-12T12:00:00+02:00'),
  /** Do 22:00 — nach Ladenschluss (21:00). */
  thursdayLate: new Date('2026-07-09T22:00:00+02:00'),
};

/**
 * Friert die Browser-Uhr auf einen festen Zeitpunkt ein. MUSS vor dem ersten
 * goto() laufen, damit Client-Hydration (Promo-Preise, Schulzeit, Öffnungs-
 * Pill, Abholzeit-Slots) deterministisch rechnet.
 */
export async function pinClock(page: Page, time: Date): Promise<void> {
  // setFixedTime (statt install): Date.now()/new Date() liefern konstant den
  // Fixzeitpunkt, echte Timer laufen aber weiter. Das hält Assertions wie die
  // 5-Sekunden-Sende-Drossel deterministisch.
  await page.clock.setFixedTime(time);
}

/* ── Browser-Dialoge & window.open ── */

/**
 * Akzeptiert alle confirm()/alert()-Dialoge und sammelt ihre Messages.
 * (Playwright dismisst Dialoge sonst automatisch — der Checkout-Flow nutzt
 * confirm() für die Bestell-Vorschau.)
 */
export function acceptDialogs(page: Page): string[] {
  const messages: string[] = [];
  page.on('dialog', (dialog) => {
    messages.push(dialog.message());
    void dialog.accept();
  });
  return messages;
}

/** Lehnt alle Dialoge ab (Abbrechen) und sammelt ihre Messages. */
export function dismissDialogs(page: Page): string[] {
  const messages: string[] = [];
  page.on('dialog', (dialog) => {
    messages.push(dialog.message());
    void dialog.dismiss();
  });
  return messages;
}

/**
 * Ersetzt window.open durch einen Recorder, damit der WhatsApp-Deeplink
 * nicht wirklich öffnet, sondern abgefangen und geprüft werden kann.
 * Vor goto() aufrufen.
 */
export async function stubWindowOpen(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const w = window as unknown as { __openedUrls: string[] };
    w.__openedUrls = [];
    window.open = ((url?: string | URL) => {
      w.__openedUrls.push(String(url));
      return null;
    }) as typeof window.open;
  });
}

export function openedUrls(page: Page): Promise<string[]> {
  return page.evaluate(() => (window as unknown as { __openedUrls?: string[] }).__openedUrls ?? []);
}

/**
 * Ersetzt navigator.clipboard durch einen Recorder (funktioniert in allen
 * Engines ohne Permission-Grants). Vor goto() aufrufen.
 */
export async function stubClipboard(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const store = { text: '' };
    (window as unknown as { __clipboard: { text: string } }).__clipboard = store;
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: (t: string) => {
          store.text = t;
          return Promise.resolve();
        },
      },
      configurable: true,
    });
  });
}

export function clipboardText(page: Page): Promise<string> {
  return page.evaluate(
    () => (window as unknown as { __clipboard?: { text: string } }).__clipboard?.text ?? '',
  );
}

/* ── Navigation / Warenkorb ── */

/**
 * Öffnet den Cart-Drawer über /weiter → "Bestellung abschließen".
 * Das ist der einzige Weg, der auf JEDEM Viewport funktioniert (die Sticky-
 * Cart-Bar ist lg:hidden — Desktop hat keinen eigenen Öffnen-Button).
 * Navigiert auf /weiter, der Warenkorb selbst bleibt erhalten (localStorage).
 */
export async function openCartViaWeiter(page: Page): Promise<void> {
  await page.goto('weiter');
  await page.locator('[data-weiter-checkout]').click();
  await page.locator('#cart-drawer').waitFor({ state: 'visible' });
}

/** Öffnet eine Speisekarten-Sektion (Accordion) über die Quick-Jump-Nav. */
export async function openMenuSection(page: Page, category: string): Promise<void> {
  await page.locator(`[data-cat-jump="${category}"]`).click();
  await page
    .locator(`#section-${category} details[data-menu-accordion]`)
    .evaluate((el) => (el as HTMLDetailsElement).open);
}

/** Extrahiert und dekodiert die wa.me-URL: Nummer + Klartext-Nachricht. */
export function decodeWhatsAppUrl(url: string): { number: string; text: string } {
  const m = /^https:\/\/wa\.me\/(\d+)\?text=(.*)$/.exec(url);
  if (!m) throw new Error(`Keine wa.me-URL: ${url}`);
  return { number: m[1]!, text: norm(decodeURIComponent(m[2]!)) };
}

/** Trennlinie aus src/lib/whatsapp.ts — für den zeichengenauen Message-Vergleich. */
export const WA_SEPARATOR = '─────────────────────────────────';
