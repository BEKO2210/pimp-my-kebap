// Powered by skill: frontend-design
export type BreadId = 'klassisch' | 'sesam' | 'knoblauch' | 'vital';

export interface BreadOption {
  id: BreadId;
  name: string;
  description: string;
  isNew?: boolean;
  image: string;
}

export const BREADS: readonly BreadOption[] = [
  {
    id: 'klassisch',
    name: 'Klassisches Dönerbrot',
    description: 'Das Original. Außen knusprig, innen luftig.',
    image: '/images/placeholders/doener.svg',
  },
  {
    id: 'sesam',
    name: 'Sesambrot',
    description: 'Mit gerösteten Sesamkörnern bestreut.',
    image: '/images/placeholders/doener.svg',
  },
  {
    id: 'knoblauch',
    name: 'Knoblauchbrot',
    description: 'Würzig, frisch gebacken, mit echtem Knoblauch.',
    image: '/images/placeholders/doener.svg',
  },
  {
    id: 'vital',
    name: 'Vitalbrot',
    description: 'Mit verschiedenen Körnern und Saaten.',
    isNew: true,
    image: '/images/placeholders/doener.svg',
  },
] as const;
