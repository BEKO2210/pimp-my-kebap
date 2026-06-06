// Powered by skill: security
// All Zod schemas for client-side validation (cart persistence, notes input).
import { z } from 'zod';

export const NotesSchema = z
  .string()
  .max(280, 'Notiz darf maximal 280 Zeichen enthalten.')
  // Whitelist: ASCII letters/digits, German umlauts, common punctuation, newline.
  // Inkl. ( ) / ' — kommt in echten Bestell-Notizen vor ("1/2 scharf",
  // "Klingel kaputt (bitte anrufen)", "Anna's Tür").
  .regex(/^[a-zA-Z0-9äöüÄÖÜß ,.!?:'()/\-+\n]*$/u, 'Notiz enthält unzulässige Zeichen.');

/** Strips disallowed characters and clamps to 280 chars. Safe to feed to NotesSchema. */
export function sanitizeNotes(raw: string): string {
  const stripped = raw.replace(/[^a-zA-Z0-9äöüÄÖÜß ,.!?:'()/\-+\n]/gu, '');
  return stripped.slice(0, 280);
}

// z.looseObject ist die Zod-4-Variante von z.object({...}).passthrough() —
// laesst unbekannte Felder beim Validieren durch statt zu erroren. Wir
// brauchen das, damit alte localStorage-Carts mit veralteten Feldern
// (z.B. das frueher entfernte `meatUpgradeSteak`) beim Hydraten nicht
// crashen. Solche Felder werden anschliessend einfach ignoriert.
const KebabConfigSchema = z.looseObject({
  bread: z.enum(['klassisch', 'sesam', 'knoblauch', 'vital']),
  base: z.enum(['kebap_basic', 'yufka_basic', 'kebap_box']),
  meat: z.enum(['rinderhack', 'haehnchen', 'rindersteak']),
  extraMeat50g: z.number().int().min(0).max(3),
  schmelzkaese: z.boolean(),
  sauces: z.array(z.string()).max(6),
  toppings: z.array(z.string()).max(19),
});

const KebabLineSchema = z.object({
  kind: z.literal('kebab'),
  id: z.string().min(1).max(80),
  quantity: z.number().int().min(1).max(20),
  notes: z.string().max(280).optional(),
  config: KebabConfigSchema,
  unitPriceEur: z.number().min(0).max(200),
});

const MenuLineSchema = z.object({
  kind: z.literal('menu'),
  id: z.string().min(1).max(80),
  quantity: z.number().int().min(1).max(20),
  notes: z.string().max(280).optional(),
  itemId: z.string().min(1).max(80),
  itemName: z.string().min(1).max(200),
  category: z.string().min(1).max(40),
  unitPriceEur: z.number().min(0).max(200),
  promoApplied: z.boolean().optional(),
  selectedOptions: z
    .record(z.string(), z.union([z.string(), z.array(z.string())]))
    .optional(),
  optionsLabel: z.string().max(200).optional(),
});

const DrinkLineSchema = z.object({
  kind: z.literal('drink'),
  id: z.string().min(1).max(80),
  quantity: z.number().int().min(1).max(20),
  drinkId: z.string().min(1).max(80),
  drinkName: z.string().min(1).max(200),
  variantLabel: z.string().min(1).max(80),
  unitPriceEur: z.number().min(0).max(200),
  unitDepositEur: z.number().min(0).max(20),
});

const CartLineSchema = z.discriminatedUnion('kind', [
  KebabLineSchema,
  MenuLineSchema,
  DrinkLineSchema,
]);

const DeliveryAddressSchema = z.object({
  street: z.string().min(1).max(120),
  postalCode: z.string().min(4).max(10),
  zoneId: z.string().min(1).max(40),
  notesAddress: z.string().max(120).optional(),
});

const CustomerInfoSchema = z.object({
  firstName: z.string().max(60),
  fulfillment: z.enum(['abholung', 'vor-ort', 'lieferung']),
  pickup: z.union([
    z.object({ kind: z.literal('asap') }),
    z.object({ kind: z.literal('scheduled'), iso: z.string().min(1) }),
  ]),
  notes: z.string().max(280).optional(),
  delivery: DeliveryAddressSchema.optional(),
});

export const PersistedCartSchema = z.object({
  version: z.literal(1),
  lines: z.array(CartLineSchema).max(60),
  customer: CustomerInfoSchema,
  expiresAtMs: z.number().int().nonnegative(),
});

export type ValidatedCart = z.infer<typeof PersistedCartSchema>;
