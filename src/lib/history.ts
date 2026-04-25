// Powered by skill: frontend-design, security
// Client-side order history (last 5). Triggered when the user actually sends
// the order via WhatsApp. Never leaves the device.

import type { CartLine, CustomerInfo } from './cart-types';
import { PersistedCartSchema } from './validation';
import { z } from 'zod';

const STORAGE_KEY = 'pmk-history-v1';
const MAX_ENTRIES = 5;

export interface HistoryEntry {
  at: number; // epoch ms
  lines: CartLine[];
  customer: CustomerInfo;
}

const HistorySchema = z.object({
  version: z.literal(1),
  entries: z
    .array(
      z.object({
        at: z.number().int().nonnegative(),
        lines: PersistedCartSchema.shape.lines,
        customer: PersistedCartSchema.shape.customer,
      }),
    )
    .max(MAX_ENTRIES + 5),
});

function read(): HistoryEntry[] {
  if (typeof localStorage === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = HistorySchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return [];
    return parsed.data.entries as unknown as HistoryEntry[];
  } catch {
    return [];
  }
}

function write(entries: HistoryEntry[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, entries: entries.slice(0, MAX_ENTRIES) }),
    );
  } catch {
    /* quota exceeded — non-fatal */
  }
}

export function recordOrder(lines: CartLine[], customer: CustomerInfo): void {
  if (lines.length === 0) return;
  const entries = [{ at: Date.now(), lines, customer }, ...read()];
  write(entries);
}

export function listOrders(): HistoryEntry[] {
  return read();
}

export function clearHistory(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
