// Powered by skill: image-optimization
// Maps a category to its built-in SVG placeholder asset URL.

import type { MenuCategory } from '../data/menu';
import { CATEGORY_TO_PLACEHOLDER } from '../data/menu';

export function placeholderUrlForCategory(cat: MenuCategory): string {
  const slug = CATEGORY_TO_PLACEHOLDER[cat] ?? 'doener';
  return `/images/placeholders/${slug}.svg`;
}

export function placeholderUrlForDrink(): string {
  return `/images/placeholders/getraenk.svg`;
}
