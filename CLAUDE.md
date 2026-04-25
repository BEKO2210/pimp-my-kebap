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

### 6. WhatsApp-URL-Längenlimit absichern [ ]
Eine sehr lange Bestellung kann den `wa.me`-Link über das praktische
Limit (~6 KB) hinaus aufblähen — WhatsApp bricht dann stillschweigend
oder gar nicht. Lösung: Vor dem `window.open` Länge prüfen, bei
Überschreitung den User warnen und Fallback (z.B. "Per Telefon
bestellen, Liste zu lang").

### 7. Konfigurator: Default-Spieß deutlicher hervorheben [ ]
`rinderhack` ist `aria-checked=true` aber visuell ähnlich zu
unselektiert. Stärkere Active-Variante (gold-ring) damit klar ist,
dass das die aktuelle Wahl ist und ggf. geändert werden kann.

### 8. Filter-Dropdown: Auto-Close bei Allergen-Reset [ ]
Aktuell bleibt der Dropdown nach "Alle Filter zurücksetzen" offen.
Reset sollte auch zumachen, weil Action abgeschlossen.

### 9. Schüler-Section am Sonntag/Feiertag verstecken [ ]
Aktuell bleibt die Sektion sichtbar (gedimmt + "außerhalb Schulzeit"-
Badge). An Tagen, an denen das Restaurant gar nicht öffnet bzw.
Schule geschlossen ist (Sonntag, Feiertag), ist auch die ganze
Sektion uninteressant. Sauberer: ganz ausblenden.

### 10. Konfigurator-Footer-Hint inline am Step [ ]
Aktuell sagt der Footer "Wähle deine Basis", aber der User scrollt
runter zum Footer. Zusätzlich ein kleiner Pfeil/Hinweis am
aktiven Step, falls noch nichts gewählt ist.

### 11. Page-Title je Route [ ]
Aktuell hat jede Seite ihren `<title>` (gut), aber Wording prüfen:
"… · Pimp My Kebap Freiberg" am Ende für SEO-Konsistenz.

### 12. Footer: Links sauber ausrichten [ ]
Sichtprüfung — Impressum/Datenschutz/Allergene-Liste auf Mobile +
Desktop. Spacing, Tab-Order.

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
