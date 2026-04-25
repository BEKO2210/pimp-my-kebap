# Fonts

Self-hosted variable WOFF2 fonts. Replace the placeholder files below with the
real binaries before deploying to production.

## Required files

- `inter-variable.woff2` — Inter (variable, 100–900). License: SIL OFL 1.1
- `playfair-display-variable.woff2` — Playfair Display (variable, 400–900). License: SIL OFL 1.1

## Where to download

- https://fonts.google.com/specimen/Inter (download → "Inter Variable" → woff2)
- https://fonts.google.com/specimen/Playfair+Display (download → variable → woff2)

After downloading, copy the OFL.txt next to the font binary in this folder.
The `<link rel="preload">` and `@font-face` rules are wired up in
`src/styles/global.css`.
