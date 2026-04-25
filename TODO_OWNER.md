# TODO für die Übergabe an die Inhaberin

## Pflicht vor Live-Schaltung

- [ ] **Echte Schriftarten** in `public/fonts/` ablegen (siehe `public/fonts/README.md`):
  - `inter-variable.woff2` (SIL OFL 1.1)
  - `playfair-display-variable.woff2` (SIL OFL 1.1)
  → kostenlos von [fonts.google.com](https://fonts.google.com).
- [ ] **`.env` setzen** mit:
  ```
  PUBLIC_RESTAURANT_WHATSAPP=491742116095
  PUBLIC_SITE_URL=https://<eure-domain>
  ```
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

## Geo-Koordinaten (optional, schärfer)

- [ ] Exakte Lat/Long von Marktplatz 18 ausmessen, dann in
  `src/data/brand.ts → geo` eintragen. Aktuelle Werte sind eine Näherung.

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
