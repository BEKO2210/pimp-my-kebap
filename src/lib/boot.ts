// Powered by skill: pwa, security
// Boot script — runs on every page. Hydrates cart, registers service worker,
// wires the global mobile-nav burger toggle.
import { hydrateCart, startCartPersistence } from './cart';
import { withBase, baseUrl } from './url';
import { tryHydrateFromUrl } from './share-cart';
import { toast } from './toast';
import '../components/header.client.ts';

const SCHEMA_VERSION_KEY = 'pmk:schemaVersion';
const CURRENT_SCHEMA_VERSION = '2';

function enforceSchemaVersion(): void {
  if (typeof localStorage === 'undefined') return;
  const existing = localStorage.getItem(SCHEMA_VERSION_KEY);
  if (!existing) {
    localStorage.setItem(SCHEMA_VERSION_KEY, CURRENT_SCHEMA_VERSION);
    return;
  }
  if (existing !== CURRENT_SCHEMA_VERSION) {
    localStorage.removeItem('pmk-cart-v1');
    localStorage.removeItem('pmk-history-v1');
    localStorage.setItem(SCHEMA_VERSION_KEY, CURRENT_SCHEMA_VERSION);
    toast('App-Update erkannt: Warenkorb wurde zurückgesetzt.', { tone: 'info' });
  }
}

enforceSchemaVersion();
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

function showUpdateToast(reg: ServiceWorkerRegistration): void {
  const hasPrompt = document.getElementById('pmk-update-toast');
  if (hasPrompt) return;
  const wrapper = document.createElement('div');
  wrapper.id = 'pmk-update-toast';
  wrapper.style.cssText = 'position:fixed;right:1rem;bottom:1rem;z-index:9999;background:#161616;color:#fff;padding:.75rem 1rem;border:1px solid #333;border-radius:.5rem;font:500 14px/1.4 system-ui';
  wrapper.innerHTML = 'Neue Version verfügbar. <button type="button" style="margin-left:.5rem;background:#f59e0b;color:#111;border:0;padding:.4rem .6rem;border-radius:.4rem;cursor:pointer">Aktualisieren</button>';
  const button = wrapper.querySelector('button');
  button?.addEventListener('click', () => {
    reg.waiting?.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  });
  document.body.appendChild(wrapper);
}

// Register service worker only in production HTTPS contexts (never localhost).
if (
  'serviceWorker' in navigator &&
  location.protocol === 'https:' &&
  !['localhost', '127.0.0.1'].includes(location.hostname)
) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker
      .register(withBase('/sw.js'), { scope: baseUrl() ? baseUrl() + '/' : '/' })
      .then((reg) => {
        reg.addEventListener('updatefound', () => {
          const next = reg.installing;
          next?.addEventListener('statechange', () => {
            if (next.state === 'installed' && navigator.serviceWorker.controller) showUpdateToast(reg);
          });
        });
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data?.type === 'PMK_UPDATE_AVAILABLE') showUpdateToast(reg);
        });
      })
      .catch(() => {
        // Registration failure is non-fatal.
      });
  });
}
