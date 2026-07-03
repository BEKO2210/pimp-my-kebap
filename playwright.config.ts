// Powered by skill: accessibility
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    // The build deploys under a project-pages sub-path; preview server mirrors that.
    // Trailing slash is load-bearing: tests navigate with RELATIVE paths
    // ("konfigurator"), because absolute ones ("/konfigurator") would resolve
    // against the host root and drop the /pimp-my-kebap base.
    baseURL: 'http://localhost:4321/pimp-my-kebap/',
    trace: 'retain-on-failure',
    // Kundschaft & Geschäftslogik (Öffnungszeiten, Schulzeit, Aktionstage)
    // leben in Europe/Berlin — Tests auch.
    timezoneId: 'Europe/Berlin',
    locale: 'de-DE',
    // Hinweis: prefers-reduced-motion wird NICHT hier gesetzt — Playwright
    // 1.61 kennt die use.reducedMotion-Option nicht mehr. Stattdessen
    // erzwingt tests/e2e/fixtures.ts page.emulateMedia({ reducedMotion })
    // pro Page (deaktiviert die Cross-Document View Transitions, deren
    // Overlay im Headless-Browser sonst alle Klicks blockiert).
  },
  projects: [
    {
      name: 'mobile-iphone-13',
      use: { ...devices['iPhone 13'] },
    },
    {
      name: 'mobile-pixel-7',
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run preview',
    // Root liefert 404 (Site liegt unter dem base-Pfad) — Playwright wertet
    // 404 nicht als "ready", deshalb muss die Probe auf den base-Pfad zeigen.
    url: 'http://localhost:4321/pimp-my-kebap',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
