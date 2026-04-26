# AUDIT_REPORT

## 1. Architektur-Map
- **Routing / Seiten (Astro):** `src/pages/index.astro`, `src/pages/konfigurator/index.astro`, `src/pages/pimp-my-pizza/index.astro`, `src/pages/speisekarte/index.astro`, `src/pages/impressum.astro`, `src/pages/datenschutz.astro`, `src/pages/404.astro`, `src/pages/weiter/index.astro`.
- **Layout + SEO/PWA-Basics:** Globales Layout und Meta-Handling in `src/layouts/Base.astro`.
- **Client-Logik:** Bootstrapping via `src/lib/boot.ts`.
- **Hosting/Build:** Astro static build in `astro.config.mjs`, CI/Deploy in `.github/workflows/*.yml`.

## 2. Datenquellen (Single Source of Truth?)
- **Speisekarte/Preise:** `src/data/menu.ts`.
- **Konfigurator-Preise und Preisbestandteile:** `src/data/configurator.ts`, `src/data/sauces.ts`, `src/data/ingredients.ts`, `src/lib/pricing.ts`.
- **Getränke/Pfand:** `src/data/drinks.ts`.
- **Lieferzonen/Gebühren/Mindestwerte:** `src/data/delivery.ts`.
- **Marken-/Filialdaten/Öffnungszeiten:** `src/data/brand.ts` + zeitliche Logik in `src/lib/time.ts` und `src/lib/holidays.ts`.
- **Allergene/Zusatzstoffe:** `src/data/allergens.ts`.

## 3. Bekannte Risiken / Bugs / Inkonsistenzen
- **Vorheriger Zustand:** Service Worker hatte statischen Cache-Namen (`pmk-v1`) ohne Build-Versionkopplung → Risiko alter Assets nach Deploy.
- **Vorheriger Zustand:** Kein Build-Schritt, der `version.json` erzeugt und Seiten/Assets explizit versioniert.
- **Risiko bei Datenmodell-Änderung:** Kein globaler Schema-Migrationsschritt beim Laden.

## 4. Workflow-Brüche
- CI hatte bereits Lint/Typecheck/Unit/Build, aber keinen E2E/Lighthouse/Pa11y-Gate.
- Deployment war funktionsfähig, aber ohne explizite Versionierungs-Artefakte für harte Cache-Invalidierung.

## 5. A11y-Befunde
- `lang="de"` ist im Layout gesetzt.
- Skip-Link ist vorhanden.
- Weitere A11y-Prüfung (Journey-basiert + Pa11y) als SOLL/KANN im nächsten Schritt, da Fokus dieses Changes auf Cache-Härtung lag.

## 6. Performance-Befunde
- Statische Astro-Ausgabe + optimierte Bildpipeline vorhanden.
- SW-Strategie wurde für HTML auf network-first mit Timeout umgestellt (für Aktualität statt aggressiver Offline-Stale-Nutzung).

## 7. SEO / Meta / Structured-Data Befunde
- Canonical, OG/Twitter, JSON-LD-Einspeisung sind bereits in Base/Layout implementiert.
- Sitemap/robots sind als Astro endpoints vorhanden (`src/pages/sitemap.xml.ts`, `src/pages/robots.txt.ts`).

## 8. Security / Privacy Befunde
- CSP über Meta vorhanden.
- WhatsApp-Linking und LocalStorage-only Datenhaltung sind vorhanden.
- Kein offensichtlicher Analytics-/Pixel-Code in den geprüften Kernpfaden.

## 9. Cache-Verhalten (Ist-Zustand)
- **Nach Fix:** Build erzeugt `dist/version.json`, patched HTML mit `app-version` Meta + `Cache-Control: no-cache` Meta und hängt `?v=<sha>` an lokale CSS/JS-Referenzen.
- **Nach Fix:** SW nutzt `pmk-<version>` Cache, löscht alte `pmk-*` Caches bei Aktivierung und pollt `version.json` alle 60 s.
- **Nach Fix:** Client zeigt Update-Hinweis und bietet Reload an.

## 10. Empfehlungen (MUSS / SOLL / KANN)
### MUSS
1. Preis-/Journey-Regressionen W1–W15 als automatisierte E2E-Suite vollständig nachziehen.
2. CI um Playwright + Lighthouse + Pa11y als Blocking Checks erweitern.

### SOLL
1. `OPERATIONS.md` mit klaren Nicht-Techniker-Workflows (Preis, Öffnungszeiten, Lieferzone, Bildtausch) ergänzen.
2. `MISSING_ASSETS.md` im Kundentermin pflegen und gegen finalen Asset-Stand abgleichen.

### KANN
1. Zusätzliche Sichtprüfung auf iOS Safari für SW-Update-UX nach Live-Deploy.
2. CSP von Meta zu HTTP Header-only vereinheitlichen (nach Hosting-Freeze).
