// Powered by skill: seo-local
// LMIV-konforme Allergen- und Zusatzstoff-Codes.
// Single source of truth for allergen lookups in tooltips and footer.

export const ALLERGENS = {
  a: 'Glutenhaltiges Getreide',
  b: 'Hefe',
  c: 'Fische',
  d: 'Milch (Laktose)',
  e: 'Sesam',
  f: 'Eier',
  g: 'Lupinen',
} as const satisfies Record<string, string>;

export const ADDITIVES = {
  '1': 'Farbstoff',
  '2': 'Koffein',
  '3': 'Geschmacksverstärker',
  '4': 'Konservierungsmittel',
  '5': 'Süßungsmittel',
  '6': 'Phosphat',
  '7': 'Geschwärzt',
  '8': 'Antioxidationsmittel',
} as const satisfies Record<string, string>;

export type AllergenCode = keyof typeof ALLERGENS;
export type AdditiveCode = keyof typeof ADDITIVES;

export type Markings = Array<AllergenCode | AdditiveCode>;

export function describeMarkings(codes: Markings): string {
  return codes
    .map((c) => {
      if (c in ALLERGENS) return `${c}) ${ALLERGENS[c as AllergenCode]}`;
      if (c in ADDITIVES) return `${c}) ${ADDITIVES[c as AdditiveCode]}`;
      return c;
    })
    .join(', ');
}
