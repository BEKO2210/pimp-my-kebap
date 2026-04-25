// Powered by skill: frontend-design, security
// Vanilla TS controller for the configurator wizard.
// No innerHTML — only textContent / setAttribute / classList.

import { priceKebab, type KebabConfig } from '../../lib/pricing';
import { formatEUR } from '../../lib/format';
import { addLine, openCart } from '../../lib/cart';
import { randomKebab } from '../../lib/random-kebab';
import { toast } from '../../lib/toast';
import type { BreadId } from '../../data/breads';
import type { BaseId, MeatId } from '../../data/configurator';
import type { SauceId } from '../../data/sauces';
import type { ToppingId } from '../../data/ingredients';

const root = document.querySelector<HTMLElement>('[data-cfg-root]');
if (root) {
  const state: KebabConfig = {
    bread: 'klassisch',
    base: 'kebap_basic',
    meat: 'rinderhack',
    meatUpgradeSteak: false,
    extraMeat50g: 0,
    schmelzkaese: false,
    sauces: [],
    toppings: [],
  };
  // Track if user explicitly picked a bread/base (gate "Add to cart" button).
  let breadChosen = false;
  let baseChosen = false;

  const totalEl = root.querySelector<HTMLElement>('[data-cfg-total]')!;
  const addBtn = root.querySelector<HTMLButtonElement>('[data-cfg-add]')!;
  const extraMeatVal = root.querySelector<HTMLElement>('[data-cfg-extra-meat-value]')!;

  function recompute() {
    const breakdown = priceKebab(state);
    totalEl.textContent = formatEUR(breakdown.unitTotal);
    addBtn.disabled = !(breadChosen && baseChosen);
  }

  function setActive(group: string, value: string) {
    root!.querySelectorAll<HTMLButtonElement>(`[data-cfg-${group}]`).forEach((el) => {
      const active = el.getAttribute(`data-cfg-${group}`) === value;
      el.setAttribute('aria-pressed', String(active));
      el.setAttribute('data-active', String(active));
      if (group === 'meat') el.setAttribute('aria-checked', String(active));
    });
  }

  // Bread buttons
  root.querySelectorAll<HTMLButtonElement>('[data-cfg-bread]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-cfg-bread') as BreadId;
      state.bread = id;
      breadChosen = true;
      setActive('bread', id);
      recompute();
    });
  });

  // Base buttons
  root.querySelectorAll<HTMLButtonElement>('[data-cfg-base]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-cfg-base') as BaseId;
      state.base = id;
      baseChosen = true;
      setActive('base', id);
      recompute();
    });
  });

  // Meat radios
  root.querySelectorAll<HTMLButtonElement>('[data-cfg-meat]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-cfg-meat') as MeatId;
      state.meat = id;
      setActive('meat', id);
      recompute();
    });
  });
  // Default-select first meat visually
  setActive('meat', state.meat);

  // Sauces (checkbox cards)
  root.querySelectorAll<HTMLInputElement>('[data-cfg-sauce]').forEach((cb) => {
    cb.addEventListener('change', () => {
      const id = cb.getAttribute('data-cfg-sauce') as SauceId;
      const card = cb.closest<HTMLElement>('[data-cfg-sauce-card]');
      if (cb.checked) {
        if (!state.sauces.includes(id)) state.sauces.push(id);
      } else {
        state.sauces = state.sauces.filter((s) => s !== id);
      }
      card?.setAttribute('data-active', String(cb.checked));
      recompute();
    });
  });

  // Topping cards
  root.querySelectorAll<HTMLInputElement>('[data-cfg-topping]').forEach((cb) => {
    cb.addEventListener('change', () => {
      const id = cb.getAttribute('data-cfg-topping') as ToppingId;
      const card = cb.closest<HTMLElement>('[data-cfg-topping-card]');
      if (cb.checked) {
        if (!state.toppings.includes(id)) state.toppings.push(id);
      } else {
        state.toppings = state.toppings.filter((t) => t !== id);
      }
      card?.setAttribute('data-active', String(cb.checked));
      recompute();
    });
  });

  // Schmelzkäse + steak upgrade flags
  root.querySelectorAll<HTMLInputElement>('[data-cfg-flag]').forEach((cb) => {
    cb.addEventListener('change', () => {
      const flag = cb.getAttribute('data-cfg-flag') as keyof KebabConfig;
      // Only boolean flags are wired here.
      if (flag === 'schmelzkaese' || flag === 'meatUpgradeSteak') {
        state[flag] = cb.checked;
      }
      recompute();
    });
  });

  // Extra meat stepper
  function setExtraMeat(n: number) {
    state.extraMeat50g = Math.max(0, Math.min(3, n));
    extraMeatVal.textContent = String(state.extraMeat50g);
    recompute();
  }
  root.querySelectorAll<HTMLButtonElement>('[data-cfg-extra-meat]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const dir = btn.getAttribute('data-cfg-extra-meat');
      setExtraMeat(state.extraMeat50g + (dir === 'inc' ? 1 : -1));
    });
  });

  // Add to cart
  addBtn.addEventListener('click', () => {
    if (addBtn.disabled) return;
    const breakdown = priceKebab(state);
    addLine({
      kind: 'kebab',
      quantity: 1,
      config: { ...state, sauces: [...state.sauces], toppings: [...state.toppings] },
      unitPriceEur: breakdown.unitTotal,
    });
    if (navigator.vibrate) navigator.vibrate(10);
    openCart();
  });

  // ── Surprise Me — re-applies a random valid config and scrolls into view
  function applyConfig(cfg: KebabConfig) {
    state.bread = cfg.bread;
    state.base = cfg.base;
    state.meat = cfg.meat;
    state.meatUpgradeSteak = cfg.meatUpgradeSteak;
    state.extraMeat50g = cfg.extraMeat50g;
    state.schmelzkaese = cfg.schmelzkaese;
    state.sauces = [...cfg.sauces];
    state.toppings = [...cfg.toppings];
    breadChosen = true;
    baseChosen = true;
    setActive('bread', state.bread);
    setActive('base', state.base);
    setActive('meat', state.meat);
    // sauces & toppings: tick checkboxes + visual cards
    root!.querySelectorAll<HTMLInputElement>('[data-cfg-sauce]').forEach((cb) => {
      const id = cb.getAttribute('data-cfg-sauce') as SauceId;
      cb.checked = state.sauces.includes(id);
      cb.closest<HTMLElement>('[data-cfg-sauce-card]')?.setAttribute('data-active', String(cb.checked));
    });
    root!.querySelectorAll<HTMLInputElement>('[data-cfg-topping]').forEach((cb) => {
      const id = cb.getAttribute('data-cfg-topping') as ToppingId;
      cb.checked = state.toppings.includes(id);
      cb.closest<HTMLElement>('[data-cfg-topping-card]')?.setAttribute('data-active', String(cb.checked));
    });
    root!.querySelectorAll<HTMLInputElement>('[data-cfg-flag]').forEach((cb) => {
      const flag = cb.getAttribute('data-cfg-flag');
      if (flag === 'schmelzkaese') cb.checked = state.schmelzkaese;
      if (flag === 'meatUpgradeSteak') cb.checked = state.meatUpgradeSteak;
    });
    extraMeatVal.textContent = String(state.extraMeat50g);
    recompute();
  }

  document.querySelectorAll<HTMLButtonElement>('[data-surprise-me]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cfg = randomKebab();
      applyConfig(cfg);
      const target = document.getElementById('konfigurator');
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (navigator.vibrate) navigator.vibrate([5, 30, 5]);
      toast('Zufalls-Kebap konfiguriert. Schmeckt sicher!', { tone: 'success' });
    });
  });

  recompute();
}
