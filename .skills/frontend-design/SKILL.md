# Skill: frontend-design

> Local skill stub. Codifies the conventions used across the Pimp My Kebap UI
> in lieu of a marketplace skill of the same name.

## Mission

Mobile-first, dark-luxury restaurant UI. Subway-style configurator vibe meets
upscale steakhouse polish. No cringe, no clichés, no stock photo aesthetic.

## Design tokens

Defined in `src/styles/tokens.css` and exposed to Tailwind via theme extension:

| Token | Value | Usage |
|---|---|---|
| `--color-brand-black` | `#0a0a0a` | Page background |
| `--color-brand-charcoal` | `#1a1a1a` | Surfaces, cards |
| `--color-brand-gold` | `#d4af37` | Primary accent, borders, prices |
| `--color-brand-gold-light` | `#f4d03f` | Hover states, highlights |
| `--color-brand-orange` | `#ff6b1a` | Secondary CTA, "scharf" |
| `--color-brand-cream` | `#f8f3e6` | Body text on dark |
| `--color-brand-green-leaf` | `#2e7d32` | "Vegetarisch" badge |
| `--color-brand-red-fire` | `#d32f2f` | "Scharf"/"NEU" badge |

## Typography

- **UI**: Inter, system-ui fallback. Self-hosted (`/public/fonts/inter-*.woff2`).
- **Display/Headlines**: Playfair Display, serif fallback. Self-hosted.
- Body: 16px / 1.6 line-height baseline; large-text headings 1.875rem+.

## Components rules

1. Touch targets **min 44×44 CSS px**; configurator targets aim 64×64.
2. Active selection: 2px gold border + soft glow `box-shadow: 0 0 0 4px rgba(212,175,55,.15)`.
3. CTAs gold-to-orange gradient on hover; reduced-motion = solid color swap.
4. Prices in DE format (`7,50 €`) using `Intl.NumberFormat('de-DE')`.
5. Cards: charcoal surface, 1px gold/30% border, 12px radius, subtle inner shadow.
6. Icons: `lucide` SVGs only, self-hosted.
7. No external CSS, no Google Fonts, no CDN images.

## File-header convention

Every file that contributes to user-facing UI should include:

```ts
// Powered by skill: frontend-design
```
