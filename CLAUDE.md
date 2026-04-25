# Masterplan — Polishing & Debugging Pimp My Kebap

> Wir arbeiten **einen Punkt nach dem anderen** ab. Pro Punkt: Fix → typecheck/lint/vitest/build → Commit → Push → kurzer Status, dann nächster Schritt.
>
> Reihenfolge gewählt nach Endnutzer-Wirkung: erst Dinge die Aktionen blockieren oder Bestellungen verfälschen, dann Form-UX, dann Polish, zum Schluss Aufräumen.

## Status-Legende
- [x] erledigt (Commit-SHA in Klammern)
- [ ] offen
- [→] aktuell in Arbeit

---

## Plan

### 1. Konfigurator-Empty-State klar [x] (08e027c)
"6,50 € + Add disabled" war widersprüchlich. Footer zeigt jetzt
"Schritt 1 · Wähle deine Basis" / "Schritt 2 · Wähle dein Brot",
echter Preis erst wenn beides gewählt.

### 2. Sticky-Cart-Bar überdeckt Konfigurator-Footer auf Mobile [x]
Body bekommt jetzt eine Klasse `has-cart-bar` sobald der Cart Items
enthält; CSS hebt die Sticky-Konfigurator-Summary auf Mobile auf
`bottom: 5.25rem`, sodass sie über der ~60px hohen Cart-Bar sitzt.
Auf Desktop (Cart-Bar ist eh `lg:hidden`) Reset auf `1rem`. Beide
Konfigurator-Footer (Kebap + Pizza) sind über die Klasse
`.cfg-sticky-footer` markiert.

### 3. Pickup-Zeiten beim Cart-Öffnen neu generieren [x]
Slots werden jetzt jedes Mal beim Öffnen des Drawers (`setOpen(true)`)
neu erzeugt. Vorherige Auswahl wird übernommen, falls sie noch in der
Liste steht — sonst Reset auf ASAP und Store-Sync, damit die
WhatsApp-Nachricht keinen veralteten ISO trägt.

### 4. PLZ visuell als invalid markieren [x]
PLZ + Straße bekommen jetzt `aria-invalid="true"` sobald Lieferung
gewählt ist UND der User das Feld bereits berührt hat (Input-Event)
UND der Wert nicht passt (leer / nicht 5 Ziffern). CSS-Regel auf
`input[aria-invalid='true']` setzt dann roten Border + roten
Box-Shadow-Ring. Auf der ersten Anzeige der leeren Form bleibt alles
neutral, damit niemand angeschrien wird, der gerade erst öffnet.

**Bonus**: Die Google-Maps-Vorschau zeigt jetzt unter dem Karten-Bild
die volle Anschrift (Marktplatz 18 · 71691 Freiberg am Neckar) plus
"Route in Google Maps öffnen →". Klick irgendwo in die Karte oder
Adresse öffnet Google Maps.

### 5. "Auf Anfrage"-Items: Telefon-Action [x]
Erübrigt sich — die zwei betroffenen Pommes haben jetzt feste Preise:
Chili Cheese Pommes 6,50 €, mit Sucuk 8,00 € (Pommes selbst stehen
wie gehabt mit 5,00 € in der Nuggets-Kategorie). Damit gibt es im
ganzen Menü kein `priceEur: null` mehr und der Stepper ist überall
nutzbar. Markings ergänzt (a/b/d Boden, plus 3/6 für Sucuk).

### 5b. Konfigurator-Flow: keine Auto-Cart-Öffnung mehr [x]
Bisher haben beide Konfiguratoren am Ende `openCart()` aufgerufen, was
den User aus seinem Bestellprozess riss. Jetzt: Add → Redirect auf
`/weiter?added=kebap` (bzw. `?added=pizza`). Die neue Seite zeigt eine
grüne Bestätigung, drei große CTA-Karten ("Noch einen Kebap pimpen" /
"Pizza pimpen" / "Speisekarte") und unten einen Cart-Status mit
"Bestellung abschließen"-Button, der den Drawer öffnet. So kann der
User beliebig kombinieren, ohne in den Drawer gezwungen zu werden.

### 6. WhatsApp-URL-Längenlimit absichern [x]
Im Checkout-Click wird die wa.me-URL jetzt VOR dem Confirm-Dialog
gebaut. Schwelle `WHATSAPP_URL_SAFE_LIMIT = 6500` (Zeichen, encoded).
Bei Überschreitung erscheint ein "Hinweis"-Block oberhalb der
Vorschau im selben Dialog, der die ungefähre Größe in KB nennt und
die Restaurant-Telefonnummer als sicheren Alternativweg anbietet.
Mehrere Hinweise (geschlossener Laden + langer Link) werden in einen
einzigen Confirm-Dialog konsolidiert, statt den User durch zwei
hintereinander zu schicken.

### 7. Konfigurator: Default-Spieß deutlicher hervorheben [x]
Zwei Probleme: (1) der Active-Selector `.btn-secondary[aria-pressed="true"]`
griff nicht auf die Spieß-Buttons, weil sie `role="radio"` mit
`aria-checked` benutzen, nicht `aria-pressed`. (2) Der Active-Look war
sowieso zu zurückhaltend (nur Tönung).
Fix: Selektor um `[aria-checked="true"]` erweitert, Active-Variante
verstärkt um einen Gold-Ring + soften Glow (`box-shadow: 0 0 0 1px
gold, 0 4px 14px gold/.18`). Server-side wird der erste MEAT jetzt
schon mit `data-active="true"` ausgeliefert, also ist der Highlight
sofort sichtbar — auch ohne JS-Hydrate. Nebeneffekt: Filter-Buttons
in der Speisekarte und der Bestellart-Toggle im Cart bekommen den
gleichen klaren Active-Look — konsistent durch die App.

### 8. Filter-Dropdown: Auto-Close bei Allergen-Reset [x]
Reset-Handler in `menuFilter.client.ts` schließt den
`data-menu-filter-dropdown` (`<details>`) jetzt zusätzlich nach dem
`apply()`. Action abgeschlossen → Panel zu, User sieht direkt die
ungefilterte Liste.

### 9. Schüler-Section am Sonntag/Feiertag verstecken [x]
Neuer Helper `isSchoolDay()` in `lib/time.ts` (Mo–Fr, kein Feiertag —
unabhängig von der Uhrzeit, im Gegensatz zum bestehenden
`isSchoolHoursWindow`). `Speisekarte.astro` filtert die Kategorien-
Liste mit ihm: an Sa/So/Feiertagen verschwinden sowohl die
Quick-Jump-Nav-Pille als auch die ganze Schüler-Sektion. An
Mo–Fr ≤16 bleibt sie voll funktional, an Mo–Fr nach 16 zeigt sie
weiter den "außerhalb Schulzeit"-Hinweis (kein Stepper, wie L1).
Tests: 4 neue Cases für `isSchoolDay`.

### 10. Konfigurator-Footer-Hint inline am Step [x]
Jede Step-Legend (Basis, Brot) trägt jetzt einen `data-cfg-step-hint`
mit "← hier starten" / "← hier weitermachen". Der Client-Controller
setzt aktiv: `base` wenn baseChosen=false, `bread` wenn baseChosen
aber breadOk=false, sonst `null` (alle Hints aus). Sanfte
`cfg-pulse` Animation bewegt den Pfeil 2 px hin- und her, damit das
Auge ihn findet — abgeschaltet bei `prefers-reduced-motion`.

### 11. Page-Title je Route + OG-Image für WhatsApp [x]
Konsistentes Title-Schema umgesetzt: Konfiguratoren tragen
`<Brand> — Konfigurator · Freiberg`, neutrale Routen
`<Spezifisch> · Pimp My Kebap Freiberg`. Brand am Ende
(Browser-Tab + SEO), middle-dot als Trenner, "Freiberg"
durchgehend für Geo-SEO.

**Bonus / echter Bug**: `Base.astro:25` hat die OG-Image-URL gebaut
mit `${siteUrl}${withBase(ogImage)}`. Da `siteUrl` bereits den
Project-Pages-Sub-Path enthält und `withBase()` ihn nochmal
prependet, ergab sich
`https://…/pimp-my-kebap/pimp-my-kebap/brand/og-image.jpg` →
404 → keine WhatsApp-Link-Vorschau. Jetzt
`${siteUrl}${ogImage}` direkt — verifiziert im Build:
`og:image` zeigt auf die echte URL und `dist/brand/og-image.jpg`
existiert.

### 12. Footer: Links sauber ausrichten [x]
Drei Polishings:
1. Section-Headers konsistent — alle drei Spalten benutzen jetzt
   `.eyebrow` (Brand-Spalte mit zusätzlichem display-Headline für
   den Brand-Namen).
2. Allergene-Akkordeon: Default-Browser-Triangle entfernt, durch
   Lucide-Chevron mit 180°-Rotation ersetzt (gleicher Stil wie
   Speisekarten-Akkordeons).
3. Mobile-Layout: Grid `sm:grid-cols-2 lg:grid-cols-3` — auf Tablet
   sind Kontakt + Rechtliches nebeneinander, Allergene voll breit.
Hover-States der Links auf gold mit Transition für klares Feedback.

### 13. Toast-Stack auf Mobile [ ]
Mehrere Toasts schnell nacheinander → wie sieht das aus? Position
und Stacking-Verhalten prüfen.

### 14. Veraltete E2E-Tests aufräumen [ ]
`tests/e2e/konfigurator.spec.ts` testet noch alte Routen / alte
Step-Reihenfolge. Entweder anpassen oder ersetzen, damit niemand
auf veralteten Code blickt.

### 15. CSP/Security-Header Sichtprüfung [ ]
Nach allen Änderungen einmal `dist/index.html` prüfen: stimmen die
CSP-Direktiven noch (img-src für tile.openstreetmap.org), keine
inline-Scripts ohne nonce.

---

## Workflow pro Schritt
1. Schritt aus dem Plan herausgreifen, [→] markieren
2. Fix umsetzen
3. `npx astro check && npx eslint . --ext .js,.mjs,.ts,.astro && npx vitest run && npx astro build`
4. `git add -A && git commit -m "…" && git push -u origin claude/fix-hamburger-menu-hVO2d`
5. In CLAUDE.md auf [x] mit Commit-SHA setzen
6. Im Chat: "Schritt N erledigt — als Nächstes Schritt N+1: …"
