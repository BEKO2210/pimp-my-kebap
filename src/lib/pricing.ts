// Powered by skill: frontend-design
// Pricing engine. Pure functions, fully unit-tested.

import { BASES, MEATS, EXTRA_MEAT_50G_PRICE_EUR, SCHMELZKAESE_PRICE_EUR } from '../data/configurator';
import type { BaseId, MeatId } from '../data/configurator';
import { FREE_SAUCE_COUNT, EXTRA_SAUCE_PRICE_EUR } from '../data/sauces';
import type { SauceId } from '../data/sauces';
import { TOPPING_PRICE_EUR } from '../data/ingredients';
import type { ToppingId } from '../data/ingredients';
import type { BreadId } from '../data/breads';
import type { MenuItem } from '../data/menu';
import { round2 } from './format';

export interface KebabConfig {
  bread: BreadId;
  base: BaseId;
  /** Choosing 'rindersteak' adds +1.00 € to the base price (handled via MEATS). */
  meat: MeatId;
  /** +50 g extra meat, 1.50 € each, regardless of meat choice. 0..3 stacks. */
  extraMeat50g: number;
  schmelzkaese: boolean; // +1.00 €
  sauces: SauceId[]; // first 2 free
  toppings: ToppingId[]; // each +0.50 €
}

export interface KebabPriceBreakdown {
  basePrice: number;
  meatUpcharge: number;
  extraMeat: number;
  schmelzkaese: number;
  extraSauces: number;
  toppings: number;
  unitTotal: number;
}

const NULLISH_CONFIG_PARTS = (cfg: KebabConfig): boolean =>
  !cfg ||
  !BASES.find((b) => b.id === cfg.base) ||
  !MEATS.find((m) => m.id === cfg.meat);

export function priceKebab(cfg: KebabConfig): KebabPriceBreakdown {
  if (NULLISH_CONFIG_PARTS(cfg)) {
    throw new Error(`Invalid configurator state: base=${cfg?.base} meat=${cfg?.meat}`);
  }
  const base = BASES.find((b) => b.id === cfg.base)!;
  const meat = MEATS.find((m) => m.id === cfg.meat)!;

  const meatUpcharge = meat.upchargeEur;
  const extraMeatCount = Math.max(0, Math.min(3, cfg.extraMeat50g | 0));
  const extraMeat = extraMeatCount * EXTRA_MEAT_50G_PRICE_EUR;
  const schmelz = cfg.schmelzkaese ? SCHMELZKAESE_PRICE_EUR : 0;
  const extraSauces =
    Math.max(0, cfg.sauces.length - FREE_SAUCE_COUNT) * EXTRA_SAUCE_PRICE_EUR;
  const toppings = cfg.toppings.length * TOPPING_PRICE_EUR;

  const unitTotal = round2(
    base.basePriceEur + meatUpcharge + extraMeat + schmelz + extraSauces + toppings,
  );
  return {
    basePrice: base.basePriceEur,
    meatUpcharge,
    extraMeat,
    schmelzkaese: schmelz,
    extraSauces,
    toppings,
    unitTotal,
  };
}

/**
 * Resolve the effective price for a `MenuItem` given the active weekday.
 * Returns null if the item has no price (e.g. "Auf Anfrage").
 */
export function effectiveMenuPrice(
  item: MenuItem,
  weekday: 1 | 2 | 3 | 4 | 5 | 6 | 7,
): number | null {
  if (item.priceEur === null) return null;
  if (weekday === 7) return item.priceEur;
  const promo = item.promoPriceMap?.[weekday as 1 | 2 | 3 | 4 | 5 | 6];
  if (typeof promo === 'number') return Math.min(promo, item.priceEur);
  return item.priceEur;
}
