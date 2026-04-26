# CLAUDE.md — Projekt-Brief für KI-Sessions

> Kompakter Einstieg, damit kommende Sessions ohne Re-Reading der gesamten Codebase
> arbeiten können. Architektur-Diagramme: [`docs/`](./docs/). Setup &amp; Scripts: [`README.md`](./README.md).

## Was ist das?

Statische Astro-Site für **Pimp My Kebap** (Marktplatz 18, Freiberg am Neckar).
Bestellung läuft komplett über **WhatsApp Click-to-Chat** — kein Backend, keine API,
keine DB, keine Cookies, keine Tracker. DSGVO-konform.

Hosting: **GitHub Pages** (`beko2210.github.io/pimp-my-kebap`).
Cloudflare-Pages-Setup ist via `wrangler.toml` ebenfalls vorbereitet.

## Stack (Stand 2026-04-26)

- **Astro 6.1.9** (static, Islands-Hydration) · **TypeScript strict**
- **Tailwind v4** (`@tailwindcss/vite`) · eigene Tokens in `src/styles/tokens.css`
- **nanostores** (Cart) · **Zod** (localStorage-Validation)
- **Vitest** Unit · **Playwright** E2E (lokal, nicht in CI)
- **sharp** für Build-Image-Pipeline (AVIF/WebP/PWA-Icons)
- **Vite 7.3.2 (gepinnt)** via `"overrides"` in `package.json` — siehe Gotcha #10

## Architektur-Konventionen (wichtig!)

| Schicht | Pfad | Regel |
|---|---|---|
| **Data** | `src/data/*.ts` | Single Source of Truth — alles Käuferische (Preise, Items, Zonen) lebt hier. |
| **Logic** | `src/lib/*.ts` | Reine Funktionen, framework-frei, vollständig unit-testbar. Kein DOM. |
| **Components** | `src/components/**/*.astro` | Server-Render. Hydration-Logik sitzt **nur** in `*.client.ts` daneben. |
| **Pages** | `src/pages/*.astro` | Routes-only, keine Business-Logik. |
| **Styles** | `src/styles/{tokens,global}.css` | Tokens via `@theme`-Block für Tailwind v4. |

**Stilregeln** (alle bestehenden Files folgen dem):
- Kommentare auf Deutsch (Inhaltsdomäne ist deutsch).
- Datei-Header `// Powered by skill: <name>` ist legacy aus `.skills/`-Phase — bleibt drin, neue Files **müssen** ihn nicht setzen.
- Keine Multi-Paragraph-Doc-Strings. Inline-Comments nur, wenn das **Warum** nicht offensichtlich ist.

## Datenfluss (Bestellung)

```
data/menu.ts | data/configurator.ts
   → UI (Configurator / Speisekarte)
   → lib/pricing.ts (KebabConfig → Breakdown)
   → nanostores $cart  ⇄  localStorage (Zod, key=pmk-cart-v1, TTL 24h)
   → lib/whatsapp.ts (Cart → Text + wa.me URL)
   → window.location = wa.me/...
```

## Kritische Invarianten / Gotchas

1. **`define:vars` weiter vermeiden.** GHSA-jh87-52p2-xcff (XSS in Astro &lt;6.1.6) ist mit
   dem Bump auf 6.1.9 gefixt; die Direktive verwischt aber generell Server-/Client-Scope
   und ist nirgendwo im Code im Einsatz — soll auch so bleiben.
2. **`siteUrl` enthält bereits `base`-Pfad.** OG-Image-URLs **nie** zusätzlich durch `withBase()`
   schicken. Siehe Fix in `Base.astro` (CLAUDE-History-Schritt 11).
3. **GitHub Pages ignoriert `public/_headers`.** Production-CSP läuft nur über
   `<meta http-equiv="Content-Security-Policy">` in `Base.astro`. Meta-CSP kann **kein**
   `frame-ancestors` setzen — Click-Jacking-Schutz erst bei Wechsel zu CF/Netlify.
4. **Service-Worker-Cache-Bust**: `scripts/version-stamp.mjs` (postbuild) hängt `?v=<git-sha>`
   an lokale CSS/JS und schreibt `<meta name="app-version">` ein. Dadurch invalidiert der
   SW alte Caches automatisch. Niemals manuell SW-Cache-Namen anfassen.
5. **Preflight blockt Build**, wenn die Wohnanschrift der Inhaberin im Repo auftaucht
   (`scripts/preflight.mjs`). Plus: Logo muss vorhanden sein.
6. **WhatsApp-URL-Limit**: 6500 Zeichen (encoded). Über dem Limit zeigt der Checkout einen
   Hinweis-Block + Telefon-Fallback statt der WA-Vorschau.
7. **Schüler-Items**: Stepper nur **werktags ≤ 16:00**. Filter via `isSchoolDay()` und
   `isSchoolHoursWindow()` in `src/lib/time.ts`.
8. **Konfigurator-Flow**: nach `Add` Redirect auf `/weiter?added=<kebap|pizza>` —
   **kein** automatisches Cart-Drawer-Auf-Pop (User soll weiter kombinieren können).
9. **Credit &amp; Lizenz**: Footer trägt einen dezenten "Design by Belkis Aslani"-Link
   (`src/components/Footer.astro`, unter dem Copyright). Lizenz ist proprietär
   (siehe [`LICENSE`](./LICENSE)) — Code-Eigentum: Belkis Aslani; Inhalte (Marke,
   Menü, Fotos): Inhaberin. **Diese Attribution darf nicht entfernt oder versteckt
   werden** — explizit Bestandteil der Lizenzbedingungen.
10. **`overrides: { "vite": "7.3.2" }`** in `package.json` ist Pflicht. Vitest 4.x zieht
    sonst Vite 8.x als Top-Level-Hoist, und `@tailwindcss/vite 4.2.4` bricht dann gegen
    Vite-8's Rolldown-Resolver (`Missing field tsconfigPaths`-Error im Build). Wenn
    Vitest / Tailwind alle Vite-8-kompatibel werden, kann der Override raus.

## Quality-Gates (vor jedem Commit)

```bash
npm run typecheck && npm run lint && npm test && npm run build
```

CI macht genau das (`.github/workflows/ci.yml`). E2E (`npm run test:e2e`) läuft nur lokal.

## Branch- &amp; Workflow-Policy

- **Niemals direkt auf `main` committen.** Feature-Branches prefix `claude/<descriptor>` oder `feat/...`.
- **Nie hooks skippen** (kein `--no-verify`, kein `--no-gpg-sign`).
- Vor Push immer alle Quality-Gates lokal grün haben.
- Commit-Messages auf Deutsch oder Englisch, beides OK; Konvention: `<scope>(<area>): <imperativ>`.

## Häufige Aufgaben (Quick-Start)

| Aufgabe | Files |
|---|---|
| Neuer Menüpunkt | `src/data/menu.ts` (+ ggf. `tests/unit/pricing.test.ts`) |
| Aktionspreis | `promoPriceMap` des Items in `menu.ts` |
| Neues Topping | `src/data/ingredients.ts` (+ `pricing.ts`-Test) |
| Liefergebühr / Zone | `src/data/delivery.ts` |
| Öffnungszeit | `src/data/brand.ts` |
| Feiertag | `src/lib/holidays.ts` (Anonymous-Gregorian-Easter ist berechnet, nicht hartcodiert) |
| Logo tauschen | `public/brand/logo.png` (Source) → `npm run build:images` baut alle Varianten |
| Real-Foto für ein Item | `public/images/meals/<item-id>.jpg` (id aus `menu.ts`); AVIF/WebP werden gebaut |

## Bekannte offene Punkte

Siehe [`TODO_OWNER.md`](./TODO_OWNER.md) — Inhaberin-Aufgaben (1-Klick-GH-Pages-Setup,
WhatsApp-Test-Bestellung, optional Domain).
