// Powered by skill: image-optimization
// Build-time image pipeline. Generates AVIF/WebP variants of the logo, PWA
// icons, favicons, OG image, and SVG menu placeholders.
//
// Skips silently if `sharp` is not installed (lets `npm install` succeed
// before native deps are present).
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const ROOT = resolve(process.cwd());
const LOGO_PNG = resolve(ROOT, 'public/brand/logo.png');
const BRAND_DIR = resolve(ROOT, 'public/brand');
const ICON_DIR = resolve(ROOT, 'public/icons');
const PUBLIC_DIR = resolve(ROOT, 'public');
const PLACEHOLDER_DIR = resolve(ROOT, 'public/images/placeholders');

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

const BRAND_BG = { r: 10, g: 10, b: 10, alpha: 1 };
const logo = sharp(LOGO_PNG);
const meta = await logo.metadata();
console.log(`🖼  Logo: ${meta.width}×${meta.height}`);

// 1. Brand WebP / AVIF variants of the raw logo (transparent)
await sharp(LOGO_PNG)
  .resize({ width: 1024, withoutEnlargement: true })
  .webp({ quality: 88 })
  .toFile(resolve(BRAND_DIR, 'logo.webp'));
await sharp(LOGO_PNG)
  .resize({ width: 1024, withoutEnlargement: true })
  .avif({ quality: 65 })
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

// 5. OG image (1200×630)
{
  const W = 1200, H = 630;
  const logoSize = 360;
  const inner = await sharp(LOGO_PNG)
    .resize({ width: logoSize, height: logoSize, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  const svgText = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
      <text x="50%" y="78%" text-anchor="middle"
            font-family="serif" font-size="46" fill="#d4af37" font-weight="700">
        Create Your Kebap. Pay Your Style.
      </text>
      <text x="50%" y="86%" text-anchor="middle"
            font-family="sans-serif" font-size="22" fill="#f8f3e6" opacity="0.75">
        Marktplatz 18 · 71691 Freiberg am Neckar
      </text>
    </svg>`,
  );
  await sharp({ create: { width: W, height: H, channels: 4, background: BRAND_BG } })
    .composite([
      { input: inner, gravity: 'north', top: 70, left: Math.round((W - logoSize) / 2) },
      { input: svgText, top: 0, left: 0 },
    ])
    .jpeg({ quality: 85 })
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

console.log('✅ Image build done');
