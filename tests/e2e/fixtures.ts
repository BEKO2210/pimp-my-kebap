// Gemeinsame Test-Fixture für alle E2E-Specs.
//
// Warum nicht einfach `use: { reducedMotion: 'reduce' }` in der Config?
// Playwright 1.61 wendet die Option aus der Test-Config nicht auf den
// Browser-Context an (matchMedia('(prefers-reduced-motion: reduce)') bleibt
// false; als direkte newContext()-Option funktioniert sie). Ohne reduzierte
// Bewegung startet aber nach jeder Navigation die Cross-Document View
// Transition aus global.css — und deren Overlay wird im Headless-Chromium
// nie abgebaut, wodurch jeder weitere Klick am Stability-Check hängt.
// Deshalb erzwingt diese Fixture die Emulation pro Page.
//
// Alle Specs importieren `test`/`expect` von hier statt von '@playwright/test'.

import { test as base } from '@playwright/test';

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await use(page);
  },
});

export { expect } from '@playwright/test';
