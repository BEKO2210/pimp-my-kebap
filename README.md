# Pimp My Kebap — Bestell-Website

> **Marktplatz 18 · 71691 Freiberg am Neckar**
> Statische Mobile-First-Site für Pimp My Kebap (Geschäftsname: Zentrum Pizza und Kebaphaus). Bestellungen laufen über **WhatsApp Click-to-Chat**. Kein Backend, keine Cookies, keine Tracker, DSGVO-konform.

## Tech-Stack

- **Astro 5** (statisches Output, Islands für interaktive Teile)
- **TypeScript strict**
- **Tailwind CSS v4** mit eigenen Design-Tokens
- **nanostores** für den Cart-State
- **Zod** für Validierung von `localStorage`-Inhalten
- **Vitest** Unit-Tests, **Playwright** E2E
- **Cloudflare Pages** _oder_ **GitHub Pages** Deployment (beides vorbereitet)

## Setup

```bash
# 1. Dependencies
npm install

# 2. Environment (kopiere die Vorlage und passe ggf. an)
cp .env.example .env

# 3. Dev-Server
npm run dev          # http://localhost:4321
```

### ENV-Variablen

| Variable | Pflicht | Beschreibung |
|---|---|---|
| `PUBLIC_RESTAURANT_WHATSAPP` | ja | WhatsApp-Nummer im E.164-Format **ohne** führendes `+` (z. B. `491742116095`) |
| `PUBLIC_SITE_URL` | empfohlen | Canonical-URL der Produktion (für Sitemap, OG, JSON-LD) |

Alle `PUBLIC_*`-Variablen werden in den Build eingebacken — sie sind explizit **öffentlich**, keine Secrets.

## Scripts

```bash
npm run dev            # Astro Dev-Server
npm run build          # Production-Build (preflight + image build + astro)
npm run preview        # Statisches Preview-Server (nach build)
npm test               # Unit-Tests (Vitest)
npm run test:coverage  # Unit-Tests mit Coverage-Report
npm run test:e2e       # Playwright (browsers werden separat installiert)
npm run lint           # ESLint
npm run typecheck      # astro check
npm run audit          # npm audit (high/critical fail)
```

## Architektur

```
src/
├── data/                # Single source of truth (menu, drinks, brand, delivery, allergens, ...)
├── lib/                 # Pure logic (pricing, whatsapp, time, holidays, validation, cart)
├── components/          # Astro components + colocated client TS
│   ├── Configurator/    # 3-Schritte-Wizard
│   ├── Cart/            # Drawer + sticky bottom bar
│   └── MenuSection/     # Generische Speisekarten-Sektion
├── layouts/Base.astro   # Globales Layout (CSP, JSON-LD, Fonts, SW-Boot)
├── pages/               # index, impressum, datenschutz, 404
└── styles/              # Tokens + global.css
```

### Datenfluss

1. `data/*.ts` definiert Brot, Soßen, Toppings, Speisen, Getränke, Liefergebühren.
2. `lib/pricing.ts` berechnet pro `KebabConfig` einen sauberen `KebabPriceBreakdown`.
3. `lib/whatsapp.ts` rendert Cart → menschenlesbarer Nachrichtentext + `wa.me`-URL.
4. `lib/cart.ts` (nanostores) hält Cart-State, persistiert nach `localStorage` (Zod-validiert, 24 h TTL).
5. Komponenten-Client-TS (`*.client.ts`) wired DOM-Events → Cart-Mutations.

## Skills Used

Per Spezifikation soll für jeden Aspekt ein Skill aktiv sein. Die folgenden Skill-Dokumente codifizieren die Konventionen — siehe `.skills/<name>/SKILL.md`. Jede Datei trägt im Header `// Powered by skill: <name>`.

| Skill | Pfad | Wofür |
|---|---|---|
| `frontend-design` | `.skills/frontend-design/SKILL.md` | Tokens, Komponenten, Tailwind-Patterns, visuelles Polishing |
| `security` | `.skills/security/SKILL.md` | CSP, SRI, Header, Input-Sanitization, OWASP |
| `accessibility` | `.skills/accessibility/SKILL.md` | WCAG 2.2 AA, Tastatur, ARIA, Focus-Management |
| `seo-local` | `.skills/seo-local/SKILL.md` | Meta, OG, JSON-LD `Restaurant`/`Menu`, Sitemap |
| `pwa` | `.skills/pwa/SKILL.md` | Manifest, Service Worker, Offline-Fallback |
| `image-optimization` | `.skills/image-optimization/SKILL.md` | AVIF/WebP-Pipeline, Logo + PWA-Icons + OG, SVG-Platzhalter |

> **Hinweis:** Die in der Spezifikation referenzierten Marketplace-Skills
> (`frontend-design`, `skill-creator`, …) standen in der Build-Umgebung nicht
> zur Verfügung. Per Spec-Fallback wurden sie als lokale `SKILL.md`-Dateien
> angelegt und in den entsprechenden Quelldateien referenziert.

## Sicherheit

Vollständige Beschreibung in [`SECURITY.md`](./SECURITY.md). Highlights:

- Strikte CSP (`script-src 'self'`, kein eval, kein inline JS außer JSON-LD)
- HSTS, X-Frame-Options=DENY, Permissions-Policy lockdown
- Notes-Input mit Whitelist + 280-Zeichen-Limit
- WhatsApp-Send Throttle (1× / 5 s)
- `localStorage` validiert per Zod-Schema mit Versionsschlüssel + 24 h TTL
- `scripts/preflight.mjs` prüft vor jedem Build, dass die Wohnanschrift der Inhaberin **nirgends** im Repo vorkommt

## Deploy

### GitHub Pages

Ist via `.github/workflows/deploy.yml` vorbereitet — bei einem Push auf `main`
wird `dist/` als Pages-Artefakt gepusht. In den Repository-Settings unter
*Pages → Source* `GitHub Actions` auswählen. Custom Domain in `astro.config.mjs`
und `PUBLIC_SITE_URL` setzen.

### Cloudflare Pages

`wrangler.toml` ist vorbereitet. In Cloudflare Pages ein neues Projekt anlegen,
auf das Repo verweisen, Build-Befehl `npm run build`, Output-Verzeichnis `dist`.
Im Workflow den Cloudflare-Step einkommentieren und Secrets ergänzen
(`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`).

Die Datei `public/_headers` enthält die Security-Header — Cloudflare Pages
liest sie automatisch.

## Tests

```bash
npm test                 # 76+ Unit-Tests (pricing, whatsapp, time, holidays, validation, format)
npm run test:e2e         # Playwright Mobile-Viewports (iPhone 13, Pixel 7) + Desktop
```

Coverage-Schwelle: **≥ 85 %** für `src/lib/`. CI bricht bei Verletzung ab.

## Aktualisierungspfade

- **Speisekarte ändern** → `src/data/menu.ts`, neue Items oder Preise; Tests in
  `tests/unit/pricing.test.ts` ggf. ergänzen.
- **Aktionspreise (Mo/Di/Mi/Sa)** → `promoPriceMap` der Items in `menu.ts`.
- **Liefergebühren / Zonen** → `src/data/delivery.ts`.
- **Öffnungszeiten / Feiertagsregel** → `src/data/brand.ts` und
  `src/lib/holidays.ts` (Anonymous-Gregorian-Easter ist hartcodiert).
- **WhatsApp-Nummer** → `.env` bzw. Build-ENV.

## Übergabe an Belkis

Siehe [`TODO_OWNER.md`](./TODO_OWNER.md).

## Lizenz / Hinweise

- Code: MIT (Inhaber kann nach Bedarf wechseln)
- Logo: © Pimp My Kebap / Inhaberin Fatma Tasocak-Savci. Alle Rechte vorbehalten.
- Schriften: Inter und Playfair Display, jeweils SIL OFL 1.1 (selbst-gehostet).
