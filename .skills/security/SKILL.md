# Skill: security

> Local skill stub. Hardening rules for the static Pimp My Kebap site.

## HTTP headers (Cloudflare `_headers` and Astro `<meta>` fallback)

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://tile.openstreetmap.org; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; form-action 'self'; base-uri 'self'; object-src 'none'; upgrade-insecure-requests
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=(), usb=(), accelerometer=(), gyroscope=()
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Resource-Policy: same-origin
```

## Code rules (enforced by ESLint where possible)

- Never `eval`, `new Function`, `innerHTML`. Use `textContent` / `setAttribute`.
- No inline `<script>` with logic; only `application/ld+json` blocks allowed.
- No third-party scripts, fonts, images, trackers, analytics, pixels.
- All `localStorage` reads pass through Zod schema validation.
- Notes input: max 280 chars, whitelist `[a-zA-Z0-9äöüÄÖÜß ,.!?:\-+\n]`.
- WhatsApp send throttle: 1 request / 5 seconds.
- `npm audit --omit=dev`: 0 vulnerabilities (CI gates deploy).
- `.env` never committed; `PUBLIC_*` env vars are explicitly public.

## Privacy

- No cookies (technically not necessary).
- No tracking, GA, Plausible, Pixel, Facebook SDK.
- Map: static OSM tile via `<img>` (CSP-allowed). No Leaflet, no iframe.
- Data routed via `wa.me` → Meta TOS apply at handover (disclosed in Datenschutz).
- Owner home address must NEVER appear in repo. Preflight script greps for it.

## File-header convention

```ts
// Powered by skill: security
```
