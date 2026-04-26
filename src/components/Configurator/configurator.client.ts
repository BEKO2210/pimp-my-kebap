// Powered by skill: frontend-design, security
// Vanilla TS controller for the configurator wizard.
// No innerHTML — only textContent / setAttribute / classList.

import { priceKebab, type KebabConfig } from '../../lib/pricing';
import { formatEUR } from '../../lib/format';
import { addLine } from '../../lib/cart';
import { randomKebab } from '../../lib/random-kebab';
import { toast } from '../../lib/toast';
import { withBase } from '../../lib/url';
import type { BreadId } from '../../data/breads';
import type { BaseId, MeatId } from '../../data/configurator';
import type { SauceId } from '../../data/sauces';
import type { ToppingId } from '../../data/ingredients';
import { TOPPINGS } from '../../data/ingredients';

// Salat-Zutaten (Kraut, Zwiebel, Tomaten) sind Basis-inklusiv und damit
// von Anfang an im state — der User sieht sie als bereits gewählt.
const BASE_INCLUDED_TOPPINGS: readonly ToppingId[] = TOPPINGS
  .filter((t) => t.baseIncluded)
  .map((t) => t.id);

const root = document.querySelector<HTMLElement>('[data-cfg-root]');
if (root) {
  const state: KebabConfig = {
    bread: 'klassisch',
    base: 'kebap_basic',
    meat: 'rinderhack',
    extraMeat50g: 0,
    schmelzkaese: false,
    sauces: [],
    toppings: [...BASE_INCLUDED_TOPPINGS],
  };
  // Track if user explicitly picked a bread/base (gate "Add to cart" button).
  let breadChosen = false;
  let baseChosen = false;

  const totalEl = root.querySelector<HTMLElement>('[data-cfg-total]')!;
  const totalLabelEl = root.querySelector<HTMLElement>('[data-cfg-total-label]')!;
  const addBtn = root.querySelector<HTMLButtonElement>('[data-cfg-add]')!;
  const extraMeatVal = root.querySelector<HTMLElement>('[data-cfg-extra-meat-value]')!;
  const breadStep = root.querySelector<HTMLElement>('fieldset[data-cfg-step="bread"]')!;
  const pimpSections = root.querySelectorAll<HTMLElement>('[data-cfg-pimp-section]');
  const boxHint = root.querySelector<HTMLElement>('[data-cfg-box-hint]')!;

  /** Bread is only relevant when the base is "im Brot" (kebap_basic). */
  const baseRequiresBread = (b: BaseId) => b === 'kebap_basic';
  /** Kebap Box ships with salad + 2 sauces and no extras. */
  const baseAllowsExtras = (b: BaseId) => b !== 'kebap_box';

  // Mobile-only auto-advance: nach jedem Klick auf eine Single-Select-Option
  // (Basis, Spieß, Brot) scrollen wir zum nächsten sichtbaren Schritt.
  // Auf Desktop sehen User alle Schritte gleichzeitig — kein Scroll-Eingriff.
  // Bei Multi-Select (Soßen, Toppings) bleibt der Scroll-Position stehen,
  // damit User mehrere Optionen anklicken können ohne dass die Seite wegläuft.
  const mobileMQ = window.matchMedia('(max-width: 767px)');
  const STEP_ORDER = ['base', 'meat', 'bread', 'sauces', 'toppings', 'extras'] as const;
  type StepName = typeof STEP_ORDER[number];

  function nextVisibleStep(currentStep: StepName): StepName | null {
    const idx = STEP_ORDER.indexOf(currentStep);
    if (idx < 0) return null;
    for (let i = idx + 1; i < STEP_ORDER.length; i++) {
      const candidate = STEP_ORDER[i];
      if (!candidate) continue;
      const next = root!.querySelector<HTMLElement>(`fieldset[data-cfg-step="${candidate}"]:not([hidden])`);
      if (next) return candidate;
    }
    return null;
  }

  function scrollToStep(step: StepName) {
    if (!mobileMQ.matches) return;
    const el = root!.querySelector<HTMLElement>(`fieldset[data-cfg-step="${step}"]:not([hidden])`);
    if (!el) return;
    // Defer to next frame so any visibility changes (z.B. Brot-Step beim
    // Wechsel auf Yufka/Box ausblenden) bereits angewendet sind.
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function autoAdvance(fromStep: StepName) {
    const next = nextVisibleStep(fromStep);
    if (next) scrollToStep(next);
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
    pimpSections.forEach((el) => el.toggleAttribute('hidden', !extras));
    boxHint.toggleAttribute('hidden', extras);
  }

  function recompute() {
    const breakdown = priceKebab(state);
    const breadOk = baseRequiresBread(state.base) ? breadChosen : true;
    const ready = baseChosen && breadOk;

    if (!baseChosen) {
      totalLabelEl.textContent = 'Schritt 1';
      totalEl.textContent = 'Wähle deine Basis';
      totalEl.classList.add('text-base', 'sm:text-lg');
      totalEl.classList.remove('text-2xl');
    } else if (!breadOk) {
      totalLabelEl.textContent = 'Schritt 2';
      totalEl.textContent = 'Wähle dein Brot';
      totalEl.classList.add('text-base', 'sm:text-lg');
      totalEl.classList.remove('text-2xl');
    } else {
      totalLabelEl.textContent = 'Aktueller Preis';
      totalEl.textContent = formatEUR(breakdown.unitTotal);
      totalEl.classList.remove('text-base', 'sm:text-lg');
      totalEl.classList.add('text-2xl');
    }
    addBtn.disabled = !ready;
  }

  function setActive(group: string, value: string) {
    root!.querySelectorAll<HTMLButtonElement>(`[data-cfg-${group}]`).forEach((el) => {
      const active = el.getAttribute(`data-cfg-${group}`) === value;
      el.setAttribute('aria-pressed', String(active));
      el.setAttribute('data-active', String(active));
      if (group === 'meat') el.setAttribute('aria-checked', String(active));
    });
  }

  // Bread buttons (single-select → auto-advance on mobile)
  root.querySelectorAll<HTMLButtonElement>('[data-cfg-bread]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-cfg-bread') as BreadId;
      state.bread = id;
      breadChosen = true;
      setActive('bread', id);
      recompute();
      autoAdvance('bread');
    });
  });

  // Base buttons (single-select → auto-advance on mobile)
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
      autoAdvance('base');
    });
  });

  // Meat radios (single-select → auto-advance on mobile)
  root.querySelectorAll<HTMLButtonElement>('[data-cfg-meat]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-cfg-meat') as MeatId;
      state.meat = id;
      setActive('meat', id);
      recompute();
      autoAdvance('meat');
    });
  });
  // Default-select first meat visually
  setActive('meat', state.meat);

  // Sauces (multi-select → kein Auto-Advance, User soll mehrere wählen können)
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

  // Topping cards (multi-select → kein Auto-Advance)
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
  // After adding we redirect to /weiter so the customer can pile on more items
  // (another kebap, a pizza, or pick from the Speisekarte) before checkout.
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
    window.location.href = withBase('/weiter') + '?added=kebap';
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
