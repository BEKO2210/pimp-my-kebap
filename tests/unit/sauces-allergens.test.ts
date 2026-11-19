// Allergen-Kennzeichnung der Soßen & Dips (laut Betreiber: ALLE Soßen
// enthalten Mayonnaise → Eier, einzige Ausnahme Naturjoghurt) sowie die
// Sortiments-Invariante "kein Grillgemüse/Ofengemüse mehr".

import { describe, it, expect } from 'vitest';
import { SAUCES } from '../../src/data/sauces';
import { TOPPINGS } from '../../src/data/ingredients';
import { ALLERGENS, ADDITIVES } from '../../src/data/allergens';
import { MENU } from '../../src/data/menu';

const OHNE_MAYO = 'naturjoghurt';

describe('Soßen-Allergene', () => {
  it('jede Soße trägt eine Allergen-Kennzeichnung (keine pauschal "allergenfrei")', () => {
    for (const s of SAUCES) {
      expect(s.markings, s.id).toBeDefined();
      expect(s.markings!.length, s.id).toBeGreaterThan(0);
    }
  });

  it('Naturjoghurt (ohne Mayo) trägt Milch (d), aber kein Ei', () => {
    const s = SAUCES.find((x) => x.id === OHNE_MAYO)!;
    expect(s.markings).toContain('d');
    expect(s.markings).not.toContain('f');
  });

  it('alle übrigen Soßen enthalten Mayonnaise und sind mit Eiern (f) gekennzeichnet', () => {
    for (const s of SAUCES.filter((x) => x.id !== OHNE_MAYO)) {
      expect(s.markings, s.id).toContain('f');
    }
  });

  it('Kräuter-Knoblauch-Joghurt trägt Milch (d) UND Ei (f)', () => {
    const s = SAUCES.find((x) => x.id === 'kraeuter_knoblauch')!;
    expect(s.markings).toEqual(expect.arrayContaining(['d', 'f']));
  });

  it('alle verwendeten Codes existieren im Allergen-/Zusatzstoff-Katalog', () => {
    const known = new Set([...Object.keys(ALLERGENS), ...Object.keys(ADDITIVES)]);
    for (const s of SAUCES) {
      for (const code of s.markings ?? []) {
        expect(known.has(code), `${s.id}: ${code}`).toBe(true);
      }
    }
  });

  it('Mayo-Dips in den Menü-Optionen tragen das Ei-Kürzel (f)', () => {
    const dips = MENU.flatMap((m) => m.options ?? []).find((o) => o.id === 'dips')!;
    for (const id of ['mayo', 'currymayo']) {
      expect(dips.choices.find((c) => c.id === id)?.markings, id).toContain('f');
    }
  });
});

describe('Sortiment: Grillgemüse/Ofengemüse entfernt', () => {
  it('kein Ofengemüse-Topping mehr, 18 Zutaten insgesamt', () => {
    expect(TOPPINGS.some((t) => t.id === ('ofengemuese' as string))).toBe(false);
    expect(TOPPINGS.some((t) => /gemüse|gemuese/i.test(t.name))).toBe(false);
    expect(TOPPINGS).toHaveLength(18);
  });

  it('kein Menü-Item referenziert Grill- oder Ofengemüse', () => {
    for (const item of MENU) {
      const text = `${item.name} ${item.description ?? ''}`;
      expect(/grillgem|ofengem/i.test(text), item.id).toBe(false);
    }
  });
});
