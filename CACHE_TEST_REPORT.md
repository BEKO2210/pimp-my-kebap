# CACHE_TEST_REPORT

## Scope
Technischer Verifikationslauf für Cache-Invalidierung auf Basis von Build-Artefakten und SW-Logik.

## Ergebnisübersicht
1. Build erzeugt `dist/version.json` mit `version`, `builtAt`, `menuHash`, `assetsHash`.
2. Build patched alle HTML-Dateien in `dist/` mit:
   - `<meta name="app-version" ...>`
   - `<meta http-equiv="Cache-Control" content="no-cache">`
   - `?v=<git-sha>` für lokale CSS-/JS-Asset-URLs.
3. `dist/sw.js` erhält zur Build-Zeit die aktuelle Version (`pmk-<sha>`) und pollt `version.json` alle 60 Sekunden (`cache: no-store`).
4. Bei Versionsänderung sendet der SW `PMK_UPDATE_AVAILABLE`; Client zeigt Hinweis und erlaubt Reload.

## Hinweis zur Live-E2E-Abnahme
Ein echter Browser-Cache-Test über mehrere reale Clients (iOS Safari/Android Chrome/Firefox Desktop) muss nach Deploy gegen GitHub Pages erfolgen. Dieser Report dokumentiert den lokal reproduzierbaren technischen Unterbau, nicht die externe Feldmessung.
