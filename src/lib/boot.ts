// Powered by skill: pwa, security
// Boot script — runs on every page. Hydrates cart, registers service worker.
import { hydrateCart, startCartPersistence } from './cart';
import { withBase, baseUrl } from './url';

hydrateCart();
startCartPersistence();

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
