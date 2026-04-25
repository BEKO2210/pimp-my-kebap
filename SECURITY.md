# Security Policy

## Reporting a vulnerability

Please contact the repository owner via GitHub or email
`Zentrumdoener@outlook.com` with a description and reproduction steps.
We aim to respond within 7 days.

## Scope and posture

This is a **fully static site** with **no backend** and **no user account
system**. There is no database, no API, no session storage, no analytics, no
third-party SDKs.

### Implemented hardening

- Strict CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy,
  Permissions-Policy, COOP/COEP/CORP — see `public/_headers`.
- No inline scripts (only `application/ld+json` for SEO).
- No external scripts, fonts, images, trackers.
- All `localStorage` reads are validated through Zod schemas.
- Notes input restricted to a safe character whitelist (max 280 chars).
- WhatsApp send action throttled (1 per 5s) client-side.
- Owner home address is preflight-checked against the entire repo.
- Dependencies checked via `npm audit` in CI; build fails on high/critical.

### Out of scope

- Vulnerabilities in WhatsApp / Meta — the click-to-chat handover is owned by
  Meta. Privacy implications disclosed in `/datenschutz`.
- Vulnerabilities in OpenStreetMap tile delivery — only used for a static map
  preview, allowed under CSP `img-src`.
