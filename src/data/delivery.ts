// Powered by skill: frontend-design
// Liefergebiete und Liefergebühren laut offiziellem Aushang.
// Lieferung erst ab 20 € Bestellwert. Andere Städte nach Absprache.
// Kostenlose Lieferung für Firmen.

export interface DeliveryZone {
  id: string;
  city: string;
  feeEur: number;
}

export const DELIVERY_ZONES: readonly DeliveryZone[] = [
  { id: 'freiberg', city: 'Freiberg am Neckar', feeEur: 3.0 },
  { id: 'benningen', city: 'Benningen', feeEur: 4.0 },
  { id: 'pleidelsheim', city: 'Pleidelsheim', feeEur: 4.0 },
  { id: 'ingersheim', city: 'Ingersheim', feeEur: 4.0 },
  { id: 'hoheneck', city: 'Hoheneck', feeEur: 4.0 },
] as const;

/** Special "after consultation" zone shown to the user (no fixed fee). */
export const DELIVERY_ZONE_OTHER = {
  id: 'andere',
  city: 'Andere Stadt (nach Absprache)',
  feeEur: null as number | null,
} as const;

export const MIN_DELIVERY_ORDER_EUR = 20.0;

/** Lookup helper. Returns null if id is the "other" placeholder. */
export function findZone(id: string): DeliveryZone | null {
  return DELIVERY_ZONES.find((z) => z.id === id) ?? null;
}
