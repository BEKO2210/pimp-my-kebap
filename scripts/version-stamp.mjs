import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const DIST_DIR = 'dist';
const HTML_EXT = '.html';
const OWNED_ASSET_EXT = new Set(['.css', '.js', '.mjs']);

async function walk(dir) {
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

function sha256(input) {
  return createHash('sha256').update(input).digest('hex');
}

function gitShortSha() {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'dev';
  }
}

function versionTag() {
  return gitShortSha();
}

function addVersionToUrl(url, v) {
  if (/^(https?:)?\/\//.test(url) || url.startsWith('data:') || url.startsWith('mailto:') || url.startsWith('#')) return url;
  if (url.includes('v=')) return url;
  const [base, frag] = url.split('#');
  const joiner = base.includes('?') ? '&' : '?';
  return `${base}${joiner}v=${v}${frag ? `#${frag}` : ''}`;
}

function stampHtml(html, v) {
  let out = html;
  out = out.replace(/<meta\s+name=["']app-version["'][^>]*>/i, '');
  out = out.replace(/<meta\s+http-equiv=["']Cache-Control["'][^>]*>/i, '');
  out = out.replace(/<head(.*?)>/i, `<head$1>\n    <meta name="app-version" content="${v}">\n    <meta http-equiv="Cache-Control" content="no-cache">`);

  out = out.replace(/(<link[^>]*href=["'])([^"']+)(["'][^>]*>)/gi, (m, pre, href, post) => {
    const clean = href.split('?')[0];
    if (!OWNED_ASSET_EXT.has(path.extname(clean))) return m;
    return `${pre}${addVersionToUrl(href, v)}${post}`;
  });
  out = out.replace(/(<script[^>]*src=["'])([^"']+)(["'][^>]*>)/gi, (m, pre, src, post) => {
    const clean = src.split('?')[0];
    if (!OWNED_ASSET_EXT.has(path.extname(clean))) return m;
    return `${pre}${addVersionToUrl(src, v)}${post}`;
  });
  return out;
}

async function main() {
  const files = await walk(DIST_DIR);
  const htmlFiles = files.filter((f) => f.endsWith(HTML_EXT));
  const assetFiles = files.filter((f) => /\.(css|js|mjs|png|jpe?g|webp|avif|svg|woff2?)$/i.test(f));
  const menuFile = files.find((f) => f.endsWith(path.join('data', 'menu.json')));

  const assetsHashInput = await Promise.all(assetFiles.sort().map(async (f) => `${f}:${sha256(await fs.readFile(f))}`));
  const assetsHash = sha256(assetsHashInput.join('|'));
  const menuHash = menuFile ? sha256(await fs.readFile(menuFile)) : sha256('missing-menu-json');
  const version = versionTag();
  const builtAt = new Date().toISOString();

  const versionJson = { version, builtAt, menuHash, assetsHash };
  await fs.writeFile(path.join(DIST_DIR, 'version.json'), JSON.stringify(versionJson, null, 2) + '\n', 'utf8');

  for (const file of htmlFiles) {
    const src = await fs.readFile(file, 'utf8');
    await fs.writeFile(file, stampHtml(src, version), 'utf8');
  }

  const swPath = path.join(DIST_DIR, 'sw.js');
  try {
    const sw = await fs.readFile(swPath, 'utf8');
    const patched = sw
      .replaceAll('__APP_VERSION__', version)
      .replaceAll('__VERSION_JSON_URL__', 'version.json');
    await fs.writeFile(swPath, patched, 'utf8');
  } catch {
    // no service worker in dist
  }

  console.log(`Stamped ${htmlFiles.length} HTML files with version ${version}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
