# TODO für die Übergabe an die Inhaberin

## ⚡ Einmaliges GitHub-Setup (genau **1** Klick)

Damit die Site automatisch deployed wird, einmalig in GitHub:

1. Repo öffnen: https://github.com/BEKO2210/pimp-my-kebap
2. **Settings → Pages**
3. Unter **Build and deployment → Source** auf **„GitHub Actions"** stellen
4. Speichern. Fertig.

Nach diesem Setup wird die Site bei jedem Push (oder per **Actions → Deploy →
Run workflow**) auf `https://beko2210.github.io/pimp-my-kebap/` veröffentlicht.

> Falls eine eigene Domain gewünscht ist (z. B. `pimp-my-kebap.de`):
> einfach in `.github/workflows/deploy.yml` und `.github/workflows/ci.yml`
> `PUBLIC_SITE_URL` auf die neue Domain ändern und CNAME in `public/CNAME` ablegen.

## Vor Live-Schaltung (sonstiges)

- [x] ~~Echte Schriftarten in `public/fonts/`~~ — bereits eingecheckt
  (Inter + Playfair Display variable WOFF2, beide SIL OFL 1.1).
- [x] ~~`.env` setzen~~ — bereits enthalten und in den GitHub-Actions-Workflows hardcoded.
- [ ] **WhatsApp-Test-Bestellung** ausführen: 1 Item zum Cart hinzufügen, „Per
  WhatsApp senden" klicken, prüfen ob Nachricht in der WhatsApp-App vom
  Restaurant ankommt.

## Bilder (nice-to-have, jeweils niedrige Auflösung 800×600 reicht)

- [ ] Echte Fotos der 21 Pizza-Sorten (gleicher Look, von oben fotografiert)
- [ ] Echte Fotos der Pide- und Seele-Sorten
- [ ] Echte Fotos der Drehspieße (am Spieß + auf Teller)
- [ ] Hero-Foto: Drehspieß mit Feuer, oder Top-Konfigurator-Beispiel
- [ ] Foto der echten Salatbar (für die „18 frische Zutaten"-Sektion)
- [ ] Innenraum-Foto (für Standort-Sektion)

→ Ablegen unter `public/images/meals/<slug>.jpg`. Der Bildname muss der
`item.id` aus `src/data/menu.ts` entsprechen (z. B. `pizza-margherita.jpg`).
AVIF/WebP-Varianten werden im Build automatisch erzeugt — falls nicht, swap die
Datei und der Browser fällt automatisch auf das JPG zurück. Ohne Foto wird
unser Marken-SVG-Platzhalter angezeigt, also nichts kaputt.

## Domain

- [ ] Wunschdomain registrieren (Empfehlung: `pimp-my-kebap.de`)
- [ ] DNS auf Cloudflare Pages oder GitHub Pages umleiten
- [ ] In `.env` `PUBLIC_SITE_URL` aktualisieren

## Geo-Koordinaten

- [x] Exakte Lat/Long von Marktplatz 18 sind in `src/data/brand.ts → geo`
  eingetragen (verifiziert 2026-04-26 via Google Maps).

## Optional / Marketing

- [ ] Google Business Profile-URL in `src/data/brand.ts → social.googleBusinessProfile` setzen
- [ ] Facebook-URL in `social.facebook` setzen, falls vorhanden
- [ ] Steuernummer im Impressum freischalten (siehe Kommentar in `src/pages/impressum.astro`) — empfohlen erst nach Rücksprache mit Steuerberater

## Bei Preisänderungen

`src/data/menu.ts` öffnen, Preis ändern, committen — fertig. Aktionspreise
liegen je Item im `promoPriceMap` (`{ 1: 11.0, ... }` mit ISO-Wochentag).
Liefergebühren in `src/data/delivery.ts`. Öffnungszeiten in `src/data/brand.ts`.

## Bei neuen Speisen

Neuen Eintrag in `src/data/menu.ts` ergänzen mit `id` (eindeutig), `category`,
`name`, `priceEur`, optional `description`, `markings`, `tag`,
`promoPriceMap`. Tests laufen automatisch in der CI durch.
