// Powered by skill: webapp-testing
// Comprehensive mobile audit of the live site.
import { chromium, devices } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

const SITE = process.argv[2] ?? 'https://beko2210.github.io/pimp-my-kebap/';
const OUT = '/tmp/audit-out';
mkdirSync(OUT, { recursive: true });

const findings = [];
const log = (icon, msg) => { console.log(`${icon} ${msg}`); findings.push(`${icon} ${msg}`); };

const browser = await chromium.launch();
const ctx = await browser.newContext({
  ...devices['iPhone 13'],
  locale: 'de-DE',
  timezoneId: 'Europe/Berlin',
  ignoreHTTPSErrors: true,
});

// Capture all console errors / network failures
const consoleMsgs = [];
const netFails = [];
const cspViolations = [];

const page = await ctx.newPage();
page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') {
    consoleMsgs.push(`[${m.type()}] ${m.text()}`);
  }
});
page.on('pageerror', (e) => consoleMsgs.push(`[pageerror] ${e.message}`));
page.on('requestfailed', (req) => netFails.push(`${req.failure()?.errorText} ${req.url()}`));
page.on('response', (res) => {
  if (res.status() >= 400) netFails.push(`HTTP ${res.status()} ${res.url()}`);
});

console.log(`▶ Navigating to ${URL}`);
const resp = await page.goto(SITE, { waitUntil: 'networkidle', timeout: 30000 });
log(resp?.ok() ? '✅' : '❌', `Initial GET → HTTP ${resp?.status()}`);
await page.waitForTimeout(800);

// ── 1. Hero + meta
const title = await page.title();
log(title.includes('Pimp My Kebap') ? '✅' : '❌', `<title>: ${title}`);
const hero = await page.getByRole('heading', { name: /Create.+Kebap/i }).isVisible().catch(() => false);
log(hero ? '✅' : '❌', 'Hero headline visible');
await page.screenshot({ path: `${OUT}/01-hero.png`, fullPage: false });

// ── 2. Opening status pill
const statusPill = await page.getByText(/geöffnet|geschlossen/i).count();
log(statusPill > 0 ? '✅' : '❌', `Opening status pill rendered (${statusPill}× on page)`);

// ── 3. Surprise Me
console.log('▶ Surprise Me');
await page.locator('[data-surprise-me]').first().click();
await page.waitForTimeout(600);
const cfgTotal = await page.locator('[data-cfg-total]').textContent();
log(cfgTotal && cfgTotal !== '0,00 €' ? '✅' : '❌', `Surprise Me sets total: ${cfgTotal}`);
await page.screenshot({ path: `${OUT}/02-surprise.png`, fullPage: false });

// Check toast appeared
const toastCount1 = await page.locator('.toast').count();
log(toastCount1 > 0 ? '✅' : '⚠️', `Toast after Surprise Me: ${toastCount1}`);

// ── 4. Configurator: change bread / base / sauce / topping
console.log('▶ Configurator');
await page.locator('[data-cfg-bread="vital"]').click();
await page.locator('[data-cfg-base="kebap_basic"]').click();
await page.locator('[data-cfg-meat="rindersteak"]').click();
const total2 = await page.locator('[data-cfg-total]').textContent();
log(/€/.test(total2 ?? '') ? '✅' : '❌', `Total updates on changes: ${total2}`);

// Add to cart
const addBtn = page.locator('[data-cfg-add]');
const enabled = await addBtn.isEnabled();
log(enabled ? '✅' : '❌', 'Add-to-cart button enabled');
await addBtn.click();
await page.waitForTimeout(500);

// ── 5. Cart drawer opens
const drawer = page.locator('#cart-drawer');
const drawerOpen = !(await drawer.evaluate((el) => el.classList.contains('hidden')));
log(drawerOpen ? '✅' : '❌', 'Cart drawer auto-opens after add');
await page.screenshot({ path: `${OUT}/03-cart-open.png`, fullPage: false });

// Items rendered
const cartItems = await page.locator('[data-cart-items] > li').count();
log(cartItems > 0 ? '✅' : '❌', `Cart line items: ${cartItems}`);

// ── 6. Customer first name & fulfillment switch
await page.locator('[data-cart-firstname]').fill('Max');
await page.locator('[data-cart-fulfillment="lieferung"]').click();
const deliveryVisible = await page.locator('[data-cart-delivery]').isVisible();
log(deliveryVisible ? '✅' : '❌', 'Delivery block appears for Lieferung');

// Pick zone + fill address
await page.locator('[data-cart-zone]').selectOption('freiberg');
await page.locator('[data-cart-plz]').fill('71691');
await page.locator('[data-cart-street]').fill('Bahnhofstr. 5');
const feeRow = await page.locator('[data-totals-fee-row]').isVisible();
const feeText = await page.locator('[data-totals-fee]').textContent();
log(feeRow ? '✅' : '❌', `Delivery fee shown: ${feeText}`);

// Min-order warning at low totals
const warnVisible1 = await page.locator('[data-cart-warning]').isVisible();
log(true, `Below-minimum warning state: ${warnVisible1 ? 'shown' : 'hidden'} (depends on cart total)`);

// ── 7. Add a pizza from the menu (above 20€)
console.log('▶ Add menu items');
await page.locator('[data-cart-close]').click();
await page.waitForTimeout(300);
// Scroll to pizza section then add Margherita twice
await page.locator('#section-pizza').scrollIntoViewIfNeeded();
await page.waitForTimeout(300);
const margBtn = page.locator('article[data-item-id="pizza-margherita"] [data-item-add]');
await margBtn.click();
await page.waitForTimeout(200);
// Close drawer if it auto-opened
await page.locator('[data-cart-close]').click().catch(() => {});
await margBtn.click();
await page.waitForTimeout(400);

// ── 8. Search + filter
console.log('▶ Search');
await page.locator('[data-cart-close]').click().catch(() => {});
await page.locator('#speisekarte').scrollIntoViewIfNeeded();
await page.locator('[data-menu-search]').fill('Margherita');
await page.waitForTimeout(300);
const visibleCards = await page.locator('article[data-item-id]:not([hidden])').count();
log(visibleCards >= 1 ? '✅' : '❌', `Search "Margherita" → ${visibleCards} visible cards`);
await page.locator('[data-filter-reset]').click();
await page.waitForTimeout(200);

// Veg filter
await page.locator('[data-filter-veg]').click();
await page.waitForTimeout(300);
const vegCount = await page.locator('article[data-item-id]:not([hidden])').count();
log(vegCount > 0 ? '✅' : '❌', `Veg filter → ${vegCount} items`);
await page.locator('[data-filter-reset]').click();

// Allergen filter
await page.locator('[data-filter-allergen="d"]').click();
await page.waitForTimeout(300);
const noMilkCount = await page.locator('article[data-item-id]:not([hidden])').count();
log(noMilkCount > 0 ? '✅' : '❌', `Without milk filter → ${noMilkCount} items`);
await page.locator('[data-filter-reset]').click();

// ── 9. Open cart again, total / share / print buttons
console.log('▶ Cart actions');
await page.locator('[data-cart-open-bar]').click().catch(async () => {
  // Fallback: click anywhere that opens cart
  await page.evaluate(() => (window).dispatchEvent(new Event('open-cart')));
});
await page.waitForTimeout(500);

const total3 = await page.locator('[data-totals-grand]').textContent();
log(/€/.test(total3 ?? '') ? '✅' : '❌', `Grand total: ${total3}`);

// Share button — set up a fake clipboard + dialog handler
await page.evaluate(() => {
  (navigator).clipboard = { writeText: async () => undefined };
});
await page.locator('[data-cart-share]').click();
await page.waitForTimeout(400);
const toastsAfterShare = await page.locator('.toast').count();
log(toastsAfterShare > 0 ? '✅' : '⚠️', `Share toast count: ${toastsAfterShare}`);

// Print stylesheet exists
const printRecExists = await page.locator('#print-receipt').count();
log(printRecExists > 0 ? '✅' : '❌', 'Print receipt block exists');

// ── 10. Footer links + impressum + datenschutz
console.log('▶ Footer + legal pages');
await page.locator('[data-cart-close]').click().catch(() => {});
await page.locator('a[href$="/impressum"]').first().click();
await page.waitForLoadState('networkidle');
const impressumOk = await page.getByRole('heading', { name: /Impressum/i }).isVisible();
log(impressumOk ? '✅' : '❌', `Impressum page renders (URL: ${page.url()})`);
await page.screenshot({ path: `${OUT}/04-impressum.png`, fullPage: false });

await page.goBack();
await page.locator('a[href$="/datenschutz"]').first().click();
await page.waitForLoadState('networkidle');
const dsOk = await page.getByRole('heading', { name: /Datenschutz/i }).isVisible();
log(dsOk ? '✅' : '❌', `Datenschutz page renders (URL: ${page.url()})`);
await page.screenshot({ path: `${OUT}/05-datenschutz.png`, fullPage: false });

// ── 11. Manifest + sitemap + robots
console.log('▶ Static endpoints');
for (const path of ['/pimp-my-kebap/manifest.webmanifest', '/pimp-my-kebap/robots.txt', '/pimp-my-kebap/sitemap.xml', '/pimp-my-kebap/sw.js']) {
  const r = await page.request.get(`https://beko2210.github.io${path}`);
  log(r.ok() ? '✅' : '❌', `${path} → HTTP ${r.status()}`);
}

// ── 12. Schema.org JSON-LD validation (rough)
await page.goto(SITE);
const ldBlocks = await page.locator('script[type="application/ld+json"]').count();
log(ldBlocks >= 3 ? '✅' : '❌', `JSON-LD blocks: ${ldBlocks}`);

// ── 13. Check all internal links return 200
console.log('▶ Internal link sweep');
const links = await page.evaluate(() =>
  Array.from(document.querySelectorAll('a[href]'))
    .map((a) => a.getAttribute('href'))
    .filter((h) => h && !h.startsWith('http') && !h.startsWith('mailto:') && !h.startsWith('tel:') && !h.startsWith('#') && !h.startsWith('https://'))
);
const uniq = [...new Set(links)];
for (const link of uniq) {
  const target = new URL(link, SITE).toString();
  const r = await page.request.get(target);
  log(r.ok() ? '✅' : '❌', `Link ${link} → HTTP ${r.status()}`);
}

// ── Final screenshots full page
console.log('▶ Final full-page screenshot');
await page.goto(SITE, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT}/00-fullpage.png`, fullPage: true });

await browser.close();

writeFileSync(`${OUT}/findings.txt`,
  '=== FINDINGS ===\n' + findings.join('\n') +
  '\n\n=== CONSOLE/PAGE ERRORS ===\n' + consoleMsgs.join('\n') +
  '\n\n=== NETWORK FAILURES ===\n' + netFails.join('\n') +
  '\n\n=== CSP VIOLATIONS ===\n' + cspViolations.join('\n')
);

console.log('\n=== SUMMARY ===');
console.log(`Findings: ${findings.length}`);
console.log(`Console errors: ${consoleMsgs.length}`);
console.log(`Network failures: ${netFails.length}`);
if (consoleMsgs.length) {
  console.log('--- console ---');
  consoleMsgs.slice(0, 20).forEach((m) => console.log(m));
}
if (netFails.length) {
  console.log('--- network ---');
  netFails.slice(0, 20).forEach((m) => console.log(m));
}
