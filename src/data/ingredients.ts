// Powered by skill: frontend-design
// 19 frische Zutaten / Toppings — 4 davon kostenlos in der Basis (Salat,
// Kraut, Zwiebeln, Tomaten), die restlichen 15 kosten 0,50 € pro Auswahl.

export type ToppingId =
  | 'salat'
  | 'jalapenos'
  | 'mais'
  | 'kidneybohnen'
  | 'granatapfel'
  | 'radieschen'
  | 'gurken_eingelegt'
  | 'gurken_frisch'
  | 'feldsalat'
  | 'karotten'
  | 'rucola'
  | 'petersilie'
  | 'spinat'
  | 'ofengemuese'
  | 'feta'
  | 'kraut'
  | 'zwiebeln'
  | 'tomaten'
  | 'oliven';

export interface Topping {
  id: ToppingId;
  name: string;
  spicy?: boolean;
  /** included in the kebap base (not chargeable, displayed for transparency) */
  baseIncluded?: boolean;
}

/** All 19 ingredients. Order is the visual order in the gallery. */
export const TOPPINGS: readonly Topping[] = [
  { id: 'salat', name: 'Salat', baseIncluded: true },
  { id: 'kraut', name: 'Kraut', baseIncluded: true },
  { id: 'zwiebeln', name: 'Zwiebeln', baseIncluded: true },
  { id: 'tomaten', name: 'Tomaten', baseIncluded: true },
  { id: 'gurken_frisch', name: 'Gurken (frisch)' },
  { id: 'gurken_eingelegt', name: 'Gurken (eingelegt)' },
  { id: 'feldsalat', name: 'Feldsalat' },
  { id: 'rucola', name: 'Rucola' },
  { id: 'petersilie', name: 'Petersilie' },
  { id: 'spinat', name: 'Spinat' },
  { id: 'karotten', name: 'Karotten' },
  { id: 'radieschen', name: 'Radieschen' },
  { id: 'mais', name: 'Mais' },
  { id: 'kidneybohnen', name: 'Kidneybohnen' },
  { id: 'granatapfel', name: 'Granatapfel' },
  { id: 'oliven', name: 'Oliven' },
  { id: 'feta', name: 'Feta' },
  { id: 'ofengemuese', name: 'Ofengemüse' },
  { id: 'jalapenos', name: 'Jalapeños', spicy: true },
] as const;

/** Each chosen topping costs this many EUR. */
export const TOPPING_PRICE_EUR = 0.5;
