// Powered by skill: pwa, security
// Boot script — runs on every page. Hydrates cart, registers service worker.
import { hydrateCart, startCartPersistence } from './cart';

hydrateCart();
startCartPersistence();

// Register the service worker only over secure contexts.
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch(() => {
      // Registration failure is non-fatal.
    });
  });
}
