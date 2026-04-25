# Debugging-Plan, Funktionstest & Logik-Audit

> Stand: 2026-04-25 · Branch `claude/fix-hamburger-menu-hVO2d`
> Ziel: 1000 % funktional. Zutaten hinzufügen / entfernen, Preise stimmen, Cart persistiert, WhatsApp-Order geht raus.

---

## 1. Logik-Audit (statisch verifiziert)

| Bereich | Befund | Status |
|---|---|---|
| `priceKebab` charged baseIncluded toppings (kraut/zwiebeln/tomaten) | **Bug B1 — gefixt** in `src/lib/pricing.ts`. Test in `tests/unit/pricing.test.ts`. | OK |
| `describeKebab` zählte baseIncluded ins "(N× +0,50 €)" | **Bug B2 — gefixt** in `src/lib/whatsapp.ts`. | OK |
| Sauce-Pricing (FREE_SAUCE_COUNT=2) | `Math.max(0, len - 2) * 0,50` — korrekt für 0/1/2/3+ Saucen. | OK |
| Steak-Aufpreis | nur via `MEATS.upchargeEur` (1,00 €), kein doppeltes Flag mehr. | OK |
| Extra Fleisch +50 g | clamp 0..3, je 1,50 €, unabhängig von Fleischsorte. | OK |
| Pizza-Pricing | Boden 8,00 € + standard Topping 1,00 € + premium 1,50 €. Stimmt mit `PIZZA_TOPPINGS`. | OK |
| Cart-Stepper Menu-Items | `+`: addLine oder +1 quantity; `−`: −1 oder removeLine bei qty=1. | OK |
| Cart-Persistenz | localStorage `pmk-cart-v1`, Zod-validiert, 24 h TTL, version=1. | OK |
| ShareCart | base64 im URL-Hash, kein Server, kein Referer-Leak. Hash wird nach Hydration via `history.replaceState` entfernt. | OK |
| Reorder aus History | Spread + neue IDs; verzweigt nicht in den alten Cart. | OK |
| Lieferung Mindestbestellwert | 20 €; `belowDeliveryMinimum` blockt Checkout-Button. | OK |
| Pickup-Zeiten | ASAP + 15-Min-Schritte ab `now+20m` bis 21:00. | OK |
| WhatsApp-Throttle | 1 Send / 5 s. | OK |
| ASAP wenn Restaurant zu | Sendet trotzdem; manueller Telefon-/WhatsApp-Reply nötig. **Bekanntes UX-Verhalten, kein Bug.** | i |

### Bekannte Limits (kein Bug)
- Sticky Cart-Bar (mobile, z-40) kann Sticky-Configurator-Summary (z-10) überlappen, sobald Cart Items enthält. Fixwürdig nur wenn UX leidet.
- ASAP-Order außerhalb Öffnungszeiten: Restaurant antwortet manuell.
- Service Worker registriert nur über HTTPS — lokal in Dev nicht aktiv.

---

## 2. Hamburger-Menü — Funktionsanforderungen

| # | Anforderung | Implementiert in |
|---|---|---|
| H1 | Burger toggelt Panel auf/zu | `Header.astro:131-137`, click-handler |
| H2 | Icon wechselt menu↔close | `data-icon-menu` / `data-icon-close` |
| H3 | `aria-expanded` toggelt | `setOpen()` |
| H4 | `aria-label` "Menü öffnen/schließen" toggelt | `setOpen()` |
| H5 | ESC schließt + Fokus zurück auf Toggle | `keydown` listener |
| H6 | Klick außerhalb schließt | `document` click listener |
| H7 | Body-Scroll-Lock während offen | `body.mobile-nav-open` in `global.css` |
| H8 | Auto-Schließen bei Resize ≥md | `matchMedia('(min-width: 768px)')` listener |
| H9 | Klick auf Link schließt vor Navigation | je `<a>` im Panel |
| H10 | Panel ist `<nav>` mit `aria-label` | `id="mobile-nav-panel"` |

---

## 3. Funktionstest-Skript (manuell, in der Reihenfolge)

### Setup
1. `npm ci && PUBLIC_RESTAURANT_WHATSAPP=491701234567 npm run dev`
2. Browser auf `http://localhost:4321`, DevTools Mobile-Emulation 375×812.

### T1 — Hamburger-Menü
| Schritt | Erwartung |
|---|---|
| Tap auf Burger | Panel klappt auf, Icon wird zu "X", Body scrollt nicht mehr |
| Tap "Pimp my Kebap" | Navigation zu `/konfigurator`, Panel zu, Icon zurück zu Lines |
| Burger öffnen → ESC | Panel zu, Fokus auf Burger |
| Burger öffnen → in Hero tappen | Panel zu (outside-click) |
| Burger öffnen → Browser auf Desktop-Breite ziehen | Panel zu (resize ≥md) |

### T2 — Kebap konfigurieren (Zutaten add/remove)
| Schritt | Erwartung |
|---|---|
| `/konfigurator` öffnen | Preisanzeige `0,00 €`, "In den Warenkorb" disabled |
| Brot "Klassisch" wählen → Basis "Kebap Basic" wählen | Preis `6,50 €`, Add-Button enabled |
| Spieß "Steak Döner" wählen | Preis `7,50 €` |
| Mehr Fleisch +1 (Stepper) | Preis `9,00 €` |
| Mehr Fleisch +1 +1 (3 total) | Preis `12,00 €` (3× 1,50 €) |
| Mehr Fleisch nochmal +1 | Bleibt `12,00 €` (clamp 3) |
| Mehr Fleisch −1 −1 −1 −1 | Bleibt `7,50 €` (clamp 0) |
| Schmelzkäse anklicken | `+1,00 €` → `8,50 €` |
| Saucen "BBQ" + "Cocktail" | Bleibt `8,50 €` (2 frei) |
| Sauce "Mango-Avocado" dazu | `+0,50 €` → `9,00 €` |
| BBQ wieder entfernen | `−0,00 €` → `9,00 €` (immer noch 2 frei) |
| **Topping "Kraut" anklicken** (im Salat enthalten) | **Preis bleibt** `9,00 €` (B1 fix) |
| Topping "Granatapfel" + "Rucola" | `+1,00 €` → `10,00 €` |
| Topping "Granatapfel" wieder weg | `9,50 €` |
| "In den Warenkorb" tappen | Toast "Dein Kebap ist im Warenkorb", Drawer öffnet, Line zeigt korrekten Preis |

### T3 — Surprise Me
| Schritt | Erwartung |
|---|---|
| "Surprise Me" tappen | Random-Konfig wird gesetzt, scrollt zum Konfigurator, kein `kraut`/`zwiebeln`/`tomaten` (random-kebab.ts filtert sie) |
| Preis sichtbar > 6,50 € | OK |

### T4 — Pizza konfigurieren
| Schritt | Erwartung |
|---|---|
| `/pimp-my-pizza` öffnen | Preis `8,00 €`, Summary "Margherita-Stil" |
| Topping "Salami" | `9,00 €`, Summary "Salami" |
| Topping "Sucuk" (premium) | `10,50 €` (1,50 €) |
| Toppings "Salami" + "Sucuk" + "Mais" | `11,50 €` (1,00+1,50+1,00) |
| Salami wieder weg | `10,50 €` |
| Add to cart | Drawer öffnet, Pizza heißt "Pimp my Pizza · Sucuk, Mais" |

### T5 — Speisekarte (Items add/remove)
| Schritt | Erwartung |
|---|---|
| `/speisekarte` öffnen | 0 Treffer-Status nicht gezeigt |
| Suche "pizza" | Nur Pizzas sichtbar, andere Sektionen versteckt |
| Suche leer + Filter "Vegetarisch" | Nur veg-Tag-Items |
| Filter "Scharf" anklicken (gleichzeitig veg + scharf) | Filter sind exklusiv-OR, leere Treffer möglich → Status "Keine Treffer" |
| Reset | Alle Items wieder sichtbar, Filter aus |
| Auf Pizza Margherita Card "+" tappen | qty 1, Toast "Margherita hinzugefügt" |
| nochmal "+" | qty 2 |
| "−" tappen | qty 1 |
| "−" tappen | qty 0, Line entfernt |
| Bei Item ohne Preis ("Auf Anfrage") | Stepper nicht sichtbar |

### T6 — Warenkorb
| Schritt | Erwartung |
|---|---|
| Cart-Bar unten antippen | Drawer öffnet, body-overflow hidden |
| `−` bei Line mit qty 1 | Line entfernt; wenn letzte → Empty-State |
| `+` mehrfach | qty cappt bei 20 (validation) |
| "Entfernen" | Line weg |
| "Bestellart" → "Lieferung" | Adress-Block sichtbar, Liefergebühr-Zeile sichtbar |
| Stadt "Andere Stadt" | "nach Absprache" |
| Bestellsumme < 20 € + Lieferung | Warning rot, Checkout disabled |
| Bestellart zurück auf Abholung | Warning weg, Checkout enabled |
| Vorname tippen | Persistiert (im localStorage `pmk-cart-v1`) |
| Notes mit Sonderzeichen (`<script>`) | Sanitize entfernt unzulässige Zeichen |
| "Teilen" tappen mit leerem Warenkorb | Toast "Erst Artikel … dann teilen" |
| "Teilen" mit Items | Link kopiert (in Clipboard) |
| Link in zweitem Tab öffnen | Cart wird übernommen, Hash entfernt |
| "Bon" tappen mit Items | Browser-Druckdialog mit Bestellung |
| "Leeren" tappen | Bestätigungsdialog → Cart leer |
| ESC | Drawer zu |

### T7 — WhatsApp-Order
| Schritt | Erwartung |
|---|---|
| Cart mit ≥ 1 Item, Vorname gesetzt | Checkout enabled |
| "Per WhatsApp senden" | Bestätigungsdialog mit Vorschau-Text |
| OK | Neuer Tab `wa.me/...` mit URL-encodedem Text, Toast "Bestellung gesendet", History-Eintrag |
| Sofort nochmal "Per WhatsApp" | Throttle: Warning "Bitte einen Moment warten…" |
| 5+ Sek warten, erneut | Geht durch |

### T8 — History
| Schritt | Erwartung |
|---|---|
| Auf `/` zurück | Section "Deine letzten Bestellungen" sichtbar (mit den getätigten Bestellungen) |
| "Erneut bestellen" tappen | Cart füllt sich mit Kopien, neue Line-IDs, Drawer öffnet |
| "Verlauf löschen" | Bestätigung, Section verschwindet |

### T9 — Persistenz / Refresh
| Schritt | Erwartung |
|---|---|
| Items + Vorname + Lieferadresse setzen | Reload → alles noch da |
| `localStorage` manuell löschen + reload | leerer Cart |
| Browser 25 h später öffnen (Date stub) | TTL abgelaufen → Cart geleert |

### T10 — Header / Status / Telefon
| Schritt | Erwartung |
|---|---|
| Header zeigt Status-Pill | Grün/gold/rot je Tag und Uhrzeit |
| Telefon-Icon (mobile) | `tel:` Link öffnet Wähler |
| Phone-Button (sm-md) | gleicher tel-Link |
| Desktop-Nav | Kebap / Pizza / Speisekarte sichtbar ab md |

### T11 — Druck-Bon
- "Bon" tappen mit Items → Druckdialog. Rest der Seite versteckt, nur `#print-receipt` mit Header + Adresse + WhatsApp-Vorschau-Text (preformatted).

### T12 — Toast-Icons
| Tone | Icon |
|---|---|
| `success` | Häkchen-SVG |
| `error` | Warndreieck-SVG |
| `info` | Info-Kreis-SVG |

---

## 4. Automatisierte Verifikation

```bash
npx astro check        # 0 errors expected
npx eslint . --ext .js,.mjs,.ts,.astro   # exit 0
npx vitest run         # 76 passed
npx astro build        # 7 pages built
```

E2E-Test (Playwright) ist bereits vorhanden in `tests/e2e/konfigurator.spec.ts` für den Kebap-Configurator. Empfehlung: zukünftige Erweiterung um T1 (Hamburger), T6 (Cart), T7 (WhatsApp-URL-Build).

---

## 5. Debugging-Quick-Reference

| Symptom | Erste Prüfung |
|---|---|
| Cart bleibt nach Reload leer | `localStorage.getItem('pmk-cart-v1')` in DevTools-Console |
| Preis stimmt nicht | `priceKebab(state)` in Configurator manuell aufrufen, breakdown prüfen |
| WhatsApp öffnet nicht | `data-wa-number` Attribut auf Checkout-Button + `PUBLIC_RESTAURANT_WHATSAPP` in `.env` |
| Burger schließt sich nicht | DevTools: ist `mobile-nav-open` auf `<body>`? Click-Handler an Toggle? |
| Topping zählt obwohl baseIncluded | `priceKebab` in `pricing.ts:54` → muss `chargeableToppings` filtern |
| Keine Filter-Treffer | `card.dataset.itemSearch` korrekt befüllt? Filter-State-Reset arbeitet? |
| Service Worker stale | `navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()))` |
