// Powered by skill: security, frontend-design
// Cart state — framework-agnostic via nanostores. Persists to localStorage
// with Zod validation on read, version key, and 24 h TTL.
import { atom, computed } from 'nanostores';
import type {
  CartLine,
  CustomerInfo,
  PersistedCart,
} from './cart-types';
import { CART_TTL_MS } from './cart-types';
import { computeTotals, buildWhatsAppMessage, buildWhatsAppUrl } from './whatsapp';
import { PersistedCartSchema } from './validation';
import { uid } from './format';

const STORAGE_KEY = 'pmk-cart-v1';

const defaultCustomer: CustomerInfo = {
  firstName: '',
  fulfillment: 'abholung',
  pickup: { kind: 'asap' },
};

export const $lines = atom<CartLine[]>([]);
export const $customer = atom<CustomerInfo>(defaultCustomer);
export const $isCartOpen = atom<boolean>(false);

export const $totals = computed([$lines, $customer], (lines, customer) =>
  computeTotals(lines, {
    fulfillment: customer.fulfillment,
    deliveryZoneId: customer.delivery?.zoneId,
  }),
);

export const $itemCount = computed($lines, (lines) =>
  lines.reduce((sum, l) => sum + l.quantity, 0),
);

/** Load cart from localStorage, validating with Zod. Silently resets on error. */
export function hydrateCart(): void {
  if (typeof localStorage === 'undefined') return;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const parsed: unknown = JSON.parse(raw);
    const result = PersistedCartSchema.safeParse(parsed);
    if (!result.success) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    if (result.data.expiresAtMs < Date.now()) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    // Zod's enums for sauces/toppings are widened to string[] via .array(z.string()).
    // Cast at the boundary — runtime correctness is enforced by the strict
    // enums in the configurator and validation schema.
    $lines.set(result.data.lines as unknown as CartLine[]);
    $customer.set(result.data.customer as unknown as CustomerInfo);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

/** Persist current cart to localStorage. */
export function persistCart(): void {
  if (typeof localStorage === 'undefined') return;
  const payload: PersistedCart = {
    version: 1,
    lines: $lines.get(),
    customer: $customer.get(),
    expiresAtMs: Date.now() + CART_TTL_MS,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // QuotaExceeded etc. — non-fatal
  }
}

/** Wire change listeners to auto-persist (call once on app boot). */
export function startCartPersistence(): void {
  $lines.subscribe(() => persistCart());
  $customer.subscribe(() => persistCart());
}

/* ── Mutations ── */

type CartLineDraft =
  | Omit<Extract<CartLine, { kind: 'kebab' }>, 'id'>
  | Omit<Extract<CartLine, { kind: 'menu' }>, 'id'>
  | Omit<Extract<CartLine, { kind: 'drink' }>, 'id'>;

export function addLine(line: CartLineDraft): CartLine {
  const newLine = { ...line, id: uid() } as CartLine;
  $lines.set([...$lines.get(), newLine]);
  return newLine;
}

export function setQuantity(lineId: string, quantity: number): void {
  if (quantity < 1) {
    removeLine(lineId);
    return;
  }
  const next = $lines.get().map((l) =>
    l.id === lineId ? ({ ...l, quantity: Math.min(20, Math.max(1, quantity | 0)) } as CartLine) : l,
  );
  $lines.set(next);
}

export function removeLine(lineId: string): void {
  $lines.set($lines.get().filter((l) => l.id !== lineId));
}

export function clearCart(): void {
  $lines.set([]);
}

export function patchCustomer(patch: Partial<CustomerInfo>): void {
  $customer.set({ ...$customer.get(), ...patch });
}

export function openCart(): void { $isCartOpen.set(true); }
export function closeCart(): void { $isCartOpen.set(false); }
export function toggleCart(): void { $isCartOpen.set(!$isCartOpen.get()); }

/** Returns the current WhatsApp deep-link URL for the cart. */
export function currentWhatsAppUrl(envNumber?: string): string {
  return buildWhatsAppUrl({
    cart: { lines: $lines.get(), customer: $customer.get() },
    whatsappNumberE164NoPlus: envNumber,
  });
}

/** Returns the current WhatsApp message preview text. */
export function currentWhatsAppPreview(): string {
  return buildWhatsAppMessage({
    cart: { lines: $lines.get(), customer: $customer.get() },
  });
}

/* ── WhatsApp throttle (1 send / 5 s) ── */
let lastSendAt = 0;
export function canSendWhatsApp(now = Date.now()): boolean {
  return now - lastSendAt >= 5000;
}
export function recordWhatsAppSend(now = Date.now()): void {
  lastSendAt = now;
}
