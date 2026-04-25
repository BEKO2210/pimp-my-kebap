# Skill: seo-local

> Local skill stub. Local SEO and Schema.org for the restaurant.

## Meta

- `<title>`: "Pimp My Kebap Freiberg am Neckar — Döner konfigurieren & per WhatsApp bestellen"
- Meta description ≤155 chars, includes USPs (frisch, fair, flexibel, WhatsApp-Bestellung).
- Canonical to absolute production URL.
- Open Graph + Twitter Cards with `og-image.jpg` (1200×630).
- `hreflang="de-DE"`.

## JSON-LD blocks (in `<head>`, type=`application/ld+json`)

- `Restaurant` with `geo`, `address`, `openingHoursSpecification` (Mon–Sat 10:30–21:00),
  `priceRange: "€"`, `acceptsReservations: false`, `paymentAccepted`, `servesCuisine`.
- `LocalBusiness` (parent of Restaurant for clarity).
- `Menu` with `MenuSection` and `MenuItem` for each category.
- `BreadcrumbList`.

## Files

- `public/robots.txt`: allow all.
- `public/sitemap.xml`: index, impressum, datenschutz, 404.

## File-header convention

```ts
// Powered by skill: seo-local
```
