// Powered by skill: frontend-design, security
import { addLine } from '../../lib/cart';
import { formatEUR } from '../../lib/format';
import { toast } from '../../lib/toast';
import { withBase } from '../../lib/url';
import {
  pricePizza,
  describePizza,
  PIZZA_TOPPINGS,
  PIZZA_BASE_PRICE_EUR,
  type PizzaConfig,
  type PizzaToppingId,
} from '../../data/pizza';

const root = document.querySelector<HTMLElement>('[data-pizza-root]');
if (root) {
  const state: PizzaConfig = { toppings: [] };
  const totalEl = root.querySelector<HTMLElement>('[data-pizza-total]')!;
  const summaryEl = root.querySelector<HTMLElement>('[data-pizza-summary]')!;
  const addBtn = root.querySelector<HTMLButtonElement>('[data-pizza-add]')!;

  function recompute() {
    const breakdown = pricePizza(state);
    totalEl.textContent = formatEUR(breakdown.unitTotal);
    if (state.toppings.length === 0) {
      summaryEl.textContent = 'Margherita-Stil';
    } else if (state.toppings.length === 1) {
      const id = state.toppings[0]!;
      summaryEl.textContent = PIZZA_TOPPINGS.find((t) => t.id === id)?.name ?? id;
    } else {
      summaryEl.textContent = `${state.toppings.length} Toppings`;
    }
  }

  root.querySelectorAll<HTMLInputElement>('[data-pizza-topping]').forEach((cb) => {
    cb.addEventListener('change', () => {
      const id = cb.getAttribute('data-pizza-topping') as PizzaToppingId;
      const card = cb.closest<HTMLElement>('[data-pizza-topping-card]');
      if (cb.checked) {
        if (!state.toppings.includes(id)) state.toppings.push(id);
      } else {
        state.toppings = state.toppings.filter((t) => t !== id);
      }
      card?.setAttribute('data-active', String(cb.checked));
      recompute();
    });
  });

  // Add then redirect to /weiter so the customer can keep building the order.
  addBtn.addEventListener('click', () => {
    const breakdown = pricePizza(state);
    const name = describePizza(state);
    addLine({
      kind: 'menu',
      quantity: 1,
      itemId: `pimp-pizza-${state.toppings.slice().sort().join('-') || 'plain'}`,
      itemName: name,
      category: 'pizza',
      unitPriceEur: breakdown.unitTotal,
    });
    if (navigator.vibrate) navigator.vibrate(10);
    toast('Pizza im Warenkorb', { tone: 'success' });
    window.location.href = withBase('/weiter') + '?added=pizza';
  });

  // Force initial render
  void PIZZA_BASE_PRICE_EUR;
  recompute();
}
