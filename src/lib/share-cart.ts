// Powered by skill: security
// Encode the cart in the URL hash so customers can share their build with
// a friend ("hier ist meine Bestellung — kannst du das gleich abholen?").
//
// We base64-encode the JSON payload and put it in `#cart=...` so it never hits
// our server (we have no server) and never appears in Referer headers.

import type { CartLine, CustomerInfo } from './cart-types';
import { PersistedCartSchema } from './validation';
import { $lines, $customer } from './cart';
import { toast } from './toast';

const HASH_KEY = 'cart';

function b64encode(s: string): string {
  // UTF-8 safe base64 via TextEncoder (escape/unescape are deprecated)
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  return btoa(bin);
}
function b64decode(s: string): string {
  const bin = atob(s);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export function shareCartUrl(): string {
  const payload = {
    version: 1 as const,
    lines: $lines.get(),
    customer: $customer.get(),
    expiresAtMs: Date.now() + 24 * 60 * 60 * 1000,
  };
  const encoded = b64encode(JSON.stringify(payload));
  const url = new URL(location.href);
  url.hash = `${HASH_KEY}=${encoded}`;
  return url.toString();
}

export async function copyShareCartLink(): Promise<boolean> {
  const url = shareCartUrl();
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      toast('Link kopiert — jetzt teilen!', { tone: 'success' });
      return true;
    }
  } catch {
    /* fallthrough */
  }
  // Fallback: prompt
  prompt('Link zum Teilen:', url);
  return true;
}

/** Reads `#cart=…` from the URL and applies the payload to the stores. */
export function tryHydrateFromUrl(): boolean {
  if (typeof location === 'undefined') return false;
  const hash = location.hash.replace(/^#/, '');
  if (!hash.startsWith(HASH_KEY + '=')) return false;
  try {
    const decoded = b64decode(hash.slice(HASH_KEY.length + 1));
    const parsed = PersistedCartSchema.safeParse(JSON.parse(decoded));
    if (!parsed.success) return false;
    // 24h-TTL durchsetzen — analog hydrateCart(). Ohne diesen Check wuerde ein
    // alter geteilter Link (mit stale Preisen) auch nach Ablauf noch greifen.
    if (parsed.data.expiresAtMs < Date.now()) {
      history.replaceState(null, '', location.pathname + location.search);
      return false;
    }
    $lines.set(parsed.data.lines as unknown as CartLine[]);
    $customer.set(parsed.data.customer as unknown as CustomerInfo);
    // Clean the hash so a refresh doesn't re-apply the same payload
    history.replaceState(null, '', location.pathname + location.search);
    toast('Geteilten Warenkorb übernommen', { tone: 'success' });
    return true;
  } catch {
    return false;
  }
}
