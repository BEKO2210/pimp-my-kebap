# Skill: pwa

> Local skill stub. Progressive Web App configuration.

## Manifest (`public/manifest.webmanifest`)

```json
{
  "name": "Pimp My Kebap",
  "short_name": "Pimp My Kebap",
  "description": "Döner konfigurieren & per WhatsApp bestellen.",
  "start_url": "/?source=pwa",
  "display": "standalone",
  "background_color": "#0a0a0a",
  "theme_color": "#0a0a0a",
  "lang": "de-DE",
  "icons": [
    { "src": "/icons/logo-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/logo-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/logo-maskable-192.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable" },
    { "src": "/icons/logo-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

## Service worker (`public/sw.js`)

- Cache-first for static assets (`/assets/`, `/fonts/`, `/images/`, `/icons/`).
- Network-first for HTML.
- Offline fallback page `/offline.html` (address + WhatsApp link).
- Versioned cache: bump `CACHE_VERSION` per release.

## A2HS prompt

After 30s of engagement, once per session. Stores dismiss in `sessionStorage`.

## File-header convention

```ts
// Powered by skill: pwa
```
