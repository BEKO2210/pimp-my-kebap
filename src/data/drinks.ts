// Powered by skill: frontend-design
import type { Markings } from './allergens';

export type DrinkContainer = 'dose' | 'flasche' | 'becher' | 'tetra' | 'pet' | 'sonstige';

export interface DrinkVariant {
  id: string;
  label: string; // e.g. "Dose"
  container: DrinkContainer;
  priceEur: number;
  /** Pfand (deposit) in EUR — listed separately in the cart. */
  depositEur: number;
}

export interface Drink {
  id: string;
  name: string;
  category: 'softdrinks' | 'wasser' | 'sonstige';
  markings?: Markings;
  variants: DrinkVariant[];
}

const PFAND_DOSE = 0.25;
const PFAND_FLASCHE_GLAS = 0.08;
const PFAND_PET = 0.25;

const softDrink = (id: string, name: string): Drink => ({
  id,
  name,
  category: 'softdrinks',
  variants: [
    { id: `${id}-dose`, label: 'Dose', container: 'dose', priceEur: 2.5, depositEur: PFAND_DOSE },
    { id: `${id}-flasche`, label: 'Flasche', container: 'flasche', priceEur: 3.0, depositEur: PFAND_FLASCHE_GLAS },
  ],
});

export const DRINKS: readonly Drink[] = [
  softDrink('cola', 'Cola'),
  softDrink('cola-zero', 'Cola Zero'),
  softDrink('fanta', 'Fanta'),
  softDrink('mezzo-mix', 'Mezzo Mix'),
  softDrink('uludag', 'Uludag'),
  softDrink('exotic', 'Exotic'),
  {
    id: 'ayran',
    name: 'Ayran',
    category: 'sonstige',
    markings: ['d'],
    variants: [{ id: 'ayran-becher', label: 'Becher', container: 'becher', priceEur: 2.0, depositEur: 0 }],
  },
  {
    id: 'kalter-kaffee',
    name: 'Kalter Kaffee (versch. Sorten)',
    category: 'sonstige',
    markings: ['2', 'd'],
    variants: [
      { id: 'kalter-kaffee-flasche', label: 'Flasche', container: 'flasche', priceEur: 2.5, depositEur: 0 },
    ],
  },
  {
    id: 'capri-sonne',
    name: 'Capri Sonne',
    category: 'sonstige',
    variants: [{ id: 'capri-sonne-pouch', label: '200 ml', container: 'sonstige', priceEur: 1.5, depositEur: 0 }],
  },
  {
    id: 'wasser',
    name: 'Wasser',
    category: 'wasser',
    variants: [{ id: 'wasser-pet', label: 'Flasche', container: 'pet', priceEur: 2.0, depositEur: PFAND_PET }],
  },
  {
    id: 'tetra-zitrone',
    name: 'Tetra Zitrone',
    category: 'sonstige',
    variants: [{ id: 'tetra-zitrone-tp', label: 'Tetra Pak', container: 'tetra', priceEur: 2.0, depositEur: 0 }],
  },
  {
    id: 'tetra-kirsch',
    name: 'Tetra Kirsch',
    category: 'sonstige',
    variants: [{ id: 'tetra-kirsch-tp', label: 'Tetra Pak', container: 'tetra', priceEur: 2.0, depositEur: 0 }],
  },
  {
    id: 'tetra-pfirsich',
    name: 'Tetra Pfirsich',
    category: 'sonstige',
    variants: [{ id: 'tetra-pfirsich-tp', label: 'Tetra Pak', container: 'tetra', priceEur: 2.0, depositEur: 0 }],
  },
  {
    id: 'tetra-granatapfel',
    name: 'Tetra Granatapfel',
    category: 'sonstige',
    variants: [{ id: 'tetra-granatapfel-tp', label: 'Tetra Pak', container: 'tetra', priceEur: 2.0, depositEur: 0 }],
  },
  {
    id: 'tetra-wassermelone',
    name: 'Tetra Wassermelone',
    category: 'sonstige',
    variants: [{ id: 'tetra-wassermelone-tp', label: 'Tetra Pak', container: 'tetra', priceEur: 2.0, depositEur: 0 }],
  },
] as const;
