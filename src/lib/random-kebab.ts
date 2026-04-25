// Powered by skill: frontend-design
// "Surprise Me" — pick a random plausible kebab configuration.

import { BREADS } from '../data/breads';
import { BASES, MEATS } from '../data/configurator';
import { SAUCES } from '../data/sauces';
import { TOPPINGS } from '../data/ingredients';
import type { KebabConfig } from './pricing';

function pick<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)]!;
}

function sample<T>(list: readonly T[], min: number, max: number): T[] {
  const n = Math.min(list.length, min + Math.floor(Math.random() * (max - min + 1)));
  const copy = [...list];
  // Fisher–Yates shuffle, take first n
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy.slice(0, n);
}

export function randomKebab(): KebabConfig {
  const sauces = sample(SAUCES, 2, 3).map((s) => s.id);
  // Toppings: skip the base-included items (kraut/zwiebeln/tomaten)
  const candidates = TOPPINGS.filter((t) => !t.baseIncluded);
  const toppings = sample(candidates, 2, 5).map((t) => t.id);
  return {
    bread: pick(BREADS).id,
    base: pick(BASES).id,
    meat: pick(MEATS).id,
    extraMeat50g: Math.random() < 0.25 ? 1 : 0,
    schmelzkaese: Math.random() < 0.4,
    sauces,
    toppings,
  };
}
