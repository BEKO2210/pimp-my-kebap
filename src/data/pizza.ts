// Powered by skill: frontend-design
// "Pimp My Pizza" configurator data — eigene Pizza, Topping für Topping.

export interface PizzaToppingOption {
  id: string;
  name: string;
  /** Default price = €1 per topping; override here for premium toppings. */
  priceEur?: number;
  veg?: boolean;
  spicy?: boolean;
}

export const PIZZA_BASE_PRICE_EUR = 8.0; // Pizzaboden mit Tomatensoße + Käse
export const PIZZA_TOPPING_PRICE_EUR = 1.0; // pro Standard-Topping
// Premium-Topping = 2,00 €, damit eine Pimp-my-Pizza mit einem Premium-Item
// (Sucuk / Hackfleisch / Hähnchen / Thunfisch / Meeresfrüchte / Gorgonzola)
// niemals UNTER dem Menü-Preis der entsprechenden fertigen Pizza landet.
// Menü-Sucuk/Hackfleisch/Hähnchen kosten je 10 € (= 8 + 2). Standard-Topping
// und Boden bleiben unangetastet.
export const PIZZA_TOPPING_PRICE_PREMIUM_EUR = 2.0; // Steakfleisch, Meeresfrüchte, Sucuk, Gorgonzola

export const PIZZA_TOPPINGS: readonly PizzaToppingOption[] = [
  // Klassiker
  { id: 'salami', name: 'Salami' },
  { id: 'schinken', name: 'Schinken' },
  { id: 'champignons', name: 'Champignons', veg: true },
  { id: 'paprika', name: 'Paprika', veg: true },
  { id: 'zwiebel', name: 'Zwiebel', veg: true },
  { id: 'mais', name: 'Mais', veg: true },
  { id: 'oliven', name: 'Oliven', veg: true },
  { id: 'ananas', name: 'Ananas', veg: true },
  { id: 'spinat', name: 'Spinat', veg: true },
  { id: 'broccoli', name: 'Broccoli', veg: true },
  { id: 'artischocken', name: 'Artischocken', veg: true },
  { id: 'peperoni', name: 'Peperoni', veg: true, spicy: true },
  { id: 'jalapenos', name: 'Jalapeños', veg: true, spicy: true },
  { id: 'ei', name: 'Ei', veg: true },
  // Premium
  { id: 'sucuk', name: 'Sucuk', priceEur: PIZZA_TOPPING_PRICE_PREMIUM_EUR, spicy: true },
  { id: 'thunfisch', name: 'Thunfisch', priceEur: PIZZA_TOPPING_PRICE_PREMIUM_EUR },
  { id: 'meeresfruechte', name: 'Meeresfrüchte', priceEur: PIZZA_TOPPING_PRICE_PREMIUM_EUR },
  { id: 'haehnchen', name: 'Hähnchen-Drehspieß', priceEur: PIZZA_TOPPING_PRICE_PREMIUM_EUR },
  { id: 'hackfleisch', name: 'Hackfleisch-Drehspieß', priceEur: PIZZA_TOPPING_PRICE_PREMIUM_EUR },
  { id: 'gorgonzola', name: 'Gorgonzola', veg: true, priceEur: PIZZA_TOPPING_PRICE_PREMIUM_EUR },
  { id: 'mozzarella-extra', name: 'Mozzarella extra', veg: true },
  { id: 'feta', name: 'Feta', veg: true },
] as const;

export type PizzaToppingId = (typeof PIZZA_TOPPINGS)[number]['id'];

export function pizzaToppingPrice(t: PizzaToppingOption): number {
  return t.priceEur ?? PIZZA_TOPPING_PRICE_EUR;
}

export interface PizzaConfig {
  toppings: PizzaToppingId[];
}

export interface PizzaPriceBreakdown {
  basePrice: number;
  toppings: number;
  unitTotal: number;
}

export function pricePizza(cfg: PizzaConfig): PizzaPriceBreakdown {
  let toppingsCost = 0;
  for (const id of cfg.toppings) {
    const t = PIZZA_TOPPINGS.find((x) => x.id === id);
    if (t) toppingsCost += pizzaToppingPrice(t);
  }
  toppingsCost = Math.round(toppingsCost * 100) / 100;
  const unitTotal = Math.round((PIZZA_BASE_PRICE_EUR + toppingsCost) * 100) / 100;
  return { basePrice: PIZZA_BASE_PRICE_EUR, toppings: toppingsCost, unitTotal };
}

/** Compose a human-readable summary line ("Pimp my Pizza · Salami, Pilze, Oliven"). */
export function describePizza(cfg: PizzaConfig): string {
  if (cfg.toppings.length === 0) return 'Pimp my Pizza (Margherita)';
  const names = cfg.toppings
    .map((id) => PIZZA_TOPPINGS.find((t) => t.id === id)?.name ?? id)
    .join(', ');
  return `Pimp my Pizza · ${names}`;
}
