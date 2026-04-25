// Powered by skill: frontend-design
// Configurator base options + pricing constants for the kebab wizard.

export type BaseId = 'kebap_basic' | 'yufka_basic' | 'kebap_box';
export type MeatId = 'rinderhack' | 'haehnchen' | 'rindersteak';

export interface BaseOption {
  id: BaseId;
  name: string;
  shortName: string;
  basePriceEur: number;
  description: string;
}

export interface MeatOption {
  id: MeatId;
  name: string;
  /** Surcharge in EUR (Rindersteak is the only paid upgrade). */
  upchargeEur: number;
}

export const BASES: readonly BaseOption[] = [
  {
    id: 'kebap_basic',
    shortName: 'Kebap Basic',
    name: 'Kebap Basic (im Brot)',
    basePriceEur: 6.5,
    description: '100 g Fleisch + Salat (Kraut, Zwiebel, Tomaten) + 2 Soßen nach Wahl.',
  },
  {
    id: 'yufka_basic',
    shortName: 'Yufka Basic',
    name: 'Yufka Basic',
    basePriceEur: 7.5,
    description: '100 g Fleisch + Salat + 2 Soßen — gerollt im warmen Yufka-Fladen.',
  },
  {
    id: 'kebap_box',
    shortName: 'Kebap Box',
    name: 'Kebap Box',
    basePriceEur: 6.5,
    description: '100 g Fleisch + Salat + 2 Soßen — in der praktischen Box.',
  },
] as const;

export const MEATS: readonly MeatOption[] = [
  { id: 'rinderhack', name: 'Rinderhack', upchargeEur: 0 },
  { id: 'haehnchen', name: 'Hähnchenfleisch', upchargeEur: 0 },
  { id: 'rindersteak', name: 'Rindersteak', upchargeEur: 1.0 },
] as const;

/* ── Pricing constants ── */
export const EXTRA_MEAT_50G_PRICE_EUR = 1.5;
export const SCHMELZKAESE_PRICE_EUR = 1.0;
export const MAX_EXTRA_MEAT = 3;
export const MAX_QUANTITY_PER_LINE = 20;
