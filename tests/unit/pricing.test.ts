import { describe, it, expect } from 'vitest';
import { priceKebab, effectiveMenuPrice, type KebabConfig } from '../../src/lib/pricing';
import { MENU } from '../../src/data/menu';

const baseCfg = (over: Partial<KebabConfig> = {}): KebabConfig => ({
  bread: 'klassisch',
  base: 'kebap_basic',
  meat: 'rinderhack',
  extraMeat50g: 0,
  schmelzkaese: false,
  sauces: [],
  toppings: [],
  ...over,
});

describe('priceKebab', () => {
  it('returns base price 6.50 for plain kebap basic', () => {
    expect(priceKebab(baseCfg()).unitTotal).toBe(6.5);
  });

  it('returns 7.50 for plain yufka basic', () => {
    expect(priceKebab(baseCfg({ base: 'yufka_basic' })).unitTotal).toBe(7.5);
  });

  it('returns 6.50 for plain kebap box', () => {
    expect(priceKebab(baseCfg({ base: 'kebap_box' })).unitTotal).toBe(6.5);
  });

  it('adds 1.00 € for Rindersteak meat choice (only via meat type, no separate flag)', () => {
    expect(priceKebab(baseCfg({ meat: 'rindersteak' })).unitTotal).toBe(7.5);
  });

  it('adds 1.50 € per 50g extra meat regardless of meat choice', () => {
    expect(priceKebab(baseCfg({ extraMeat50g: 1 })).unitTotal).toBe(8.0);
    expect(priceKebab(baseCfg({ meat: 'haehnchen', extraMeat50g: 1 })).unitTotal).toBe(8.0);
    expect(priceKebab(baseCfg({ meat: 'rindersteak', extraMeat50g: 1 })).unitTotal).toBe(9.0);
    expect(priceKebab(baseCfg({ extraMeat50g: 3 })).unitTotal).toBe(11.0);
  });

  it('clamps extra meat above 3 to 3', () => {
    expect(priceKebab(baseCfg({ extraMeat50g: 99 })).unitTotal).toBe(11.0);
  });

  it('adds 1.00 € for Schmelzkäse', () => {
    expect(priceKebab(baseCfg({ schmelzkaese: true })).unitTotal).toBe(7.5);
  });

  it('first 2 sauces are free, additional sauces 0.50 € each', () => {
    expect(priceKebab(baseCfg({ sauces: ['bbq', 'cocktail'] })).unitTotal).toBe(6.5);
    expect(priceKebab(baseCfg({ sauces: ['bbq', 'cocktail', 'mango_avocado'] })).unitTotal).toBe(7.0);
    expect(
      priceKebab(baseCfg({ sauces: ['bbq', 'cocktail', 'mango_avocado', 'leicht_scharf'] })).unitTotal,
    ).toBe(7.5);
  });

  it('each topping costs 0.50 €', () => {
    expect(
      priceKebab(baseCfg({ toppings: ['granatapfel', 'rucola', 'feta'] })).unitTotal,
    ).toBe(8.0);
  });

  it('does not charge for baseIncluded toppings (kraut/zwiebeln/tomaten)', () => {
    // re-checking the salad ingredients must not increase the price
    expect(
      priceKebab(baseCfg({ toppings: ['kraut', 'zwiebeln', 'tomaten'] })).unitTotal,
    ).toBe(6.5);
    // mixed: 2 baseIncluded + 1 chargeable → only +0.50
    expect(
      priceKebab(baseCfg({ toppings: ['kraut', 'zwiebeln', 'rucola'] })).unitTotal,
    ).toBe(7.0);
  });

  it('combines all upgrades correctly', () => {
    const cfg = baseCfg({
      base: 'yufka_basic', // 7.50
      meat: 'rindersteak', // +1.00 (steak base upcharge)
      extraMeat50g: 2, // +3.00
      schmelzkaese: true, // +1.00
      sauces: ['bbq', 'cocktail', 'mango_avocado'], // 1 paid sauce → +0.50
      toppings: ['granatapfel', 'rucola'], // +1.00
    });
    expect(priceKebab(cfg).unitTotal).toBe(14.0);
  });

  it('throws on invalid base or meat', () => {
    expect(() =>
      priceKebab({ ...baseCfg(), base: 'unknown' as never }),
    ).toThrow();
    expect(() =>
      priceKebab({ ...baseCfg(), meat: 'unknown' as never }),
    ).toThrow();
  });
});

describe('effectiveMenuPrice', () => {
  it('returns the regular price on Sunday (no promos run)', () => {
    const pizza = MENU.find((m) => m.id === 'pizza-margherita')!;
    expect(effectiveMenuPrice(pizza, 7)).toBe(8.0);
  });

  it('applies Wednesday pizza promo (9 €)', () => {
    const pizza = MENU.find((m) => m.id === 'pizza-vier-kaese')!;
    // regular 11.00, promo 9.00 on Mi
    expect(effectiveMenuPrice(pizza, 3)).toBe(9.0);
  });

  it('keeps regular price when promo would be higher', () => {
    const cheapPizza = MENU.find((m) => m.id === 'pizza-margherita')!;
    // regular 8.00 < promo 9.00 → keep regular
    expect(effectiveMenuPrice(cheapPizza, 3)).toBe(8.0);
  });

  it('applies Tuesday pide promo (9 €)', () => {
    const pide = MENU.find((m) => m.id === 'pide-kebap')!;
    expect(effectiveMenuPrice(pide, 2)).toBe(9.0);
  });

  it('applies Monday Dönerteller promo (11 €)', () => {
    const teller = MENU.find((m) => m.id === 'doenerteller')!;
    expect(effectiveMenuPrice(teller, 1)).toBe(11.0);
    expect(effectiveMenuPrice(teller, 2)).toBe(13.0);
  });

  it('returns null for items "Auf Anfrage"', () => {
    const onRequest = MENU.find((m) => m.priceEur === null);
    expect(onRequest).toBeDefined();
    expect(effectiveMenuPrice(onRequest!, 3)).toBeNull();
  });
});
