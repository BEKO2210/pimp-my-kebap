// Powered by skill: frontend-design, accessibility
// Client controller for the item-options dialog. The dialog DOM is rendered
// once per page; this script populates it on demand from data attributes
// stamped on the menu cards by ItemCard.astro.

import { addLine } from '../../lib/cart';
import { formatEUR } from '../../lib/format';
import { withBase } from '../../lib/url';
import type { MenuCategory } from '../../data/menu';

interface ChoiceData {
  id: string;
  label: string;
  priceDeltaEur?: number;
}
interface OptionData {
  id: string;
  label: string;
  required?: boolean;
  multi?: boolean;
  choices: ChoiceData[];
}
interface OpenPayload {
  itemId: string;
  itemName: string;
  category: MenuCategory;
  description?: string;
  basePriceEur: number;
  promo?: boolean;
  options: OptionData[];
  imgBase: string; // e.g. "/images/meals/<id>"
  fallback: string; // placeholder svg path
}

const dialogEl = document.querySelector<HTMLDialogElement>('[data-item-options-dialog]');

if (dialogEl) {
  const dialog: HTMLDialogElement = dialogEl;
  const titleEl = dialog.querySelector<HTMLElement>('[data-options-title]')!;
  const descEl = dialog.querySelector<HTMLElement>('[data-options-description]')!;
  const fieldsetsEl = dialog.querySelector<HTMLElement>('[data-options-fieldsets]')!;
  const priceEl = dialog.querySelector<HTMLElement>('[data-options-price]')!;
  const closeBtn = dialog.querySelector<HTMLButtonElement>('[data-options-close]')!;
  const addBtn = dialog.querySelector<HTMLButtonElement>('[data-options-add]')!;
  const imgEl = dialog.querySelector<HTMLImageElement>('[data-options-img]')!;
  const avifEl = dialog.querySelector<HTMLSourceElement>('[data-options-avif]')!;
  const webpEl = dialog.querySelector<HTMLSourceElement>('[data-options-webp]')!;

  let current: OpenPayload | null = null;
  /** option.id → choice.id (single) or string[] (multi) of currently picked. */
  const selected = new Map<string, string | string[]>();

  function selectedIds(optId: string): string[] {
    const v = selected.get(optId);
    if (!v) return [];
    return Array.isArray(v) ? v : [v];
  }

  function recomputePrice() {
    if (!current) return;
    let total = current.basePriceEur;
    for (const opt of current.options) {
      for (const choiceId of selectedIds(opt.id)) {
        const choice = opt.choices.find((c) => c.id === choiceId);
        if (choice?.priceDeltaEur) total += choice.priceDeltaEur;
      }
    }
    priceEl.textContent = formatEUR(total);
  }

  function buildFieldsets() {
    if (!current) return;
    fieldsetsEl.replaceChildren();
    for (const opt of current.options) {
      const fs = document.createElement('fieldset');
      fs.className = 'space-y-2';
      const legend = document.createElement('legend');
      legend.className = 'eyebrow !mb-1';
      legend.textContent = opt.multi ? `${opt.label} (mehrere möglich)` : opt.label;
      fs.appendChild(legend);

      const grid = document.createElement('div');
      grid.className = opt.multi ? 'grid grid-cols-2 gap-2' : 'grid grid-cols-1 gap-2';

      const choiceButtons: HTMLButtonElement[] = [];

      for (const choice of opt.choices) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-secondary !justify-between !py-3 !px-4 text-left text-sm';
        btn.dataset.optionId = opt.id;
        btn.dataset.choiceId = choice.id;

        const label = document.createElement('span');
        label.textContent = choice.label;
        btn.appendChild(label);

        if (choice.priceDeltaEur && choice.priceDeltaEur > 0) {
          const price = document.createElement('span');
          price.className = 'text-xs text-brand-gold num';
          price.textContent = `+${formatEUR(choice.priceDeltaEur)}`;
          btn.appendChild(price);
        }

        btn.setAttribute('aria-pressed', 'false');
        choiceButtons.push(btn);

        btn.addEventListener('click', () => {
          if (opt.multi) {
            const arr = selectedIds(opt.id);
            const idx = arr.indexOf(choice.id);
            if (idx >= 0) arr.splice(idx, 1);
            else arr.push(choice.id);
            selected.set(opt.id, [...arr]);
            const isActive = arr.includes(choice.id);
            btn.setAttribute('aria-pressed', String(isActive));
            btn.toggleAttribute('data-active', isActive);
          } else {
            selected.set(opt.id, choice.id);
            for (const sib of choiceButtons) {
              sib.setAttribute('aria-pressed', String(sib === btn));
              sib.toggleAttribute('data-active', sib === btn);
            }
          }
          recomputePrice();
          updateAddState();
        });
        grid.appendChild(btn);
      }

      // For non-required single-choice options, pre-select the first choice
      // (e.g. Schmelzkäse defaults to "ohne"). Required choices stay unpicked.
      // Multi-options default to nothing selected.
      if (!opt.required && !opt.multi) {
        const first = opt.choices[0];
        if (first) {
          selected.set(opt.id, first.id);
          const firstBtn = choiceButtons[0];
          if (firstBtn) {
            firstBtn.setAttribute('aria-pressed', 'true');
            firstBtn.setAttribute('data-active', 'true');
          }
        }
      }

      fs.appendChild(grid);
      fieldsetsEl.appendChild(fs);
    }
  }

  function allRequiredPicked(): boolean {
    if (!current) return false;
    return current.options.every((opt) => {
      if (!opt.required) return true;
      const ids = selectedIds(opt.id);
      return ids.length > 0;
    });
  }

  function updateAddState() {
    addBtn.disabled = !allRequiredPicked();
  }

  function buildLabel(): { label: string; selectedMap: Record<string, string | string[]> } {
    if (!current) return { label: '', selectedMap: {} };
    const parts: string[] = [];
    const map: Record<string, string | string[]> = {};
    for (const opt of current.options) {
      const ids = selectedIds(opt.id);
      if (ids.length === 0) continue;
      const labels = ids
        .map((id) => opt.choices.find((c) => c.id === id)?.label)
        .filter((s): s is string => Boolean(s));
      if (labels.length === 0) continue;
      if (opt.multi) {
        map[opt.id] = ids;
        parts.push(`${opt.label}: ${labels.join(', ')}`);
      } else {
        map[opt.id] = ids[0]!;
        parts.push(labels[0]!);
      }
    }
    return { label: parts.join(' · '), selectedMap: map };
  }

  function close() {
    if (dialog.open) dialog.close();
  }

  closeBtn.addEventListener('click', close);
  // Click on the backdrop closes (events on the dialog element itself are
  // forwarded only when the click happens outside the inner card).
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) close();
  });

  addBtn.addEventListener('click', () => {
    if (!current || !allRequiredPicked()) return;
    let unitPrice = current.basePriceEur;
    for (const opt of current.options) {
      for (const choiceId of selectedIds(opt.id)) {
        const choice = opt.choices.find((c) => c.id === choiceId);
        if (choice?.priceDeltaEur) unitPrice += choice.priceDeltaEur;
      }
    }
    const { label, selectedMap } = buildLabel();
    addLine({
      kind: 'menu',
      quantity: 1,
      itemId: current.itemId,
      itemName: current.itemName,
      category: current.category,
      unitPriceEur: unitPrice,
      promoApplied: current.promo,
      selectedOptions: selectedMap,
      optionsLabel: label || undefined,
    });
    if (navigator.vibrate) navigator.vibrate(10);
    close();
  });

  // Public API — the menu-section client calls this when a card with options
  // is "+" tapped. We attach to a global hook so we don't have to bundle a
  // shared module across both scripts.
  (window as unknown as { __openItemOptions?: (p: OpenPayload) => void }).__openItemOptions = (
    payload: OpenPayload,
  ) => {
    current = payload;
    selected.clear();

    titleEl.textContent = payload.itemName;
    if (payload.description) {
      descEl.textContent = payload.description;
      descEl.classList.remove('hidden');
    } else {
      descEl.textContent = '';
      descEl.classList.add('hidden');
    }

    avifEl.srcset = withBase(`${payload.imgBase}.avif`);
    webpEl.srcset = withBase(`${payload.imgBase}.webp`);
    imgEl.src = withBase(`${payload.imgBase}.jpg`);
    imgEl.alt = payload.itemName;
    imgEl.dataset.fallback = withBase(payload.fallback);

    buildFieldsets();
    recomputePrice();
    updateAddState();
    dialog.showModal();
  };
}
