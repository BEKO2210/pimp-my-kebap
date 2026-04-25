// Powered by skill: frontend-design
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
}

export const SAUCES: readonly SauceOption[] = [
  { id: 'naturjoghurt', name: 'Naturjoghurt', description: 'Mild, frisch, cremig.' },
  { id: 'kraeuter_knoblauch', name: 'Kräuter-Knoblauch-Joghurt', description: 'Hausspezialität.' },
  { id: 'bbq', name: 'BBQ', description: 'Süß-rauchig.' },
  { id: 'mango_avocado', name: 'Mango-Avocado', description: 'Exotisch, fruchtig.' },
  { id: 'cocktail', name: 'Cocktail', description: 'Klassisch.' },
  { id: 'leicht_scharf', name: 'Leicht Scharf', description: 'Für die kleine Schärfe.', spicy: true },
] as const;

/** First N sauces are included free; further ones cost extra. */
export const FREE_SAUCE_COUNT = 2;
export const EXTRA_SAUCE_PRICE_EUR = 0.5;
