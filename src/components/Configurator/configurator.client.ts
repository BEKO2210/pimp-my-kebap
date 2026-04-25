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
  const breadStep = root.querySelector<HTMLElement>('fieldset[data-cfg-step="bread"]')!;
  const pimpStep = root.querySelector<HTMLElement>('fieldset[data-cfg-step="pimp"]')!;
  const boxHint = root.querySelector<HTMLElement>('[data-cfg-box-hint]')!;

  /** Bread is only relevant when the base is "im Brot" (kebap_basic). */
  const baseRequiresBread = (b: BaseId) => b === 'kebap_basic';
  /** Kebap Box ships with salad + 2 sauces and no extras. */
  const baseAllowsExtras = (b: BaseId) => b !== 'kebap_box';

  function renumberSteps() {
    const numerals = ['①', '②', '③'];
    let i = 0;
    root!.querySelectorAll<HTMLElement>('fieldset[data-cfg-step]').forEach((fs) => {
      if (fs.hasAttribute('hidden')) return;
      const numEl = fs.querySelector<HTMLElement>('[data-cfg-step-num]');
      if (numEl) numEl.textContent = numerals[i++] ?? '';
    });
  }

  function clearExtras() {
    state.sauces = [];
    state.toppings = [];
    state.schmelzkaese = false;
    state.extraMeat50g = 0;
    extraMeatVal.textContent = '0';
    root!.querySelectorAll<HTMLInputElement>('[data-cfg-sauce]').forEach((cb) => {
      cb.checked = false;
      cb.closest<HTMLElement>('[data-cfg-sauce-card]')?.removeAttribute('data-active');
    });
    root!.querySelectorAll<HTMLInputElement>('[data-cfg-topping]').forEach((cb) => {
      cb.checked = false;
      cb.closest<HTMLElement>('[data-cfg-topping-card]')?.removeAttribute('data-active');
    });
    root!.querySelectorAll<HTMLInputElement>('[data-cfg-flag]').forEach((cb) => {
      cb.checked = false;
    });
  }

  function applyVisibility() {
    const breadVisible = baseRequiresBread(state.base);
    breadStep.toggleAttribute('hidden', !breadVisible);
    const extras = baseAllowsExtras(state.base);
    pimpStep.toggleAttribute('hidden', !extras);
    boxHint.toggleAttribute('hidden', extras);
    renumberSteps();
  }

  function recompute() {
    const breakdown = priceKebab(state);
    totalEl.textContent = formatEUR(breakdown.unitTotal);
    const breadOk = baseRequiresBread(state.base) ? breadChosen : true;
    addBtn.disabled = !(baseChosen && breadOk);
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
      const previous = state.base;
      state.base = id;
      baseChosen = true;
      setActive('base', id);
      // Switching to Kebap Box discards any extras the user already picked.
      if (!baseAllowsExtras(id) && baseAllowsExtras(previous)) {
        clearExtras();
      }
      applyVisibility();
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

  // Schmelzkäse flag (the only boolean toggle that remains)
  root.querySelectorAll<HTMLInputElement>('[data-cfg-flag]').forEach((cb) => {
    cb.addEventListener('change', () => {
      const flag = cb.getAttribute('data-cfg-flag');
      if (flag === 'schmelzkaese') state.schmelzkaese = cb.checked;
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

  // Add to cart — sanitises state for bases that don't carry extras / bread.
  addBtn.addEventListener('click', () => {
    if (addBtn.disabled) return;
    const cleaned: KebabConfig = {
      ...state,
      sauces: baseAllowsExtras(state.base) ? [...state.sauces] : [],
      toppings: baseAllowsExtras(state.base) ? [...state.toppings] : [],
      schmelzkaese: baseAllowsExtras(state.base) ? state.schmelzkaese : false,
      extraMeat50g: baseAllowsExtras(state.base) ? state.extraMeat50g : 0,
    };
    const breakdown = priceKebab(cleaned);
    addLine({
      kind: 'kebab',
      quantity: 1,
      config: cleaned,
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
    state.extraMeat50g = baseAllowsExtras(cfg.base) ? cfg.extraMeat50g : 0;
    state.schmelzkaese = baseAllowsExtras(cfg.base) ? cfg.schmelzkaese : false;
    state.sauces = baseAllowsExtras(cfg.base) ? [...cfg.sauces] : [];
    state.toppings = baseAllowsExtras(cfg.base) ? [...cfg.toppings] : [];
    breadChosen = baseRequiresBread(cfg.base);
    baseChosen = true;
    setActive('bread', state.bread);
    setActive('base', state.base);
    setActive('meat', state.meat);
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
    });
    extraMeatVal.textContent = String(state.extraMeat50g);
    applyVisibility();
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

  applyVisibility();
  recompute();
}
