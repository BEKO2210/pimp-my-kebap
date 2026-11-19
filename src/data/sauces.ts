// Powered by skill: frontend-design
import type { Markings } from './allergens';

export type SauceId =
  | 'naturjoghurt'
  | 'kraeuter_knoblauch'
  | 'bbq'
  | 'mango_avocado'
  | 'cocktail'
  | 'leicht_scharf';

export interface SauceOption {
  id: SauceId;
  name: string;
  description: string;
  spicy?: boolean;
  /** Allergen-Codes (siehe allergens.ts) — angezeigt im Konfigurator & Options-Dialog. */
  markings?: Markings;
}

// Allergen-Kennzeichnung laut Betreiber: ALLE Soßen enthalten Mayonnaise
// (→ Eier, f) — einzige Ausnahme ist die Naturjoghurt-Soße. Joghurt-Anteil
// bedeutet zusätzlich Milch (d); keine Soße gilt als "allergenfrei".
// ACHTUNG: Senf ist im Allergen-Katalog (allergens.ts) nicht erfasst;
// falls die Mayonnaise Senf enthält, muss der Katalog erweitert werden.
export const SAUCES: readonly SauceOption[] = [
  { id: 'naturjoghurt', name: 'Naturjoghurt', description: 'Mild, frisch, cremig.', markings: ['d'] },
  { id: 'kraeuter_knoblauch', name: 'Kräuter-Knoblauch-Joghurt', description: 'Hausspezialität.', markings: ['d', 'f'] },
  { id: 'bbq', name: 'BBQ', description: 'Süß-rauchig.', markings: ['f'] },
  { id: 'mango_avocado', name: 'Mango-Avocado', description: 'Exotisch, fruchtig.', markings: ['f'] },
  { id: 'cocktail', name: 'Cocktail', description: 'Klassisch.', markings: ['f'] },
  { id: 'leicht_scharf', name: 'Leicht Scharf', description: 'Für die kleine Schärfe.', spicy: true, markings: ['f'] },
] as const;

/** First N sauces are included free; further ones cost extra. */
export const FREE_SAUCE_COUNT = 2;
export const EXTRA_SAUCE_PRICE_EUR = 0.5;
