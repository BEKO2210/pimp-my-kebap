# Skills Applied to Pimp My Kebap

> Mapping of every upstream skill in `.skills/upstream/` (copied verbatim from
> [ComposioHQ/awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills))
> to concrete decisions in this repo. The order roughly mirrors how often the
> skill drives day-to-day work.

| # | Upstream skill | What it told us | Where it shows in the site |
|---|---|---|---|
| 1 | **artifacts-builder** | "VERY IMPORTANT: avoid excessive centered layouts, purple gradients, uniform rounded corners, and Inter font." | UI revamp: asymmetric hero, **mixed corner radii** (sharp + rounded), **gold↔fire-orange** accents (no purple), display font **Playfair Display** + UI font **Space Grotesk** instead of Inter, off-axis layouts in Configurator + Speisekarte sections |
| 2 | **brand-guidelines** | Codify a brand palette with primary/accent/neutral roles, typography pairing, accent rotation rules. | `src/data/brand.ts` + `src/styles/tokens.css`: 8 named brand colors with documented use cases; "vegetarisch", "scharf", "neu" are never colored arbitrarily — always `--color-brand-green-leaf`, `--color-brand-red-fire`, `--color-brand-orange` |
| 3 | **canvas-design** | Express a *design philosophy* before laying out. | "Marktplatz-Luxe" philosophy = dark steakhouse + Subway-configurator energy. Implemented as the dominant aesthetic across sections and documented in `.skills/frontend-design/SKILL.md` |
| 4 | **theme-factory** | Cohesive palette + font pairing, single source of truth. | `src/styles/tokens.css` and Tailwind v4 `@theme` block in `global.css` are the only places that emit color/font tokens — every component consumes them by name |
| 5 | **webapp-testing** | Prefer Playwright over manual checks; black-box test scripts. | `playwright.config.ts` (mobile + desktop projects) + `tests/e2e/konfigurator.spec.ts` covering bread→base→add→deliver→checkout |
| 6 | **image-enhancer** | Treat placeholders + AVIF/WebP as a real pipeline, not an afterthought. | `scripts/build-images.mjs`: real logo → AVIF/WebP/PNG/PWA-icons/favicons/OG-image at prebuild; SVG placeholders per category for missing food photos |
| 7 | **content-research-writer** | Copy that converts: headline + sub + value-stack. | Hero "Create Your Kebap. Pay Your Style." + Warum section's three value cards (100 g · Schüler 6 € · +0,50 €/Topping) |
| 8 | **skill-creator** | A skill = onboarding guide for a domain. Anatomy: name, description, when-to-use, rules. | `.skills/<name>/SKILL.md` files all follow this anatomy (frontend-design, security, accessibility, seo-local, pwa, image-optimization) |
| 9 | **template-skill** | Boilerplate for new local skills. | Used as the structure for our six local SKILL.md files |
| 10 | **file-organizer** | Predictable repo layout that scales. | `src/data/`, `src/lib/`, `src/components/<group>/<name>.astro` + colocated `*.client.ts` — every file has one obvious home |
| 11 | **changelog-generator** | Keep a CHANGELOG.md. | `CHANGELOG.md` (Keep-a-Changelog format), updated per phase |

## Anti-AI-slop checklist (artifacts-builder, applied)

- [x] No purple gradients — all accent gradients are `gold → fire-orange`
- [x] No uniform rounded corners — buttons have a slightly different radius from cards, sections use sharp top corners with rounded bottoms
- [x] Mostly NOT centered — headlines left-aligned, hero offset, Configurator step labels stacked left
- [x] Display font is **Playfair Display** (high-contrast serif), UI font is **Space Grotesk** (geometric, distinctive — explicitly *not* Inter), prices use a tabular numerals stack for legibility

## Skills NOT included (and why)

The following upstream skills were intentionally skipped — they don't apply to a static restaurant site:

- `connect`, `connect-apps`, `connect-apps-plugin`, `composio-skills/*`, `langsmith-fetch` — backend integrations
- `mcp-builder`, `slack-gif-creator`, `video-downloader` — unrelated tooling
- `competitive-ads-extractor`, `developer-growth-analysis`, `lead-research-assistant`, `meeting-insights-analyzer`, `tailored-resume-generator`, `twitter-algorithm-optimizer`, `domain-name-brainstormer`, `invoice-organizer`, `raffle-winner-picker`, `internal-comms`, `skill-share`, `document-skills` (kept the idea in mind but the printable menu is solved via a print stylesheet rather than docx/pdf SDKs)
