// Powered by skill: frontend-design, security, seo-local
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

const SITE_URL = process.env.PUBLIC_SITE_URL ?? 'https://beko2210.github.io/pimp-my-kebap';
// GitHub Pages serves project pages at <user>.github.io/<repo>/, so we need a
// base path. When PUBLIC_SITE_URL has a path component, mirror it as `base`.
function deriveBase(siteUrl) {
  try {
    const u = new URL(siteUrl);
    const path = u.pathname.replace(/\/+$/, '');
    return path === '' ? '/' : path;
  } catch {
    return '/';
  }
}

export default defineConfig({
  site: SITE_URL,
  base: deriveBase(SITE_URL),
  output: 'static',
  trailingSlash: 'never',
  build: {
    inlineStylesheets: 'auto',
    assets: 'assets',
  },
  vite: {
    plugins: [tailwindcss()],
    build: {
      cssMinify: 'lightningcss',
    },
  },
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover',
  },
  compressHTML: true,
});
