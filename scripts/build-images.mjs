// Powered by skill: image-optimization
// Build-time image pipeline. Generates AVIF/WebP variants of the logo, PWA
// icons, favicons, OG image, and SVG menu placeholders.
//
// Skips silently if `sharp` is not installed (lets `npm install` succeed
// before native deps are present).
import { existsSync, mkdirSync, readdirSync, writeFileSync, statSync } from 'node:fs';
import { resolve, basename, extname } from 'node:path';

const ROOT = resolve(process.cwd());
const LOGO_PNG = resolve(ROOT, 'public/brand/logo.png');
const BRAND_DIR = resolve(ROOT, 'public/brand');
const ICON_DIR = resolve(ROOT, 'public/icons');
const PUBLIC_DIR = resolve(ROOT, 'public');
const PLACEHOLDER_DIR = resolve(ROOT, 'public/images/placeholders');
const MEALS_DIR = resolve(ROOT, 'public/images/meals');

let sharp;
try {
  ({ default: sharp } = await import('sharp'));
} catch {
  console.warn('⚠️  sharp not installed — skipping image build (run `npm install` first).');
  process.exit(0);
}

if (!existsSync(LOGO_PNG)) {
  console.error(`🛑 Logo missing at ${LOGO_PNG}`);
  process.exit(1);
}

function ensureDir(p) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}
ensureDir(BRAND_DIR);
ensureDir(ICON_DIR);
ensureDir(PLACEHOLDER_DIR);
ensureDir(MEALS_DIR);

const BRAND_BG = { r: 10, g: 10, b: 10, alpha: 1 };
const logo = sharp(LOGO_PNG);
const meta = await logo.metadata();
console.log(`🖼  Logo: ${meta.width}×${meta.height}`);

// 1. Brand WebP / AVIF variants of the raw logo (transparent).
//    Source PNG is 4095×4095. Capped at 512 px because the hero shows the
//    logo at ≤380 px CSS (≤760 px on 2× retina) and the header at ≤44 px
//    (≤88 px retina) — 512 covers both with marginal softening only on
//    high-DPR hero, masked by the drop-shadow filter on the <img>.
//    AVIF q=55 / WebP q=78 keep the warm gold/orange gradient legible while
//    cutting the LCP-blocking download (PageSpeed flagged this as the LCP
//    bottleneck — was 91 KiB at 1024 px / q=65, now ≈63 KiB).
await sharp(LOGO_PNG)
  .resize({ width: 512, withoutEnlargement: true })
  .webp({ quality: 78 })
  .toFile(resolve(BRAND_DIR, 'logo.webp'));
await sharp(LOGO_PNG)
  .resize({ width: 512, withoutEnlargement: true })
  .avif({ quality: 55 })
  .toFile(resolve(BRAND_DIR, 'logo.avif'));

// 2. PWA icons (logo on dark background, padded)
async function pwaIcon(size, maskable = false) {
  const padding = maskable ? Math.round(size * 0.18) : Math.round(size * 0.08);
  const inner = size - padding * 2;
  const resized = await sharp(LOGO_PNG)
    .resize({ width: inner, height: inner, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  return sharp({
    create: { width: size, height: size, channels: 4, background: BRAND_BG },
  })
    .composite([{ input: resized, gravity: 'center' }])
    .png({ compressionLevel: 9 });
}

await (await pwaIcon(192)).toFile(resolve(ICON_DIR, 'logo-192.png'));
await (await pwaIcon(512)).toFile(resolve(ICON_DIR, 'logo-512.png'));
await (await pwaIcon(192, true)).toFile(resolve(ICON_DIR, 'logo-maskable-192.png'));
await (await pwaIcon(512, true)).toFile(resolve(ICON_DIR, 'logo-maskable-512.png'));

// 3. Favicons
await (await pwaIcon(32)).toFile(resolve(PUBLIC_DIR, 'favicon-32.png'));
await (await pwaIcon(16)).toFile(resolve(PUBLIC_DIR, 'favicon-16.png'));
// Multi-size .ico (16/32/48)
const ico16 = await (await pwaIcon(16)).toBuffer();
const ico32 = await (await pwaIcon(32)).toBuffer();
const ico48 = await (await pwaIcon(48)).toBuffer();
// Sharp doesn't write .ico directly; ship the 32×32 PNG renamed as a fallback.
writeFileSync(resolve(PUBLIC_DIR, 'favicon.ico'), ico32);
void ico16; void ico48;

// 4. apple-touch-icon (180×180)
await (await pwaIcon(180)).toFile(resolve(PUBLIC_DIR, 'apple-touch-icon.png'));

// 5. OG image (1200×630) — header-style social card.
// Logo + brand wordmark on the left, slogan + contact on the right.
// Two thin gold accent lines top/bottom mirror the header border.
{
  const W = 1200, H = 630;
  const logoSize = 380;
  const innerLogo = await sharp(LOGO_PNG)
    .resize({ width: logoSize, height: logoSize, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  const svg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
      <defs>
        <radialGradient id="glow" cx="78%" cy="22%" r="55%">
          <stop offset="0%"   stop-color="#d4af37" stop-opacity="0.18"/>
          <stop offset="100%" stop-color="#d4af37" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="accent" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%"   stop-color="#d4af37" stop-opacity="0"/>
          <stop offset="50%"  stop-color="#d4af37" stop-opacity="0.85"/>
          <stop offset="100%" stop-color="#d4af37" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#glow)"/>
      <rect x="80" y="56"  width="${W - 160}" height="2" fill="url(#accent)"/>
      <rect x="80" y="${H - 58}" width="${W - 160}" height="2" fill="url(#accent)"/>

      <!-- Right column: brand text + slogan + contact -->
      <text x="${W - 80}" y="240" text-anchor="end"
            font-family="'Playfair Display', Georgia, serif" font-size="84" fill="#f8f3e6" font-weight="800"
            letter-spacing="-2">
        Pimp My <tspan fill="#d4af37" font-style="italic">Kebap</tspan>
      </text>
      <text x="${W - 80}" y="295" text-anchor="end"
            font-family="'Space Grotesk', Helvetica, sans-serif" font-size="22" fill="#d4af37"
            letter-spacing="6" font-weight="700">
        FREIBERG AM NECKAR
      </text>

      <text x="${W - 80}" y="395" text-anchor="end"
            font-family="'Playfair Display', Georgia, serif" font-size="34" fill="#f8f3e6" font-style="italic"
            opacity="0.92">
        Create Your Kebap. Pay Your Style.
      </text>

      <text x="${W - 80}" y="465" text-anchor="end"
            font-family="'Space Grotesk', Helvetica, sans-serif" font-size="22" fill="#f8f3e6" opacity="0.75">
        Marktplatz 18  ·  0174 2116095
      </text>
      <text x="${W - 80}" y="500" text-anchor="end"
            font-family="'Space Grotesk', Helvetica, sans-serif" font-size="22" fill="#f8f3e6" opacity="0.75">
        Bestellung per WhatsApp
      </text>
    </svg>`,
  );

  await sharp({ create: { width: W, height: H, channels: 4, background: BRAND_BG } })
    .composite([
      { input: svg, top: 0, left: 0 },
      // Left column: logo, vertically centered.
      { input: innerLogo, top: Math.round((H - logoSize) / 2), left: 80 },
    ])
    .jpeg({ quality: 88 })
    .toFile(resolve(BRAND_DIR, 'og-image.jpg'));
}

// 6. SVG placeholders for menu items (read manifest from src/data/menu.ts is overkill;
//    we generate a generic per-category palette instead, matched on demand at render).
const PLACEHOLDER_CATEGORIES = [
  'doener', 'pide', 'pizza', 'burger', 'salat',
  'getraenk', 'pommes', 'lahmacun', 'seele', 'vegetarisch', 'nuggets',
];
const ICONS = {
  doener: '🥙', pide: '🥖', pizza: '🍕', burger: '🍔', salat: '🥗',
  getraenk: '🥤', pommes: '🍟', lahmacun: '🫓', seele: '🥖',
  vegetarisch: '🌱', nuggets: '🍗',
};
for (const cat of PLACEHOLDER_CATEGORIES) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480" role="img" aria-label="Platzhalter">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#1a1a1a"/>
        <stop offset="100%" stop-color="#0a0a0a"/>
      </linearGradient>
    </defs>
    <rect width="640" height="480" fill="url(#g)"/>
    <rect x="6" y="6" width="628" height="468" fill="none" stroke="#d4af37" stroke-opacity=".4"/>
    <text x="50%" y="55%" font-size="180" text-anchor="middle">${ICONS[cat] ?? '🥙'}</text>
    <text x="50%" y="82%" font-family="serif" font-size="28" fill="#f8f3e6" text-anchor="middle">Pimp My Kebap</text>
  </svg>`;
  writeFileSync(resolve(PLACEHOLDER_DIR, `${cat}.svg`), svg);
}

// 7. Auto-convert every uploaded meal photo (.jpg/.jpeg/.png) into a webp
//    + avif variant next to it. ItemCard.astro renders <picture> with three
//    sources (avif → webp → jpg), so dropping a `${id}.jpg` into images/meals
//    and re-running the build is enough to get optimised delivery.
async function convertMealPhotos() {
  if (!existsSync(MEALS_DIR)) return;
  const entries = readdirSync(MEALS_DIR);
  let converted = 0;
  for (const entry of entries) {
    const ext = extname(entry).toLowerCase();
    if (ext !== '.jpg' && ext !== '.jpeg' && ext !== '.png') continue;
    const stem = basename(entry, ext);
    const src = resolve(MEALS_DIR, entry);
    if (!statSync(src).isFile()) continue;
    const webp = resolve(MEALS_DIR, `${stem}.webp`);
    const avif = resolve(MEALS_DIR, `${stem}.avif`);
    // Resize to a sane menu-card width (max 960 px wide, keeps aspect),
    // then encode. AVIF is slow but tiny; webp is fast and broad.
    const pipeline = sharp(src).resize({ width: 960, withoutEnlargement: true });
    if (!existsSync(webp)) {
      await pipeline.clone().webp({ quality: 82 }).toFile(webp);
    }
    if (!existsSync(avif)) {
      await pipeline.clone().avif({ quality: 60 }).toFile(avif);
    }
    converted++;
  }
  if (converted > 0) console.log(`🍽  Converted ${converted} meal photo(s) to webp + avif`);
}
await convertMealPhotos();

console.log('✅ Image build done');
