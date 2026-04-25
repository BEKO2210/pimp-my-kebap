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

// Standard sizes — printed on every variant label so the customer knows what
// they're ordering. Glass bottles (Kronkorken-Mehrweg) are 500 ml, cans 330 ml,
// PET 500 ml, Becher 250 ml, Tetra Pak 200 ml, Capri-Sonne 200 ml.
const SIZE_DOSE = '330 ml';
const SIZE_FLASCHE_GLAS = '500 ml';
const SIZE_BECHER = '250 ml';
const SIZE_PET = '500 ml';
const SIZE_TETRA = '200 ml';
const SIZE_CAPRI = '200 ml';

const softDrink = (id: string, name: string): Drink => ({
  id,
  name,
  category: 'softdrinks',
  variants: [
    { id: `${id}-dose`, label: `Dose ${SIZE_DOSE}`, container: 'dose', priceEur: 2.5, depositEur: PFAND_DOSE },
    { id: `${id}-flasche`, label: `Glasflasche ${SIZE_FLASCHE_GLAS} (Kronkorken)`, container: 'flasche', priceEur: 3.0, depositEur: PFAND_FLASCHE_GLAS },
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
    variants: [{ id: 'ayran-becher', label: `Becher ${SIZE_BECHER}`, container: 'becher', priceEur: 2.0, depositEur: 0 }],
  },
  {
    id: 'kalter-kaffee',
    name: 'Kalter Kaffee (versch. Sorten)',
    category: 'sonstige',
    markings: ['2', 'd'],
    variants: [
      { id: 'kalter-kaffee-flasche', label: `Flasche ${SIZE_BECHER}`, container: 'flasche', priceEur: 2.5, depositEur: 0 },
    ],
  },
  {
    id: 'capri-sonne',
    name: 'Capri Sonne',
    category: 'sonstige',
    variants: [{ id: 'capri-sonne-pouch', label: `Beutel ${SIZE_CAPRI}`, container: 'sonstige', priceEur: 1.5, depositEur: 0 }],
  },
  {
    id: 'wasser',
    name: 'Wasser',
    category: 'wasser',
    variants: [{ id: 'wasser-pet', label: `PET-Flasche ${SIZE_PET}`, container: 'pet', priceEur: 2.0, depositEur: PFAND_PET }],
  },
  {
    id: 'tetra-zitrone',
    name: 'Tetra Zitrone',
    category: 'sonstige',
    variants: [{ id: 'tetra-zitrone-tp', label: `Tetra Pak ${SIZE_TETRA}`, container: 'tetra', priceEur: 2.0, depositEur: 0 }],
  },
  {
    id: 'tetra-kirsch',
    name: 'Tetra Kirsch',
    category: 'sonstige',
    variants: [{ id: 'tetra-kirsch-tp', label: `Tetra Pak ${SIZE_TETRA}`, container: 'tetra', priceEur: 2.0, depositEur: 0 }],
  },
  {
    id: 'tetra-pfirsich',
    name: 'Tetra Pfirsich',
    category: 'sonstige',
    variants: [{ id: 'tetra-pfirsich-tp', label: `Tetra Pak ${SIZE_TETRA}`, container: 'tetra', priceEur: 2.0, depositEur: 0 }],
  },
  {
    id: 'tetra-granatapfel',
    name: 'Tetra Granatapfel',
    category: 'sonstige',
    variants: [{ id: 'tetra-granatapfel-tp', label: `Tetra Pak ${SIZE_TETRA}`, container: 'tetra', priceEur: 2.0, depositEur: 0 }],
  },
  {
    id: 'tetra-wassermelone',
    name: 'Tetra Wassermelone',
    category: 'sonstige',
    variants: [{ id: 'tetra-wassermelone-tp', label: `Tetra Pak ${SIZE_TETRA}`, container: 'tetra', priceEur: 2.0, depositEur: 0 }],
  },
] as const;
