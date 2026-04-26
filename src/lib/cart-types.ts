// Powered by skill: frontend-design
// Cart line item shapes. Pure type definitions — no runtime logic.

import type { KebabConfig } from './pricing';
import type { MenuCategory } from '../data/menu';

export type CartLine =
  | KebabCartLine
  | MenuItemCartLine
  | DrinkCartLine;

export interface KebabCartLine {
  kind: 'kebab';
  id: string;
  quantity: number;
  notes?: string;
  config: KebabConfig;
  /** Snapshot of the unit price at the time of add (recomputed on change). */
  unitPriceEur: number;
}

export interface MenuItemCartLine {
  kind: 'menu';
  id: string;
  quantity: number;
  notes?: string;
  itemId: string;
  itemName: string;
  category: MenuCategory;
  unitPriceEur: number;
  /** Note: a promo override that was active when the line was added. */
  promoApplied?: boolean;
  /** Customer-picked options (Beilage/Spieß/...). Map of option.id → choice.id. */
  selectedOptions?: Record<string, string>;
  /** Human-readable summary of the picked options ("Hackfleisch · Pommes"). */
  optionsLabel?: string;
}

export interface DrinkCartLine {
  kind: 'drink';
  id: string;
  quantity: number;
  drinkId: string;
  drinkName: string;
  variantLabel: string;
  unitPriceEur: number;
  unitDepositEur: number;
}

export type FulfillmentMode = 'abholung' | 'vor-ort' | 'lieferung';
export type PickupTime = { kind: 'asap' } | { kind: 'scheduled'; iso: string };

export interface DeliveryAddress {
  street: string;
  postalCode: string;
  zoneId: string; // matches src/data/delivery.ts
  /** Free-form line for floor / company / hint, optional. */
  notesAddress?: string;
}

export interface CustomerInfo {
  firstName: string;
  fulfillment: FulfillmentMode;
  pickup: PickupTime;
  notes?: string;
  /** Required when fulfillment === 'lieferung'. */
  delivery?: DeliveryAddress;
}

export interface CartTotals {
  itemsSubtotalEur: number;
  depositSubtotalEur: number;
  /** Liefergebühr; 0 for non-delivery orders. null for "andere Stadt nach Absprache". */
  deliveryFeeEur: number | null;
  grandTotalEur: number;
  itemCount: number;
  /** True when fulfillment === 'lieferung' AND items subtotal < min order. */
  belowDeliveryMinimum: boolean;
}

export interface PersistedCart {
  version: 1;
  lines: CartLine[];
  customer: CustomerInfo;
  expiresAtMs: number;
}

export const CART_TTL_MS = 24 * 60 * 60 * 1000;
