// Powered by skill: frontend-design, seo-local
// Komplette Speisekarte. Single source of truth for every menu section
// EXCEPT the configurator (see breads/sauces/ingredients/configurator data)
// and drinks (see drinks.ts).
//
// Prices in EUR. `priceEur === null` means "Auf Anfrage".

import type { Markings } from './allergens';
import { SAUCES } from './sauces';

export type MenuCategory =
  | 'drehspiess'
  | 'schueler'
  | 'lahmacun'
  | 'salate'
  | 'vegetarisch'
  | 'nuggets'
  | 'pizza'
  | 'pide'
  | 'seele'
  | 'burger_kebap'
  | 'pommes';

/** Maps a category to the placeholder asset slug used by the image pipeline. */
export const CATEGORY_TO_PLACEHOLDER: Record<MenuCategory, string> = {
  drehspiess: 'doener',
  schueler: 'doener',
  lahmacun: 'lahmacun',
  salate: 'salat',
  vegetarisch: 'vegetarisch',
  nuggets: 'nuggets',
  pizza: 'pizza',
  pide: 'pide',
  seele: 'seele',
  burger_kebap: 'burger',
  pommes: 'pommes',
};

export const CATEGORY_LABEL: Record<MenuCategory, string> = {
  drehspiess: 'Drehspieß',
  schueler: 'Schülerangebote',
  lahmacun: 'Lahmacun',
  salate: 'Salate',
  vegetarisch: 'Vegetarisch',
  nuggets: 'Chicken Nuggets & Pommes',
  pizza: 'Pizza',
  pide: 'Pide',
  seele: 'Seele',
  burger_kebap: 'Burger Kebap',
  pommes: 'Pommes-Highlights',
};

export interface ItemChoice {
  id: string;
  label: string;
  /** Surcharge added on top of the item's base price (e.g. Steak +1,00 €). */
  priceDeltaEur?: number;
}

export interface ItemOption {
  id: string;
  label: string;
  /** When true, no default is preselected and the customer must pick before
   *  the item can be added. When false, the first choice is the default. */
  required?: boolean;
  /** When true, the customer can pick multiple choices (sauces, dips). The
   *  selected value on the cart line is then an array, not a single string. */
  multi?: boolean;
  choices: ItemChoice[];
}

export interface MenuItem {
  id: string;
  category: MenuCategory;
  name: string;
  description?: string;
  /** EUR; null = "Auf Anfrage" */
  priceEur: number | null;
  markings?: Markings;
  /** Highlight tag, e.g. "NEU" or "Aktion" */
  tag?: 'neu' | 'scharf' | 'vegetarisch' | 'aktion';
  /** Restricts visibility to a specific weekday (1=Mon..6=Sat). Used for school items. */
  schoolHoursOnly?: boolean;
  /** Aktionstag-Override-Preis (used by weeklyOffers logic). */
  promoPriceMap?: Partial<Record<1 | 2 | 3 | 4 | 5 | 6, number>>;
  /** Item-level options (Beilage, Drehspieß, …). When set, ItemCard shows a
   *  "Auswählen" CTA that opens a modal instead of the direct stepper. */
  options?: ItemOption[];
}

/* ─────────── Reusable option definitions ─────────── */
const OPT_BEILAGE: ItemOption = {
  id: 'beilage',
  label: 'Beilage',
  required: true,
  choices: [
    { id: 'pommes', label: 'Pommes' },
    { id: 'reis', label: 'Reis' },
  ],
};

const OPT_SPIESS: ItemOption = {
  id: 'spiess',
  label: 'Drehspieß',
  required: true,
  choices: [
    { id: 'rinderhack', label: 'Hackfleisch Drehspieß' },
    { id: 'haehnchen', label: 'Chicken Kebab' },
    { id: 'rindersteak', label: 'Steak Döner', priceDeltaEur: 1.0 },
  ],
};

const OPT_SPIESS_NO_STEAK: ItemOption = {
  id: 'spiess',
  label: 'Drehspieß',
  required: true,
  choices: [
    { id: 'rinderhack', label: 'Hackfleisch Drehspieß' },
    { id: 'haehnchen', label: 'Chicken Kebab' },
  ],
};

/** All 6 configurator sauces, all free, multi-pick. Used everywhere a sauce
 *  belongs to the dish (Brot/Yufka/Box/Teller/Pizza/Pide/Seele/Burger). */
const OPT_SAUCEN: ItemOption = {
  id: 'saucen',
  label: 'Soßen',
  multi: true,
  choices: SAUCES.map((s) => ({ id: s.id, label: s.name })),
};

/** Lighter dip set for items where the customer just wants something to dip
 *  fries / nuggets in. */
const OPT_DIPS: ItemOption = {
  id: 'dips',
  label: 'Dip',
  multi: true,
  choices: [
    { id: 'ketchup', label: 'Ketchup' },
    { id: 'mayo', label: 'Mayo' },
    { id: 'currymayo', label: 'Curry-Mayo' },
  ],
};

/** Schmelzkäse extra — +1,00 €. Default "ohne" for items that don't already
 *  contain cheese. */
const OPT_SCHMELZKAESE: ItemOption = {
  id: 'schmelzkaese',
  label: 'Schmelzkäse',
  choices: [
    { id: 'nein', label: 'Ohne Schmelzkäse' },
    { id: 'ja', label: 'Mit Schmelzkäse', priceDeltaEur: 1.0 },
  ],
};

/* ─────────── Drehspieß ─────────── */
const drehspiess: MenuItem[] = [
  {
    id: 'doenerteller',
    category: 'drehspiess',
    name: 'Dönerteller',
    description: 'Drehspieß auf Teller mit Salat & Pommes oder Reis.',
    priceEur: 13.0,
    markings: ['3', '6'],
    promoPriceMap: { 1: 11.0 }, // Mo: Dönerteller-Aktion 11 €
    options: [OPT_SPIESS, OPT_BEILAGE, OPT_SAUCEN, OPT_SCHMELZKAESE],
  },
];

/* ─────────── Schülerangebote (Mo–Fr bis 16:00) ─────────── */
const schueler: MenuItem[] = [
  { id: 'schueler-box', category: 'schueler', name: 'Schüler-Box', description: 'Pommes oder Reis, dazu Salat.', priceEur: 6.0, schoolHoursOnly: true, options: [OPT_SPIESS_NO_STEAK, OPT_BEILAGE, OPT_SAUCEN] },
  { id: 'schueler-yufka', category: 'schueler', name: 'Schüler-Yufka', priceEur: 7.0, schoolHoursOnly: true, options: [OPT_SPIESS_NO_STEAK, OPT_SAUCEN] },
  { id: 'schueler-fladen', category: 'schueler', name: 'Schüler-Döner (Fladenbrot)', priceEur: 6.0, schoolHoursOnly: true, tag: 'aktion', options: [OPT_SPIESS_NO_STEAK, OPT_SAUCEN] },
  { id: 'schueler-pizza', category: 'schueler', name: 'Schülerpizza (1 Zutat)', priceEur: 5.0, schoolHoursOnly: true, options: [OPT_SAUCEN] },
  { id: 'schueler-pommes', category: 'schueler', name: 'Schüler-Pommes', priceEur: 4.0, schoolHoursOnly: true, options: [OPT_DIPS] },
  { id: 'schueler-doener', category: 'schueler', name: 'Schüler-Döner', description: 'Perfekt für Schüler.', priceEur: 6.0, schoolHoursOnly: true, tag: 'aktion', options: [OPT_SPIESS_NO_STEAK, OPT_SAUCEN] },
];

/* ─────────── Lahmacun ─────────── */
const lahmacun: MenuItem[] = [
  { id: 'lahmacun-pur', category: 'lahmacun', name: 'Lahmacun pur', priceEur: 6.0, markings: ['3', '4', 'a', 'b', 'd'], options: [OPT_SAUCEN, OPT_SCHMELZKAESE] },
  { id: 'lahmacun-salat', category: 'lahmacun', name: 'Lahmacun mit Salat', priceEur: 8.0, markings: ['3', '4', 'a', 'b', 'd'], options: [OPT_SAUCEN, OPT_SCHMELZKAESE] },
  { id: 'lahmacun-fleisch-salat', category: 'lahmacun', name: 'Lahmacun mit Fleisch & Salat', priceEur: 9.5, markings: ['3', '4', 'a', 'b', 'd'], options: [OPT_SAUCEN, OPT_SCHMELZKAESE] },
  { id: 'lahmacun-teller', category: 'lahmacun', name: 'Lahmacun-Teller', priceEur: 13.0, markings: ['3', '4', 'a', 'b', 'd'], options: [OPT_BEILAGE, OPT_SAUCEN, OPT_SCHMELZKAESE] },
];

/* ─────────── Salate ─────────── */
const salate: MenuItem[] = [
  { id: 'salat-gemischt', category: 'salate', name: 'Gemischter Salat', priceEur: 5.5, markings: ['c'] },
  { id: 'salat-weichkaese-oliven', category: 'salate', name: 'Salat mit Weichkäse & Oliven', priceEur: 8.0, markings: ['d'] },
  { id: 'salat-thunfisch', category: 'salate', name: 'Thunfischsalat', priceEur: 9.0, markings: ['c'] },
];

/* ─────────── Vegetarisch ─────────── */
const vegetarisch: MenuItem[] = [
  { id: 'veg-fladen', category: 'vegetarisch', name: 'Fladenbrot mit Salat & Weichkäse', priceEur: 7.0, markings: ['a', 'b', 'd'], tag: 'vegetarisch', options: [OPT_SAUCEN, OPT_SCHMELZKAESE] },
  { id: 'veg-yufka', category: 'vegetarisch', name: 'Yufka mit Salat & Weichkäse', priceEur: 8.0, markings: ['a', 'd'], tag: 'vegetarisch', options: [OPT_SAUCEN, OPT_SCHMELZKAESE] },
  { id: 'veg-reisbox', category: 'vegetarisch', name: 'Reisbox mit Soße', priceEur: 6.0, markings: ['d'], tag: 'vegetarisch', options: [OPT_SAUCEN, OPT_SCHMELZKAESE] },
  { id: 'halloumi-brot', category: 'vegetarisch', name: 'Halloumi im Brot', priceEur: 8.0, markings: ['a', 'd'], tag: 'vegetarisch', options: [OPT_SAUCEN, OPT_SCHMELZKAESE] },
  { id: 'halloumi-yufka', category: 'vegetarisch', name: 'Halloumi Yufka', priceEur: 9.0, markings: ['a', 'd'], tag: 'vegetarisch', options: [OPT_SAUCEN, OPT_SCHMELZKAESE] },
  { id: 'halloumi-box', category: 'vegetarisch', name: 'Halloumi Box', priceEur: 8.0, markings: ['d'], tag: 'vegetarisch', options: [OPT_SAUCEN, OPT_SCHMELZKAESE] },
  { id: 'halloumi-teller', category: 'vegetarisch', name: 'Halloumi Teller', priceEur: 13.0, markings: ['d'], tag: 'vegetarisch', options: [OPT_BEILAGE, OPT_SAUCEN, OPT_SCHMELZKAESE] },
  { id: 'halloumi-6', category: 'vegetarisch', name: 'Halloumi 6 Stück', priceEur: 5.5, markings: ['d'], tag: 'vegetarisch', options: [OPT_DIPS] },
  { id: 'halloumi-12', category: 'vegetarisch', name: 'Halloumi 12 Stück', priceEur: 9.0, markings: ['d'], tag: 'vegetarisch', options: [OPT_DIPS] },
  { id: 'falafel-brot', category: 'vegetarisch', name: 'Falafel im Brot', priceEur: 8.0, markings: ['a', 'b', 'd', 'e', 'f', 'g'], tag: 'vegetarisch', options: [OPT_SAUCEN, OPT_SCHMELZKAESE] },
  { id: 'falafel-yufka', category: 'vegetarisch', name: 'Falafel Yufka', priceEur: 9.0, markings: ['a', 'b', 'd', 'e', 'f', 'g'], tag: 'vegetarisch', options: [OPT_SAUCEN, OPT_SCHMELZKAESE] },
  { id: 'falafel-box', category: 'vegetarisch', name: 'Falafel Box', priceEur: 8.0, markings: ['a', 'b', 'd', 'e', 'f', 'g'], tag: 'vegetarisch', options: [OPT_SAUCEN, OPT_SCHMELZKAESE] },
  { id: 'falafel-teller', category: 'vegetarisch', name: 'Falafel Teller', priceEur: 13.0, markings: ['a', 'b', 'd', 'e', 'f', 'g'], tag: 'vegetarisch', options: [OPT_BEILAGE, OPT_SAUCEN, OPT_SCHMELZKAESE] },
  { id: 'falafel-6', category: 'vegetarisch', name: 'Falafel 6 Stück', priceEur: 5.5, markings: ['a', 'b', 'd', 'e', 'f', 'g'], tag: 'vegetarisch', options: [OPT_DIPS] },
  { id: 'falafel-12', category: 'vegetarisch', name: 'Falafel 12 Stück', priceEur: 9.0, markings: ['a', 'b', 'd', 'e', 'f', 'g'], tag: 'vegetarisch', options: [OPT_DIPS] },
];

/* ─────────── Chicken Nuggets & Pommes ─────────── */
const nuggets: MenuItem[] = [
  { id: 'nuggets-pommes', category: 'nuggets', name: 'Pommes', priceEur: 5.0, options: [OPT_DIPS, OPT_SCHMELZKAESE] },
  { id: 'nuggets-5er-box', category: 'nuggets', name: '5er Nuggets-Box', description: 'Pommes oder Reis, dazu Salat.', priceEur: 8.0, markings: ['a', 'f'], options: [OPT_BEILAGE, OPT_DIPS, OPT_SCHMELZKAESE] },
  { id: 'nuggets-teller-8', category: 'nuggets', name: 'Nuggets-Teller (8 St.)', description: 'Auf Teller mit Salat & einer Beilage.', priceEur: 13.0, markings: ['a', 'f'], options: [OPT_BEILAGE, OPT_DIPS, OPT_SCHMELZKAESE] },
  { id: 'nuggets-6', category: 'nuggets', name: 'Nuggets 6 Stück', priceEur: 5.5, markings: ['a', 'f'], options: [OPT_DIPS] },
  { id: 'nuggets-12', category: 'nuggets', name: 'Nuggets 12 Stück', priceEur: 9.0, markings: ['a', 'f'], options: [OPT_DIPS] },
];

/* ─────────── Pizza (Mi: jede Pizza 9 €) ─────────── */
const PIZZA_MI = { 3: 9.0 } as const;
const pizza: MenuItem[] = [
  // Every pizza shares the same base: flour (a) + yeast (b) + cheese (d).
  // Toppings add fish (c), preservative (4), additives 2/6 etc.
  { id: 'pizzabrot', category: 'pizza', name: 'Pizzabrot', priceEur: 7.0, markings: ['a', 'b', 'd'], options: [OPT_SAUCEN, OPT_SCHMELZKAESE] },
  { id: 'pizza-margherita', category: 'pizza', name: 'Margherita', priceEur: 8.0, markings: ['4', 'a', 'b', 'd'], tag: 'vegetarisch', promoPriceMap: PIZZA_MI, options: [OPT_SAUCEN, OPT_SCHMELZKAESE] },
  { id: 'pizza-salami', category: 'pizza', name: 'Salami', priceEur: 9.0, markings: ['4', 'a', 'b', 'd'], promoPriceMap: PIZZA_MI, options: [OPT_SAUCEN, OPT_SCHMELZKAESE] },
  { id: 'pizza-schinken', category: 'pizza', name: 'Schinken', priceEur: 9.0, markings: ['4', 'a', 'b', 'd'], promoPriceMap: PIZZA_MI, options: [OPT_SAUCEN, OPT_SCHMELZKAESE] },
  { id: 'pizza-funghi', category: 'pizza', name: 'Funghi', priceEur: 9.0, markings: ['4', 'a', 'b', 'd'], tag: 'vegetarisch', promoPriceMap: PIZZA_MI, options: [OPT_SAUCEN, OPT_SCHMELZKAESE] },
  { id: 'pizza-broccoli', category: 'pizza', name: 'Broccoli', priceEur: 9.0, markings: ['a', 'b', 'd'], tag: 'vegetarisch', promoPriceMap: PIZZA_MI, options: [OPT_SAUCEN, OPT_SCHMELZKAESE] },
  { id: 'pizza-prosciutto', category: 'pizza', name: 'Prosciutto', description: 'Salami + Schinken.', priceEur: 10.0, markings: ['4', 'a', 'b', 'd'], promoPriceMap: PIZZA_MI, options: [OPT_SAUCEN, OPT_SCHMELZKAESE] },
  { id: 'pizza-sucuk', category: 'pizza', name: 'Sucuk', priceEur: 10.0, markings: ['3', '4', '6', 'a', 'b', 'd'], promoPriceMap: PIZZA_MI, options: [OPT_SAUCEN, OPT_SCHMELZKAESE] },
  { id: 'pizza-hackfleisch', category: 'pizza', name: 'Hackfleisch-Drehspieß', priceEur: 10.0, markings: ['2', '4', '6', 'a', 'b', 'd'], promoPriceMap: PIZZA_MI, options: [OPT_SAUCEN, OPT_SCHMELZKAESE] },
  { id: 'pizza-haehnchen', category: 'pizza', name: 'Hähnchen-Drehspieß', priceEur: 10.0, markings: ['2', '4', '6', 'a', 'b', 'd'], promoPriceMap: PIZZA_MI, options: [OPT_SAUCEN, OPT_SCHMELZKAESE] },
  { id: 'pizza-hawaii', category: 'pizza', name: 'Hawaii', description: 'Schinken + Ananas.', priceEur: 10.0, markings: ['4', 'a', 'b', 'd'], promoPriceMap: PIZZA_MI, options: [OPT_SAUCEN, OPT_SCHMELZKAESE] },
  { id: 'pizza-artischocken', category: 'pizza', name: 'Artischocken', priceEur: 9.0, markings: ['a', 'b', 'd'], tag: 'vegetarisch', promoPriceMap: PIZZA_MI, options: [OPT_SAUCEN, OPT_SCHMELZKAESE] },
  { id: 'pizza-zentrum', category: 'pizza', name: 'Pizza Zentrum', description: 'Salami, Schinken, Pilze.', priceEur: 10.5, markings: ['4', 'a', 'b', 'd'], promoPriceMap: PIZZA_MI, options: [OPT_SAUCEN, OPT_SCHMELZKAESE] },
  { id: 'pizza-thunfisch', category: 'pizza', name: 'Thunfisch', priceEur: 9.0, markings: ['a', 'b', 'c', 'd'], promoPriceMap: PIZZA_MI, options: [OPT_SAUCEN, OPT_SCHMELZKAESE] },
  { id: 'pizza-thunfisch-zwiebel', category: 'pizza', name: 'Thunfisch Zwiebel', priceEur: 9.5, markings: ['a', 'b', 'c', 'd'], promoPriceMap: PIZZA_MI, options: [OPT_SAUCEN, OPT_SCHMELZKAESE] },
  { id: 'pizza-gemischt', category: 'pizza', name: 'Gemischt', description: 'Salami, Schinken, Peperoni, Paprika.', priceEur: 11.0, markings: ['4', 'a', 'b', 'd'], promoPriceMap: PIZZA_MI, options: [OPT_SAUCEN, OPT_SCHMELZKAESE] },
  { id: 'pizza-vier-jahreszeiten', category: 'pizza', name: 'Vier Jahreszeiten', description: 'Salami, Schinken, Paprika, Champignons.', priceEur: 11.0, markings: ['4', 'a', 'b', 'd'], promoPriceMap: PIZZA_MI, options: [OPT_SAUCEN, OPT_SCHMELZKAESE] },
  { id: 'pizza-meeresfruechte', category: 'pizza', name: 'Meeresfrüchte', priceEur: 9.0, markings: ['a', 'b', 'c', 'd'], promoPriceMap: PIZZA_MI, options: [OPT_SAUCEN, OPT_SCHMELZKAESE] },
  { id: 'pizza-vegetarisch', category: 'pizza', name: 'Pizza Vegetarisch', description: 'Spinat, Paprika, Oliven, Pilze, Peperoni.', priceEur: 11.0, markings: ['4', 'a', 'b', 'd'], tag: 'vegetarisch', promoPriceMap: PIZZA_MI, options: [OPT_SAUCEN, OPT_SCHMELZKAESE] },
  { id: 'pizza-vier-kaese', category: 'pizza', name: 'Vier Käse', description: 'Edamer, Mozzarella, Weichkäse, Gorgonzola.', priceEur: 11.0, markings: ['a', 'b', 'd'], tag: 'vegetarisch', promoPriceMap: PIZZA_MI, options: [OPT_SAUCEN] },
];

/* ─────────── Pide (Di: 9 €) ─────────── */
const PIDE_DI = { 2: 9.0 } as const;
const pide: MenuItem[] = [
  { id: 'pide-weichkaese', category: 'pide', name: 'Pide Weichkäse', priceEur: 8.5, markings: ['1', '4', 'a', 'b', 'd'], tag: 'vegetarisch', promoPriceMap: PIDE_DI, options: [OPT_SAUCEN, OPT_SCHMELZKAESE] },
  { id: 'pide-hackfleisch', category: 'pide', name: 'Pide Hackfleisch', priceEur: 9.5, markings: ['3', '6', 'a', 'b', 'd'], promoPriceMap: PIDE_DI, options: [OPT_SAUCEN, OPT_SCHMELZKAESE] },
  { id: 'pide-hack-kaese', category: 'pide', name: 'Pide Hackfleisch + Weichkäse', priceEur: 10.0, markings: ['3', '6', 'a', 'b', 'd'], promoPriceMap: PIDE_DI, options: [OPT_SAUCEN, OPT_SCHMELZKAESE] },
  { id: 'pide-kebap', category: 'pide', name: 'Pide Kebap', priceEur: 11.0, markings: ['3', '6', 'a', 'b', 'd'], promoPriceMap: PIDE_DI, options: [OPT_SAUCEN, OPT_SCHMELZKAESE] },
  { id: 'pide-sucuk', category: 'pide', name: 'Pide Sucuk', priceEur: 11.0, markings: ['3', '6', 'a', 'b', 'd'], promoPriceMap: PIDE_DI, options: [OPT_SAUCEN, OPT_SCHMELZKAESE] },
  { id: 'pide-spinat-kaese', category: 'pide', name: 'Pide Spinat & Weichkäse', priceEur: 9.0, markings: ['1', '4', 'a', 'b', 'd'], tag: 'vegetarisch', promoPriceMap: PIDE_DI, options: [OPT_SAUCEN, OPT_SCHMELZKAESE] },
  { id: 'pide-spinat-kaese-ei', category: 'pide', name: 'Pide Spinat, Weichkäse, Ei', priceEur: 10.0, markings: ['1', '4', 'a', 'b', 'd', 'f'], tag: 'vegetarisch', promoPriceMap: PIDE_DI, options: [OPT_SAUCEN, OPT_SCHMELZKAESE] },
  { id: 'pide-sucuk-ei', category: 'pide', name: 'Pide Sucuk + Ei', priceEur: 12.0, markings: ['3', '6', 'a', 'b', 'd', 'f'], promoPriceMap: PIDE_DI, options: [OPT_SAUCEN, OPT_SCHMELZKAESE] },
  { id: 'pide-vegetarisch', category: 'pide', name: 'Pide Vegetarisch', description: 'Spinat, Käse, Paprika, Pilz, Ei.', priceEur: 11.0, markings: ['a', 'b', 'd', 'f'], tag: 'vegetarisch', promoPriceMap: PIDE_DI, options: [OPT_SAUCEN, OPT_SCHMELZKAESE] },
];

/* ─────────── Seele (Sa: Spezial) ─────────── */
const seele: MenuItem[] = [
  { id: 'seele-weichkaese', category: 'seele', name: 'Seele Weichkäse', priceEur: 9.0, markings: ['1', '4', 'a', 'b', 'd'], tag: 'vegetarisch', options: [OPT_SAUCEN, OPT_SCHMELZKAESE] },
  { id: 'seele-spinat-kaese', category: 'seele', name: 'Seele Spinat & Weichkäse', priceEur: 10.0, markings: ['1', '4', 'a', 'b', 'd'], tag: 'vegetarisch', options: [OPT_SAUCEN, OPT_SCHMELZKAESE] },
  { id: 'seele-spinat-kaese-ei', category: 'seele', name: 'Seele Spinat, Weichkäse, Ei', priceEur: 10.0, markings: ['1', '4', 'a', 'b', 'd', 'f'], tag: 'vegetarisch', options: [OPT_SAUCEN, OPT_SCHMELZKAESE] },
  { id: 'seele-kebap-tomaten-zwiebel', category: 'seele', name: 'Seele Kebap, Tomaten & Zwiebel', priceEur: 12.0, markings: ['3', '6', 'a', 'b', 'd'], options: [OPT_SAUCEN, OPT_SCHMELZKAESE] },
];

/* ─────────── Burger Kebap ─────────── */
const burger_kebap: MenuItem[] = [
  { id: 'burger-standard', category: 'burger_kebap', name: 'Burger Kebap', priceEur: 4.0, markings: ['3', '6', 'a', 'b'], options: [OPT_SAUCEN, OPT_SCHMELZKAESE] },
  { id: 'burger-cheese', category: 'burger_kebap', name: 'Cheeseburger Kebap', priceEur: 5.0, markings: ['3', '6', 'a', 'b', 'd'], options: [OPT_SAUCEN, OPT_SCHMELZKAESE] },
  { id: 'burger-chili-cheese', category: 'burger_kebap', name: 'Chili-Cheeseburger Kebap', priceEur: 6.0, markings: ['3', '6', 'a', 'b', 'd'], tag: 'scharf', options: [OPT_SAUCEN, OPT_SCHMELZKAESE] },
  { id: 'burger-falafel', category: 'burger_kebap', name: 'Falafel-Burger', priceEur: 5.0, markings: ['a', 'b', 'e', 'f', 'g'], tag: 'vegetarisch', options: [OPT_SAUCEN, OPT_SCHMELZKAESE] },
  { id: 'burger-falafel-cheese', category: 'burger_kebap', name: 'Falafel-Burger mit Cheese', priceEur: 6.0, markings: ['a', 'b', 'd', 'e', 'f', 'g'], tag: 'vegetarisch', options: [OPT_SAUCEN, OPT_SCHMELZKAESE] },
  { id: 'burger-nuggets', category: 'burger_kebap', name: 'Chicken-Nuggets-Burger', priceEur: 5.0, markings: ['a', 'b', 'f'], options: [OPT_SAUCEN, OPT_SCHMELZKAESE] },
  { id: 'burger-nuggets-cheese', category: 'burger_kebap', name: 'Chicken-Nuggets-Burger mit Cheese', priceEur: 6.0, markings: ['a', 'b', 'd', 'f'], options: [OPT_SAUCEN, OPT_SCHMELZKAESE] },
  { id: 'chili-cheese-pommes-burger', category: 'burger_kebap', name: 'Chili Cheese (Pommes/Schmelzkäse/Jalapeños)', priceEur: 6.5, markings: ['a', 'b', 'd'], tag: 'scharf', options: [OPT_DIPS] },
];

/* ─────────── Pommes Highlights ─────────── */
const pommes: MenuItem[] = [
  { id: 'chili-cheese-pommes', category: 'pommes', name: 'Chili Cheese Pommes', priceEur: 6.5, markings: ['a', 'b', 'd'], tag: 'scharf', options: [OPT_DIPS] },
  { id: 'chili-cheese-pommes-sucuk', category: 'pommes', name: 'Chili Cheese Pommes Sucuk', priceEur: 8.0, markings: ['3', '6', 'a', 'b', 'd'], tag: 'scharf', options: [OPT_DIPS] },
];

export const MENU: readonly MenuItem[] = [
  ...drehspiess,
  ...schueler,
  ...lahmacun,
  ...salate,
  ...vegetarisch,
  ...nuggets,
  ...pizza,
  ...pide,
  ...seele,
  ...burger_kebap,
  ...pommes,
];

export function itemsByCategory(cat: MenuCategory): MenuItem[] {
  return MENU.filter((m) => m.category === cat);
}

/**
 * Name, wie er im Warenkorb / in der WhatsApp-Bestellung erscheint. Pizza-
 * Sorten heißen auf der Karte nur "Salami"/"Funghi" — ohne den Sektions-
 * Kontext wäre "1x Salami" in der Bestellung nicht als Pizza erkennbar.
 */
export function cartItemName(item: Pick<MenuItem, 'name' | 'category'>): string {
  if (item.category === 'pizza' && !/pizza/i.test(item.name)) return `Pizza ${item.name}`;
  return item.name;
}

export const ALL_CATEGORIES: MenuCategory[] = [
  'drehspiess',
  'schueler',
  'pide',
  'pizza',
  'seele',
  'burger_kebap',
  'vegetarisch',
  'lahmacun',
  'salate',
  'nuggets',
  'pommes',
];
