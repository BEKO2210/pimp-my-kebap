import { describe, it, expect } from 'vitest';
import { NotesSchema, sanitizeNotes, PersistedCartSchema } from '../../src/lib/validation';

describe('NotesSchema', () => {
  it('accepts a valid German note', () => {
    expect(() => NotesSchema.parse('Bitte sehr scharf, danke!')).not.toThrow();
    expect(() => NotesSchema.parse('Ohne Zwiebeln, mit Käse')).not.toThrow();
  });

  it('rejects HTML / script attempts', () => {
    expect(() => NotesSchema.parse('<script>alert(1)</script>')).toThrow();
    expect(() => NotesSchema.parse('"><img/onerror=1>')).toThrow();
  });

  it('rejects notes longer than 280 characters', () => {
    const long = 'a'.repeat(281);
    expect(() => NotesSchema.parse(long)).toThrow();
  });

  it('accepts empty string', () => {
    expect(() => NotesSchema.parse('')).not.toThrow();
  });
});

describe('sanitizeNotes', () => {
  it('strips disallowed characters but keeps allowed letters', () => {
    // < > are dropped; letters (and the now-allowed "/") inside the tags stay
    expect(sanitizeNotes('Hi <b>there</b>!')).toBe('Hi bthere/b!');
  });

  it('strips angle brackets, quotes and equals (no tag/attr injection)', () => {
    // < > " = & remain blacklisted, so no HTML tag or attribute can survive.
    expect(sanitizeNotes('"><img/onerror=1>')).toBe('img/onerror1');
  });

  it('keeps umlauts and common order punctuation', () => {
    expect(sanitizeNotes('Süß, scharf? Ja!')).toBe('Süß, scharf? Ja!');
    expect(sanitizeNotes('1/2 scharf (bitte klingeln), Anna\'s Tür')).toBe(
      '1/2 scharf (bitte klingeln), Anna\'s Tür',
    );
  });

  it('clamps to 280 chars', () => {
    expect(sanitizeNotes('x'.repeat(500)).length).toBe(280);
  });
});

describe('PersistedCartSchema', () => {
  it('accepts a valid cart payload', () => {
    const payload = {
      version: 1,
      lines: [
        {
          kind: 'kebab',
          id: 'k1',
          quantity: 1,
          unitPriceEur: 11,
          config: {
            bread: 'klassisch',
            base: 'kebap_basic',
            meat: 'rinderhack',
            extraMeat50g: 0,
            schmelzkaese: false,
            sauces: [],
            toppings: [],
          },
        },
      ],
      customer: { firstName: 'Max', fulfillment: 'abholung', pickup: { kind: 'asap' } },
      expiresAtMs: Date.now() + 3600_000,
    };
    expect(() => PersistedCartSchema.parse(payload)).not.toThrow();
  });

  it('rejects unknown bread variants', () => {
    const payload = {
      version: 1,
      lines: [
        {
          kind: 'kebab',
          id: 'k1',
          quantity: 1,
          unitPriceEur: 11,
          config: {
            bread: 'tortilla',
            base: 'kebap_basic',
            meat: 'rinderhack',
            extraMeat50g: 0,
            schmelzkaese: false,
            sauces: [],
            toppings: [],
          },
        },
      ],
      customer: { firstName: 'Max', fulfillment: 'abholung', pickup: { kind: 'asap' } },
      expiresAtMs: Date.now(),
    };
    expect(() => PersistedCartSchema.parse(payload)).toThrow();
  });

  it('rejects quantity > 20', () => {
    const payload = {
      version: 1,
      lines: [
        {
          kind: 'menu',
          id: 'm1',
          quantity: 99,
          itemId: 'pizza-margherita',
          itemName: 'Pizza',
          category: 'pizza',
          unitPriceEur: 9,
        },
      ],
      customer: { firstName: 'X', fulfillment: 'abholung', pickup: { kind: 'asap' } },
      expiresAtMs: 0,
    };
    expect(() => PersistedCartSchema.parse(payload)).toThrow();
  });

  it('hydrates legacy carts with the removed meatUpgradeSteak field (passthrough)', () => {
    const payload = {
      version: 1,
      lines: [
        {
          kind: 'kebab',
          id: 'k1',
          quantity: 1,
          unitPriceEur: 11,
          config: {
            bread: 'klassisch',
            base: 'kebap_basic',
            meat: 'rinderhack',
            meatUpgradeSteak: true, // legacy field — should be silently ignored
            extraMeat50g: 0,
            schmelzkaese: false,
            sauces: [],
            toppings: [],
          },
        },
      ],
      customer: { firstName: 'Max', fulfillment: 'abholung', pickup: { kind: 'asap' } },
      expiresAtMs: Date.now() + 3600_000,
    };
    expect(() => PersistedCartSchema.parse(payload)).not.toThrow();
  });

  it('rejects wrong version', () => {
    const payload = {
      version: 2,
      lines: [],
      customer: { firstName: '', fulfillment: 'abholung', pickup: { kind: 'asap' } },
      expiresAtMs: 0,
    };
    expect(() => PersistedCartSchema.parse(payload)).toThrow();
  });
});
