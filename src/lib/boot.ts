// Powered by skill: pwa, security
// Boot script — runs on every page. Hydrates cart, registers service worker,
// wires the global mobile-nav burger toggle.
import { hydrateCart, startCartPersistence } from './cart';
import { withBase, baseUrl } from './url';
import { tryHydrateFromUrl } from './share-cart';
import '../components/header.client.ts';

hydrateCart();
// If the URL carries a #cart=... payload (shared link), it overrides the
// localStorage cart on this navigation only.
tryHydrateFromUrl();
startCartPersistence();

// CSP-safe image fallback: any <img data-fallback="..."> swaps to that URL on
// load error (replaces the inline onerror handler that script-src 'self' would
// block). Uses event capture so it catches the error event from the <img>.
document.addEventListener(
  'error',
  (e) => {
    const t = e.target as HTMLElement | null;
    if (!t || t.tagName !== 'IMG') return;
    const img = t as HTMLImageElement;
    const fallback = img.getAttribute('data-fallback');
    if (!fallback) return;
    if (img.dataset.fallbackApplied === '1') return; // prevent loop
    img.dataset.fallbackApplied = '1';
    img.src = fallback;
  },
  true,
);

// Register the service worker only over secure contexts.
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => {
    void navigator.serviceWorker
      .register(withBase('/sw.js'), { scope: baseUrl() ? baseUrl() + '/' : '/' })
      .catch(() => {
        // Registration failure is non-fatal.
      });
  });
}
