// Powered by skill: frontend-design, seo-local
// Komplette Speisekarte. Single source of truth for every menu section
// EXCEPT the configurator (see breads/sauces/ingredients/configurator data)
// and drinks (see drinks.ts).
//
// Prices in EUR. `priceEur === null` means "Auf Anfrage".

import type { Markings } from './allergens';

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
}

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
  },
];

/* ─────────── Schülerangebote (Mo–Fr bis 16:00) ─────────── */
const schueler: MenuItem[] = [
  { id: 'schueler-box', category: 'schueler', name: 'Schüler-Box', description: 'Pommes/Reis/Salat.', priceEur: 6.0, schoolHoursOnly: true },
  { id: 'schueler-yufka', category: 'schueler', name: 'Schüler-Yufka', priceEur: 7.0, schoolHoursOnly: true },
  { id: 'schueler-fladen', category: 'schueler', name: 'Schüler-Döner (Fladenbrot)', priceEur: 6.0, schoolHoursOnly: true, tag: 'aktion' },
  { id: 'schueler-pizza', category: 'schueler', name: 'Schülerpizza (1 Zutat)', priceEur: 5.0, schoolHoursOnly: true },
  { id: 'schueler-pommes', category: 'schueler', name: 'Schüler-Pommes', priceEur: 4.0, schoolHoursOnly: true },
  { id: 'schueler-doener', category: 'schueler', name: 'Schüler-Döner', description: 'Perfekt für Schüler.', priceEur: 6.0, schoolHoursOnly: true, tag: 'aktion' },
];

/* ─────────── Lahmacun ─────────── */
const lahmacun: MenuItem[] = [
  { id: 'lahmacun-pur', category: 'lahmacun', name: 'Lahmacun pur', priceEur: 6.0, markings: ['3', '4', 'a', 'b', 'd'] },
  { id: 'lahmacun-salat', category: 'lahmacun', name: 'Lahmacun mit Salat', priceEur: 8.0, markings: ['3', '4', 'a', 'b', 'd'] },
  { id: 'lahmacun-fleisch-salat', category: 'lahmacun', name: 'Lahmacun mit Fleisch & Salat', priceEur: 9.5, markings: ['3', '4', 'a', 'b', 'd'] },
  { id: 'lahmacun-teller', category: 'lahmacun', name: 'Lahmacun-Teller', priceEur: 13.0, markings: ['3', '4', 'a', 'b', 'd'] },
];

/* ─────────── Salate ─────────── */
const salate: MenuItem[] = [
  { id: 'salat-gemischt', category: 'salate', name: 'Gemischter Salat', priceEur: 5.5, markings: ['c'] },
  { id: 'salat-weichkaese-oliven', category: 'salate', name: 'Salat mit Weichkäse & Oliven', priceEur: 8.0, markings: ['d'] },
  { id: 'salat-thunfisch', category: 'salate', name: 'Thunfischsalat', priceEur: 9.0, markings: ['c'] },
];

/* ─────────── Vegetarisch ─────────── */
const vegetarisch: MenuItem[] = [
  { id: 'veg-fladen', category: 'vegetarisch', name: 'Fladenbrot mit Salat & Weichkäse', priceEur: 7.0, markings: ['a', 'b', 'd'], tag: 'vegetarisch' },
  { id: 'veg-yufka', category: 'vegetarisch', name: 'Yufka mit Salat & Weichkäse', priceEur: 8.0, markings: ['a', 'd'], tag: 'vegetarisch' },
  { id: 'veg-reisbox', category: 'vegetarisch', name: 'Reisbox mit Soße', priceEur: 6.0, markings: ['d'], tag: 'vegetarisch' },
  { id: 'halloumi-brot', category: 'vegetarisch', name: 'Halloumi im Brot', priceEur: 8.0, markings: ['a', 'd'], tag: 'vegetarisch' },
  { id: 'halloumi-yufka', category: 'vegetarisch', name: 'Halloumi Yufka', priceEur: 9.0, markings: ['a', 'd'], tag: 'vegetarisch' },
  { id: 'halloumi-box', category: 'vegetarisch', name: 'Halloumi Box', priceEur: 8.0, markings: ['d'], tag: 'vegetarisch' },
  { id: 'halloumi-teller', category: 'vegetarisch', name: 'Halloumi Teller', priceEur: 13.0, markings: ['d'], tag: 'vegetarisch' },
  { id: 'halloumi-6', category: 'vegetarisch', name: 'Halloumi 6 Stück', priceEur: 5.5, markings: ['d'], tag: 'vegetarisch' },
  { id: 'halloumi-12', category: 'vegetarisch', name: 'Halloumi 12 Stück', priceEur: 9.0, markings: ['d'], tag: 'vegetarisch' },
  { id: 'falafel-brot', category: 'vegetarisch', name: 'Falafel im Brot', priceEur: 8.0, markings: ['a', 'b', 'd', 'e', 'f', 'g'], tag: 'vegetarisch' },
  { id: 'falafel-yufka', category: 'vegetarisch', name: 'Falafel Yufka', priceEur: 9.0, markings: ['a', 'b', 'd', 'e', 'f', 'g'], tag: 'vegetarisch' },
  { id: 'falafel-box', category: 'vegetarisch', name: 'Falafel Box', priceEur: 8.0, markings: ['a', 'b', 'd', 'e', 'f', 'g'], tag: 'vegetarisch' },
  { id: 'falafel-teller', category: 'vegetarisch', name: 'Falafel Teller', priceEur: 13.0, markings: ['a', 'b', 'd', 'e', 'f', 'g'], tag: 'vegetarisch' },
  { id: 'falafel-6', category: 'vegetarisch', name: 'Falafel 6 Stück', priceEur: 5.5, markings: ['a', 'b', 'd', 'e', 'f', 'g'], tag: 'vegetarisch' },
  { id: 'falafel-12', category: 'vegetarisch', name: 'Falafel 12 Stück', priceEur: 9.0, markings: ['a', 'b', 'd', 'e', 'f', 'g'], tag: 'vegetarisch' },
];

/* ─────────── Chicken Nuggets & Pommes ─────────── */
const nuggets: MenuItem[] = [
  { id: 'nuggets-pommes', category: 'nuggets', name: 'Pommes', priceEur: 5.0 },
  { id: 'nuggets-5er-box', category: 'nuggets', name: '5er Nuggets-Box', description: 'Pommes/Salat/Reis.', priceEur: 8.0, markings: ['a', 'f'] },
  { id: 'nuggets-teller-8', category: 'nuggets', name: 'Nuggets-Teller (8 St., 2 Beilagen)', priceEur: 13.0, markings: ['a', 'f'] },
  { id: 'nuggets-6', category: 'nuggets', name: 'Nuggets 6 Stück', priceEur: 5.5, markings: ['a', 'f'] },
  { id: 'nuggets-12', category: 'nuggets', name: 'Nuggets 12 Stück', priceEur: 9.0, markings: ['a', 'f'] },
];

/* ─────────── Pizza (Mi: jede Pizza 9 €) ─────────── */
const PIZZA_MI = { 3: 9.0 } as const;
const pizza: MenuItem[] = [
  // Every pizza shares the same base: flour (a) + yeast (b) + cheese (d).
  // Toppings add fish (c), preservative (4), additives 2/6 etc.
  { id: 'pizzabrot', category: 'pizza', name: 'Pizzabrot', priceEur: 7.0, markings: ['a', 'b', 'd'] },
  { id: 'pizza-margherita', category: 'pizza', name: 'Margherita', priceEur: 8.0, markings: ['4', 'a', 'b', 'd'], tag: 'vegetarisch', promoPriceMap: PIZZA_MI },
  { id: 'pizza-salami', category: 'pizza', name: 'Salami', priceEur: 9.0, markings: ['4', 'a', 'b', 'd'], promoPriceMap: PIZZA_MI },
  { id: 'pizza-schinken', category: 'pizza', name: 'Schinken', priceEur: 9.0, markings: ['4', 'a', 'b', 'd'], promoPriceMap: PIZZA_MI },
  { id: 'pizza-funghi', category: 'pizza', name: 'Funghi', priceEur: 9.0, markings: ['4', 'a', 'b', 'd'], tag: 'vegetarisch', promoPriceMap: PIZZA_MI },
  { id: 'pizza-broccoli', category: 'pizza', name: 'Broccoli', priceEur: 9.0, markings: ['a', 'b', 'd'], tag: 'vegetarisch', promoPriceMap: PIZZA_MI },
  { id: 'pizza-prosciutto', category: 'pizza', name: 'Prosciutto', description: 'Salami + Schinken.', priceEur: 10.0, markings: ['4', 'a', 'b', 'd'], promoPriceMap: PIZZA_MI },
  { id: 'pizza-sucuk', category: 'pizza', name: 'Sucuk', priceEur: 10.0, markings: ['3', '4', '6', 'a', 'b', 'd'], promoPriceMap: PIZZA_MI },
  { id: 'pizza-hackfleisch', category: 'pizza', name: 'Hackfleisch-Drehspieß', priceEur: 10.0, markings: ['2', '4', '6', 'a', 'b', 'd'], promoPriceMap: PIZZA_MI },
  { id: 'pizza-haehnchen', category: 'pizza', name: 'Hähnchen-Drehspieß', priceEur: 10.0, markings: ['2', '4', '6', 'a', 'b', 'd'], promoPriceMap: PIZZA_MI },
  { id: 'pizza-hawaii', category: 'pizza', name: 'Hawaii', description: 'Schinken + Ananas.', priceEur: 10.0, markings: ['4', 'a', 'b', 'd'], promoPriceMap: PIZZA_MI },
  { id: 'pizza-artischocken', category: 'pizza', name: 'Artischocken', priceEur: 9.0, markings: ['a', 'b', 'd'], tag: 'vegetarisch', promoPriceMap: PIZZA_MI },
  { id: 'pizza-zentrum', category: 'pizza', name: 'Pizza Zentrum', description: 'Salami, Schinken, Pilze.', priceEur: 10.5, markings: ['4', 'a', 'b', 'd'], promoPriceMap: PIZZA_MI },
  { id: 'pizza-thunfisch', category: 'pizza', name: 'Thunfisch', priceEur: 9.0, markings: ['a', 'b', 'c', 'd'], promoPriceMap: PIZZA_MI },
  { id: 'pizza-thunfisch-zwiebel', category: 'pizza', name: 'Thunfisch Zwiebel', priceEur: 9.5, markings: ['a', 'b', 'c', 'd'], promoPriceMap: PIZZA_MI },
  { id: 'pizza-gemischt', category: 'pizza', name: 'Gemischt', description: 'Salami, Schinken, Peperoni, Paprika.', priceEur: 11.0, markings: ['4', 'a', 'b', 'd'], promoPriceMap: PIZZA_MI },
  { id: 'pizza-vier-jahreszeiten', category: 'pizza', name: 'Vier Jahreszeiten', description: 'Salami, Schinken, Paprika, Champignons.', priceEur: 11.0, markings: ['4', 'a', 'b', 'd'], promoPriceMap: PIZZA_MI },
  { id: 'pizza-meeresfruechte', category: 'pizza', name: 'Meeresfrüchte', priceEur: 9.0, markings: ['a', 'b', 'c', 'd'], promoPriceMap: PIZZA_MI },
  { id: 'pizza-vegetarisch', category: 'pizza', name: 'Pizza Vegetarisch', description: 'Spinat, Paprika, Oliven, Pilze, Peperoni.', priceEur: 11.0, markings: ['4', 'a', 'b', 'd'], tag: 'vegetarisch', promoPriceMap: PIZZA_MI },
  { id: 'pizza-vier-kaese', category: 'pizza', name: 'Vier Käse', description: 'Edamer, Mozzarella, Weichkäse, Gorgonzola.', priceEur: 11.0, markings: ['a', 'b', 'd'], tag: 'vegetarisch', promoPriceMap: PIZZA_MI },
];

/* ─────────── Pide (Di: 9 €) ─────────── */
const PIDE_DI = { 2: 9.0 } as const;
const pide: MenuItem[] = [
  { id: 'pide-weichkaese', category: 'pide', name: 'Pide Weichkäse', priceEur: 8.5, markings: ['1', '4', 'a', 'b', 'd'], tag: 'vegetarisch', promoPriceMap: PIDE_DI },
  { id: 'pide-hackfleisch', category: 'pide', name: 'Pide Hackfleisch', priceEur: 9.5, markings: ['3', '6', 'a', 'b', 'd'], promoPriceMap: PIDE_DI },
  { id: 'pide-hack-kaese', category: 'pide', name: 'Pide Hackfleisch + Weichkäse', priceEur: 10.0, markings: ['3', '6', 'a', 'b', 'd'], promoPriceMap: PIDE_DI },
  { id: 'pide-kebap', category: 'pide', name: 'Pide Kebap', priceEur: 11.0, markings: ['3', '6', 'a', 'b', 'd'], promoPriceMap: PIDE_DI },
  { id: 'pide-sucuk', category: 'pide', name: 'Pide Sucuk', priceEur: 11.0, markings: ['3', '6', 'a', 'b', 'd'], promoPriceMap: PIDE_DI },
  { id: 'pide-spinat-kaese', category: 'pide', name: 'Pide Spinat & Weichkäse', priceEur: 9.0, markings: ['1', '4', 'a', 'b', 'd'], tag: 'vegetarisch', promoPriceMap: PIDE_DI },
  { id: 'pide-spinat-kaese-ei', category: 'pide', name: 'Pide Spinat, Weichkäse, Ei', priceEur: 10.0, markings: ['1', '4', 'a', 'b', 'd', 'f'], tag: 'vegetarisch', promoPriceMap: PIDE_DI },
  { id: 'pide-sucuk-ei', category: 'pide', name: 'Pide Sucuk + Ei', priceEur: 12.0, markings: ['3', '6', 'a', 'b', 'd', 'f'], promoPriceMap: PIDE_DI },
  { id: 'pide-vegetarisch', category: 'pide', name: 'Pide Vegetarisch', description: 'Spinat, Käse, Paprika, Pilz, Ei.', priceEur: 11.0, markings: ['a', 'b', 'd', 'f'], tag: 'vegetarisch', promoPriceMap: PIDE_DI },
];

/* ─────────── Seele (Sa: Spezial) ─────────── */
const seele: MenuItem[] = [
  { id: 'seele-weichkaese', category: 'seele', name: 'Seele Weichkäse', priceEur: 9.0, markings: ['1', '4', 'a', 'b', 'd'], tag: 'vegetarisch' },
  { id: 'seele-spinat-kaese', category: 'seele', name: 'Seele Spinat & Weichkäse', priceEur: 10.0, markings: ['1', '4', 'a', 'b', 'd'], tag: 'vegetarisch' },
  { id: 'seele-spinat-kaese-ei', category: 'seele', name: 'Seele Spinat, Weichkäse, Ei', priceEur: 10.0, markings: ['1', '4', 'a', 'b', 'd', 'f'], tag: 'vegetarisch' },
  { id: 'seele-kebap-tomaten-zwiebel', category: 'seele', name: 'Seele Kebap, Tomaten & Zwiebel', priceEur: 12.0, markings: ['3', '6', 'a', 'b', 'd'] },
];

/* ─────────── Burger Kebap ─────────── */
const burger_kebap: MenuItem[] = [
  { id: 'burger-standard', category: 'burger_kebap', name: 'Burger Kebap', priceEur: 4.0, markings: ['3', '6', 'a', 'b'] },
  { id: 'burger-cheese', category: 'burger_kebap', name: 'Cheeseburger Kebap', priceEur: 5.0, markings: ['3', '6', 'a', 'b', 'd'] },
  { id: 'burger-chili-cheese', category: 'burger_kebap', name: 'Chili-Cheeseburger Kebap', priceEur: 6.0, markings: ['3', '6', 'a', 'b', 'd'], tag: 'scharf' },
  { id: 'burger-falafel', category: 'burger_kebap', name: 'Falafel-Burger', priceEur: 5.0, markings: ['a', 'b', 'e', 'f', 'g'], tag: 'vegetarisch' },
  { id: 'burger-falafel-cheese', category: 'burger_kebap', name: 'Falafel-Burger mit Cheese', priceEur: 6.0, markings: ['a', 'b', 'd', 'e', 'f', 'g'], tag: 'vegetarisch' },
  { id: 'burger-nuggets', category: 'burger_kebap', name: 'Chicken-Nuggets-Burger', priceEur: 5.0, markings: ['a', 'b', 'f'] },
  { id: 'burger-nuggets-cheese', category: 'burger_kebap', name: 'Chicken-Nuggets-Burger mit Cheese', priceEur: 6.0, markings: ['a', 'b', 'd', 'f'] },
  { id: 'chili-cheese-pommes-burger', category: 'burger_kebap', name: 'Chili Cheese (Pommes/Schmelzkäse/Jalapeños)', priceEur: 6.5, markings: ['a', 'b', 'd'], tag: 'scharf' },
];

/* ─────────── Pommes Highlights ─────────── */
const pommes: MenuItem[] = [
  { id: 'chili-cheese-pommes', category: 'pommes', name: 'Chili Cheese Pommes', priceEur: null, tag: 'scharf' },
  { id: 'chili-cheese-pommes-sucuk', category: 'pommes', name: 'Chili Cheese Pommes Sucuk', priceEur: null, tag: 'neu' },
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
