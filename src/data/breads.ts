// Powered by skill: frontend-design
import type { Markings } from './allergens';

export type BreadId = 'klassisch' | 'sesam' | 'knoblauch' | 'vital';

export interface BreadOption {
  id: BreadId;
  name: string;
  description: string;
  isNew?: boolean;
  image: string;
  /** Allergen-Codes (allergens.ts) — Grundteig: a) Gluten (Weizenmehl). */
  markings: Markings;
}

// Grundrezept laut Betreiber — gilt für jeden Brotteig. Ausdrücklich OHNE
// Milch und ohne Ei. Zusätze einzelner Sorten (Sesam, Saaten) kommen dazu.
export const BREAD_BASE_INGREDIENTS = ['Weizenmehl', 'Wasser', 'Öl', 'Salz'] as const;

export const BREADS: readonly BreadOption[] = [
  {
    id: 'klassisch',
    name: 'Klassisches Dönerbrot',
    description: 'Das Original. Außen knusprig, innen luftig.',
    image: '/images/placeholders/doener.svg',
    markings: ['a'],
  },
  {
    id: 'sesam',
    name: 'Sesambrot',
    description: 'Mit gerösteten Sesamkörnern bestreut.',
    image: '/images/placeholders/doener.svg',
    markings: ['a', 'e'],
  },
  {
    id: 'knoblauch',
    name: 'Knoblauchbrot',
    description: 'Würzig, frisch gebacken, mit echtem Knoblauch.',
    image: '/images/placeholders/doener.svg',
    markings: ['a'],
  },
  {
    // Saaten-Mischung noch beim Betreiber zu erfragen (mögl. Sesam/Lupine).
    id: 'vital',
    name: 'Vitalbrot',
    description: 'Mit verschiedenen Körnern und Saaten.',
    isNew: true,
    image: '/images/placeholders/doener.svg',
    markings: ['a'],
  },
] as const;
