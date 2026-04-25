// Powered by skill: pwa
// Generated PWA manifest — keeps icon URLs base-aware.
import { withBase } from '../lib/url';

export const prerender = true;

export function GET() {
  const manifest = {
    name: 'Pimp My Kebap',
    short_name: 'Pimp My Kebap',
    description: 'Döner konfigurieren & per WhatsApp bestellen.',
    start_url: withBase('/?source=pwa'),
    scope: withBase('/'),
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0a0a0a',
    theme_color: '#0a0a0a',
    lang: 'de-DE',
    categories: ['food', 'lifestyle'],
    icons: [
      { src: withBase('/icons/logo-192.png'), sizes: '192x192', type: 'image/png' },
      { src: withBase('/icons/logo-512.png'), sizes: '512x512', type: 'image/png' },
      { src: withBase('/icons/logo-maskable-192.png'), sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: withBase('/icons/logo-maskable-512.png'), sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
  return new Response(JSON.stringify(manifest, null, 2), {
    headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' },
  });
}
