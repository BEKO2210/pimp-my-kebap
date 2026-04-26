import { describe, it, expect } from 'vitest';
import {
  buildWhatsAppMessage,
  buildWhatsAppUrl,
  computeTotals,
} from '../../src/lib/whatsapp';
import type { CartLine, CustomerInfo } from '../../src/lib/cart-types';

const customer: CustomerInfo = {
  firstName: 'Max',
  fulfillment: 'abholung',
  pickup: { kind: 'asap' },
};

const kebab = (q: number): CartLine => ({
  kind: 'kebab',
  id: 'k1',
  quantity: q,
  unitPriceEur: 11.0,
  config: {
    bread: 'vital',
    base: 'kebap_basic',
    meat: 'rindersteak',
    extraMeat50g: 0,
    schmelzkaese: true,
    sauces: ['kraeuter_knoblauch', 'bbq'],
    toppings: ['granatapfel', 'rucola', 'feta'],
  },
});

const cola = (q: number): CartLine => ({
  kind: 'drink',
  id: 'd1',
  quantity: q,
  drinkId: 'cola',
  drinkName: 'Cola',
  variantLabel: 'Dose',
  unitPriceEur: 2.5,
  unitDepositEur: 0.25,
});

const pizza = (q: number, name = 'Margherita', price = 9.0, promo = true): CartLine => ({
  kind: 'menu',
  id: 'm1',
  quantity: q,
  itemId: 'pizza-margherita',
  itemName: `Pizza ${name}`,
  category: 'pizza',
  unitPriceEur: price,
  promoApplied: promo,
});

describe('computeTotals', () => {
  it('returns zeroes for empty cart', () => {
    const t = computeTotals([]);
    expect(t.itemsSubtotalEur).toBe(0);
    expect(t.depositSubtotalEur).toBe(0);
    expect(t.grandTotalEur).toBe(0);
    expect(t.itemCount).toBe(0);
    expect(t.deliveryFeeEur).toBe(0);
    expect(t.belowDeliveryMinimum).toBe(false);
  });

  it('sums items + deposit correctly', () => {
    const totals = computeTotals([kebab(1), pizza(2), cola(1)]);
    expect(totals.itemsSubtotalEur).toBe(11 + 18 + 2.5); // 31.50
    expect(totals.depositSubtotalEur).toBe(0.25);
    expect(totals.grandTotalEur).toBe(31.75);
    expect(totals.itemCount).toBe(4);
  });

  it('handles deposit-only carts', () => {
    const totals = computeTotals([cola(2)]);
    expect(totals.itemsSubtotalEur).toBe(5);
    expect(totals.depositSubtotalEur).toBe(0.5);
    expect(totals.grandTotalEur).toBe(5.5);
  });

  it('mixes lines from all four sources (Kebap-Konfigurator + Pizza-Konfigurator + Speisekarte + Drink)', () => {
    // Simulates exactly the user flow: build a kebap, build a pizza, add a
    // ready-made menu item from the Speisekarte, plus a drink. Every entry
    // funnels through addLine() with the same shape, so computeTotals must
    // sum them cleanly.
    const fromKebapConfig: CartLine = {
      kind: 'kebab',
      id: 'k-1',
      quantity: 1,
      unitPriceEur: 8.5, // Kebap Basic 6.50 + Schmelzkäse 1.00 + 1 paid sauce 0.50 + 1 topping 0.50 (computed elsewhere)
      config: {
        bread: 'klassisch',
        base: 'kebap_basic',
        meat: 'rinderhack',
        extraMeat50g: 0,
        schmelzkaese: true,
        sauces: ['bbq', 'cocktail', 'mango_avocado'],
        toppings: ['rucola'],
      },
    };
    const fromPizzaConfig: CartLine = {
      kind: 'menu',
      id: 'p-1',
      quantity: 1,
      itemId: 'pimp-pizza-salami-mais',
      itemName: 'Pimp my Pizza · Salami, Mais',
      category: 'pizza',
      unitPriceEur: 10.0, // 8.00 base + 2 standard toppings
    };
    const fromSpeisekarte: CartLine = {
      kind: 'menu',
      id: 'm-1',
      quantity: 1,
      itemId: 'pizza-margherita',
      itemName: 'Margherita',
      category: 'pizza',
      unitPriceEur: 8.0,
    };
    const fromDrinks: CartLine = {
      kind: 'drink',
      id: 'd-1',
      quantity: 2,
      drinkId: 'cola',
      drinkName: 'Cola',
      variantLabel: 'Dose',
      unitPriceEur: 2.5,
      unitDepositEur: 0.25,
    };

    const all = [fromKebapConfig, fromPizzaConfig, fromSpeisekarte, fromDrinks];
    const totals = computeTotals(all);
    expect(totals.itemCount).toBe(5); // 1 + 1 + 1 + 2
    expect(totals.itemsSubtotalEur).toBe(8.5 + 10 + 8 + 5); // 31.50
    expect(totals.depositSubtotalEur).toBe(0.5); // 2 × 0.25
    expect(totals.grandTotalEur).toBe(32);

    // The WhatsApp message must list every source exactly once.
    const msg = buildWhatsAppMessage({ cart: { lines: all, customer } });
    expect(msg).toContain('Kebap Basic'); // kebab line
    expect(msg).toContain('Pimp my Pizza · Salami, Mais'); // pizza-configurator line
    expect(msg).toContain('Margherita'); // speisekarte line
    expect(msg).toContain('Cola'); // drink line
    expect(msg).toContain('GESAMT:');
  });

  it('applies Freiberg delivery fee 3 € when fulfillment=lieferung', () => {
    const totals = computeTotals([kebab(1), pizza(2)], {
      fulfillment: 'lieferung',
      deliveryZoneId: 'freiberg',
    });
    // items: 11 + 18 = 29, deposit 0, fee 3 → 32
    expect(totals.deliveryFeeEur).toBe(3);
    expect(totals.grandTotalEur).toBe(32);
    expect(totals.belowDeliveryMinimum).toBe(false);
  });

  it('applies Benningen 4 € fee', () => {
    const totals = computeTotals([kebab(1), pizza(2)], {
      fulfillment: 'lieferung',
      deliveryZoneId: 'benningen',
    });
    expect(totals.deliveryFeeEur).toBe(4);
  });

  it('flags belowDeliveryMinimum when items < 20 €', () => {
    const totals = computeTotals([kebab(1)], {
      fulfillment: 'lieferung',
      deliveryZoneId: 'freiberg',
    });
    expect(totals.belowDeliveryMinimum).toBe(true);
  });

  it('returns null fee for "andere" zone', () => {
    const totals = computeTotals([kebab(1), pizza(2)], {
      fulfillment: 'lieferung',
      deliveryZoneId: 'andere',
    });
    expect(totals.deliveryFeeEur).toBeNull();
    expect(totals.grandTotalEur).toBe(29); // fee not added when null
  });
});

describe('buildWhatsAppMessage', () => {
  it('contains the header, name, and totals', () => {
    const msg = buildWhatsAppMessage({
      cart: { lines: [kebab(1), pizza(2), cola(1)], customer },
    });
    expect(msg).toContain('PIMP MY KEBAP — Neue Bestellung');
    expect(msg).toContain('Name:    Max');
    expect(msg).toContain('Abholung: ASAP');
    expect(msg).toContain('1x Kebap Basic (Vitalbrot)');
    expect(msg).toContain('Schmelzkäse');
    expect(msg).toContain('Toppings: Granatapfel, Rucola, Feta');
    expect(msg).toContain('Pizza Margherita (Aktion)');
    expect(msg).toContain('Cola (Dose)');
    expect(msg).toContain('GESAMT:');
    expect(msg).toContain('Pfand:');
  });

  it('renders an empty cart with placeholder', () => {
    const msg = buildWhatsAppMessage({ cart: { lines: [], customer } });
    expect(msg).toContain('(Warenkorb ist leer)');
    expect(msg).toContain('GESAMT:');
  });

  it('renders scheduled pickup time correctly', () => {
    const msg = buildWhatsAppMessage({
      cart: {
        lines: [kebab(1)],
        customer: {
          ...customer,
          pickup: { kind: 'scheduled', iso: '2026-04-25T16:45:00.000Z' },
        },
      },
    });
    // 16:45 UTC == 18:45 in Europe/Berlin (summer time)
    expect(msg).toMatch(/Abholung: \d{2}:\d{2} Uhr/);
  });

  it('falls back for missing first name', () => {
    const msg = buildWhatsAppMessage({
      cart: { lines: [kebab(1)], customer: { ...customer, firstName: '   ' } },
    });
    expect(msg).toContain('Name:    (ohne Name)');
  });

  it('renders customer notes when present', () => {
    const msg = buildWhatsAppMessage({
      cart: {
        lines: [kebab(1)],
        customer: { ...customer, notes: 'Bitte extra scharf, danke!' },
      },
    });
    expect(msg).toContain('Hinweis: Bitte extra scharf, danke!');
  });

  it('renders Vor-Ort-Verzehr correctly', () => {
    const msg = buildWhatsAppMessage({
      cart: { lines: [kebab(1)], customer: { ...customer, fulfillment: 'vor-ort' } },
    });
    expect(msg).toContain('Verzehr: Vor-Ort-Verzehr');
  });

  it('omits 0-deposit drinks Pfand line correctly', () => {
    const ayran: CartLine = {
      kind: 'drink',
      id: 'd2',
      quantity: 1,
      drinkId: 'ayran',
      drinkName: 'Ayran',
      variantLabel: 'Becher',
      unitPriceEur: 2.0,
      unitDepositEur: 0,
    };
    const msg = buildWhatsAppMessage({ cart: { lines: [ayran], customer } });
    expect(msg).not.toMatch(/Pfand:/);
  });

  it('renders steak meat upcharge + extra meat correctly in description', () => {
    const line: CartLine = {
      kind: 'kebab',
      id: 'k2',
      quantity: 1,
      unitPriceEur: 11.0,
      config: {
        bread: 'klassisch',
        base: 'kebap_basic',
        meat: 'rindersteak',
        extraMeat50g: 2,
        schmelzkaese: false,
        sauces: ['bbq', 'cocktail'],
        toppings: [],
      },
    };
    const msg = buildWhatsAppMessage({ cart: { lines: [line], customer } });
    expect(msg).toContain('Fleisch: Steak Döner (+1,00');
    expect(msg).toContain('Mehr Fleisch: 2× 50 g');
    expect(msg).not.toContain('Steakfleisch-Upgrade');
  });

  it('omits the bread label for Yufka Basic (no separate bread)', () => {
    const line: CartLine = {
      kind: 'kebab',
      id: 'k3',
      quantity: 1,
      unitPriceEur: 7.5,
      config: {
        bread: 'klassisch',
        base: 'yufka_basic',
        meat: 'haehnchen',
        extraMeat50g: 0,
        schmelzkaese: false,
        sauces: [],
        toppings: [],
      },
    };
    const msg = buildWhatsAppMessage({ cart: { lines: [line], customer } });
    expect(msg).toContain('1x Yufka Basic');
    expect(msg).not.toContain('Klassisches Dönerbrot');
  });

  it('omits bread + extras for Kebap Box (only Salat + 2 Saucen)', () => {
    const line: CartLine = {
      kind: 'kebab',
      id: 'k4',
      quantity: 1,
      unitPriceEur: 6.5,
      config: {
        bread: 'klassisch',
        base: 'kebap_box',
        meat: 'rinderhack',
        extraMeat50g: 0,
        schmelzkaese: false,
        sauces: [],
        toppings: [],
      },
    };
    const msg = buildWhatsAppMessage({ cart: { lines: [line], customer } });
    expect(msg).toContain('1x Kebap Box');
    expect(msg).not.toContain('Klassisches Dönerbrot');
    expect(msg).not.toContain('Schmelzkäse');
    expect(msg).not.toContain('Toppings:');
    expect(msg).not.toContain('Mehr Fleisch:');
  });
});

describe('buildWhatsAppMessage — delivery', () => {
  it('renders Lieferung mode + delivery address', () => {
    const msg = buildWhatsAppMessage({
      cart: {
        lines: [kebab(1), pizza(2)], // 11 + 18 = 29 → above 20
        customer: {
          firstName: 'Maja',
          fulfillment: 'lieferung',
          pickup: { kind: 'asap' },
          delivery: {
            street: 'Bahnhofstraße 5',
            postalCode: '71691',
            zoneId: 'freiberg',
            notesAddress: '2. Stock, links',
          },
        },
      },
    });
    expect(msg).toContain('Verzehr: Lieferung');
    expect(msg).toContain('Lieferadresse:');
    expect(msg).toContain('Bahnhofstraße 5');
    expect(msg).toContain('71691 Freiberg am Neckar');
    expect(msg).toContain('2. Stock, links');
    expect(msg).toContain('Liefergebühr:  3,00');
    expect(msg).toContain('GESAMT:        32,00');
  });

  it('shows "nach Absprache" for unknown city zone', () => {
    const msg = buildWhatsAppMessage({
      cart: {
        lines: [kebab(2)], // 22 → above 20
        customer: {
          firstName: 'X',
          fulfillment: 'lieferung',
          pickup: { kind: 'asap' },
          delivery: { street: 'Hauptstr. 1', postalCode: '70173', zoneId: 'andere' },
        },
      },
    });
    expect(msg).toContain('Liefergebühr:  nach Absprache');
  });

  it('warns when below delivery minimum', () => {
    const msg = buildWhatsAppMessage({
      cart: {
        lines: [kebab(1)], // 11
        customer: {
          firstName: 'X',
          fulfillment: 'lieferung',
          pickup: { kind: 'asap' },
          delivery: { street: 'X', postalCode: '71691', zoneId: 'freiberg' },
        },
      },
    });
    expect(msg).toMatch(/Lieferung erst ab 20,00/);
  });
});

describe('buildWhatsAppUrl', () => {
  it('returns wa.me URL with default number when not overridden', () => {
    const url = buildWhatsAppUrl({ cart: { lines: [kebab(1)], customer } });
    expect(url.startsWith('https://wa.me/491742116095?text=')).toBe(true);
    expect(url).toContain(encodeURIComponent('PIMP MY KEBAP'));
  });

  it('honors custom whatsapp number override', () => {
    const url = buildWhatsAppUrl({
      cart: { lines: [kebab(1)], customer },
      whatsappNumberE164NoPlus: '4915112345678',
    });
    expect(url.startsWith('https://wa.me/4915112345678?text=')).toBe(true);
  });

  it('falls back to default number for invalid input', () => {
    const url = buildWhatsAppUrl({
      cart: { lines: [kebab(1)], customer },
      whatsappNumberE164NoPlus: 'not-a-number',
    });
    expect(url.startsWith('https://wa.me/491742116095?text=')).toBe(true);
  });
});
