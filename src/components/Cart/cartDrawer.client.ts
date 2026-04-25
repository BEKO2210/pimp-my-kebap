// Powered by skill: frontend-design, accessibility, security
import {
  $lines,
  $customer,
  $totals,
  $itemCount,
  $isCartOpen,
  setQuantity,
  removeLine,
  patchCustomer,
  clearCart,
  closeCart,
  openCart,
  currentWhatsAppUrl,
  currentWhatsAppPreview,
  canSendWhatsApp,
  recordWhatsAppSend,
} from '../../lib/cart';
import type { CartLine, FulfillmentMode } from '../../lib/cart-types';
import { sanitizeNotes } from '../../lib/validation';
import { formatEUR } from '../../lib/format';
import { BREADS } from '../../data/breads';
import { BASES, MEATS } from '../../data/configurator';
import { SAUCES } from '../../data/sauces';
import { TOPPINGS } from '../../data/ingredients';

const root = document.querySelector<HTMLElement>('[data-cart-root]');
if (root) {
  const itemsList = root.querySelector<HTMLUListElement>('[data-cart-items]')!;
  const empty = root.querySelector<HTMLElement>('[data-cart-empty]')!;
  const totalsItems = root.querySelector<HTMLElement>('[data-totals-items]')!;
  const totalsDeposit = root.querySelector<HTMLElement>('[data-totals-deposit]')!;
  const totalsDepositRow = root.querySelector<HTMLElement>('[data-totals-deposit-row]')!;
  const totalsFee = root.querySelector<HTMLElement>('[data-totals-fee]')!;
  const totalsFeeRow = root.querySelector<HTMLElement>('[data-totals-fee-row]')!;
  const totalsGrand = root.querySelector<HTMLElement>('[data-totals-grand]')!;
  const warning = root.querySelector<HTMLElement>('[data-cart-warning]')!;
  const checkout = root.querySelector<HTMLButtonElement>('[data-cart-checkout]')!;
  const close = root.querySelector<HTMLButtonElement>('[data-cart-close]')!;
  const backdrop = root.querySelector<HTMLElement>('[data-cart-backdrop]')!;
  const clearBtn = root.querySelector<HTMLButtonElement>('[data-cart-clear]')!;
  const firstName = root.querySelector<HTMLInputElement>('[data-cart-firstname]')!;
  const pickupSel = root.querySelector<HTMLSelectElement>('[data-cart-pickup]')!;
  const notes = root.querySelector<HTMLTextAreaElement>('[data-cart-notes]')!;
  const deliveryBlock = root.querySelector<HTMLElement>('[data-cart-delivery]')!;
  const zoneSel = root.querySelector<HTMLSelectElement>('[data-cart-zone]')!;
  const plzInp = root.querySelector<HTMLInputElement>('[data-cart-plz]')!;
  const streetInp = root.querySelector<HTMLInputElement>('[data-cart-street]')!;

  const bar = document.querySelector<HTMLElement>('[data-cart-bar]');
  const barCount = document.querySelector<HTMLElement>('[data-cart-bar-count]');
  const barTotal = document.querySelector<HTMLElement>('[data-cart-bar-total]');
  const openBarBtn = document.querySelector<HTMLButtonElement>('[data-cart-open-bar]');

  // Pickup time options (00:15 increments from now+20m to 21:00)
  function buildPickupOptions() {
    pickupSel.replaceChildren();
    const asap = document.createElement('option');
    asap.value = 'asap';
    asap.textContent = 'So schnell wie möglich';
    pickupSel.appendChild(asap);
    const now = new Date();
    const earliest = new Date(now.getTime() + 20 * 60_000);
    earliest.setSeconds(0, 0);
    const minutesPast = earliest.getMinutes() % 15;
    if (minutesPast !== 0) earliest.setMinutes(earliest.getMinutes() + (15 - minutesPast));
    const closing = new Date(now);
    closing.setHours(21, 0, 0, 0);
    while (earliest <= closing) {
      const opt = document.createElement('option');
      opt.value = earliest.toISOString();
      const hh = String(earliest.getHours()).padStart(2, '0');
      const mm = String(earliest.getMinutes()).padStart(2, '0');
      opt.textContent = `${hh}:${mm} Uhr`;
      pickupSel.appendChild(opt);
      earliest.setMinutes(earliest.getMinutes() + 15);
    }
  }
  buildPickupOptions();

  function lineSummary(line: CartLine): string {
    if (line.kind === 'kebab') {
      const base = BASES.find((b) => b.id === line.config.base)?.shortName ?? line.config.base;
      const bread = BREADS.find((b) => b.id === line.config.bread)?.name ?? '';
      return `${base} (${bread})`;
    }
    if (line.kind === 'menu') return line.itemName + (line.promoApplied ? ' (Aktion)' : '');
    return `${line.drinkName} ${line.variantLabel}`;
  }

  function lineDetails(line: CartLine): string {
    if (line.kind !== 'kebab') {
      if (line.kind === 'drink' && line.unitDepositEur > 0) {
        return `+ ${formatEUR(line.unitDepositEur)} Pfand pro Stück`;
      }
      return '';
    }
    const parts: string[] = [];
    const meat = MEATS.find((m) => m.id === line.config.meat);
    if (meat) parts.push(meat.name);
    if (line.config.meatUpgradeSteak) parts.push('Steak-Upgrade');
    if (line.config.extraMeat50g > 0) parts.push(`+${line.config.extraMeat50g}× 50 g Fleisch`);
    if (line.config.schmelzkaese) parts.push('Schmelzkäse');
    if (line.config.sauces.length > 0) {
      parts.push(
        'Soßen: ' + line.config.sauces.map((s) => SAUCES.find((x) => x.id === s)?.name ?? s).join(', '),
      );
    }
    if (line.config.toppings.length > 0) {
      parts.push(
        'Toppings: ' + line.config.toppings.map((t) => TOPPINGS.find((x) => x.id === t)?.name ?? t).join(', '),
      );
    }
    return parts.join(' · ');
  }

  function renderLines() {
    const lines = $lines.get();
    itemsList.replaceChildren();
    if (lines.length === 0) {
      empty.hidden = false;
    } else {
      empty.hidden = true;
      for (const line of lines) {
        const li = document.createElement('li');
        li.className = 'card p-3 flex flex-col gap-2';
        li.dataset.lineId = line.id;

        const top = document.createElement('div');
        top.className = 'flex items-start justify-between gap-2';
        const title = document.createElement('p');
        title.className = 'text-brand-cream text-sm font-semibold';
        title.textContent = lineSummary(line);
        const right = document.createElement('div');
        right.className = 'flex flex-col items-end gap-1';
        const price = document.createElement('span');
        price.className = 'text-brand-gold font-semibold text-sm';
        price.textContent = formatEUR(line.unitPriceEur * line.quantity);
        right.appendChild(price);
        top.append(title, right);
        li.appendChild(top);

        const details = lineDetails(line);
        if (details) {
          const p = document.createElement('p');
          p.className = 'text-xs text-brand-cream/55';
          p.textContent = details;
          li.appendChild(p);
        }

        const stepperRow = document.createElement('div');
        stepperRow.className = 'flex items-center justify-between gap-2 mt-1';
        const stepper = document.createElement('div');
        stepper.className = 'inline-flex items-center gap-1';
        const dec = document.createElement('button');
        dec.type = 'button';
        dec.className = 'btn-secondary !px-2 !py-1';
        dec.setAttribute('aria-label', 'Weniger');
        dec.textContent = '−';
        dec.addEventListener('click', () => setQuantity(line.id, line.quantity - 1));
        const qty = document.createElement('span');
        qty.className = 'min-w-6 text-center font-mono text-brand-cream';
        qty.textContent = String(line.quantity);
        const inc = document.createElement('button');
        inc.type = 'button';
        inc.className = 'btn-secondary !px-2 !py-1';
        inc.setAttribute('aria-label', 'Mehr');
        inc.textContent = '+';
        inc.addEventListener('click', () => setQuantity(line.id, line.quantity + 1));
        stepper.append(dec, qty, inc);
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'text-xs text-brand-cream/60 hover:text-brand-red-fire';
        remove.textContent = 'Entfernen';
        remove.addEventListener('click', () => removeLine(line.id));
        stepperRow.append(stepper, remove);
        li.appendChild(stepperRow);

        itemsList.appendChild(li);
      }
    }
  }

  function renderTotals() {
    const t = $totals.get();
    totalsItems.textContent = formatEUR(t.itemsSubtotalEur);
    totalsDepositRow.hidden = !(t.depositSubtotalEur > 0);
    totalsDeposit.textContent = formatEUR(t.depositSubtotalEur);
    if ($customer.get().fulfillment === 'lieferung') {
      totalsFeeRow.hidden = false;
      totalsFee.textContent =
        t.deliveryFeeEur === null ? 'nach Absprache' : formatEUR(t.deliveryFeeEur);
    } else {
      totalsFeeRow.hidden = true;
    }
    totalsGrand.textContent = formatEUR(t.grandTotalEur);

    let warn = '';
    if ($customer.get().fulfillment === 'lieferung' && t.belowDeliveryMinimum) {
      warn = `Lieferung erst ab ${formatEUR(20)}. Bitte mehr Artikel hinzufügen.`;
    }
    warning.hidden = warn === '';
    warning.textContent = warn;
    checkout.disabled = $lines.get().length === 0 || !!warn;

    const count = $itemCount.get();
    if (bar) bar.hidden = count === 0;
    if (barCount) barCount.textContent = String(count);
    if (barTotal) barTotal.textContent = formatEUR(t.grandTotalEur);
  }

  function renderCustomer() {
    const c = $customer.get();
    firstName.value = c.firstName;
    notes.value = c.notes ?? '';
    deliveryBlock.hidden = c.fulfillment !== 'lieferung';
    if (c.delivery) {
      zoneSel.value = c.delivery.zoneId;
      plzInp.value = c.delivery.postalCode;
      streetInp.value = c.delivery.street;
    }
    root!.querySelectorAll<HTMLButtonElement>('[data-cart-fulfillment]').forEach((btn) => {
      const active = btn.getAttribute('data-cart-fulfillment') === c.fulfillment;
      btn.setAttribute('aria-pressed', String(active));
      btn.setAttribute('data-active', String(active));
    });
  }

  function setOpen(open: boolean) {
    root!.classList.toggle('hidden', !open);
    root!.setAttribute('aria-hidden', String(!open));
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) close.focus();
  }

  // Subscriptions
  $lines.subscribe(() => { renderLines(); renderTotals(); });
  $customer.subscribe(() => { renderCustomer(); renderTotals(); });
  $isCartOpen.subscribe(setOpen);

  // Event wiring
  close.addEventListener('click', closeCart);
  backdrop.addEventListener('click', closeCart);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && $isCartOpen.get()) closeCart();
  });
  if (openBarBtn) openBarBtn.addEventListener('click', openCart);

  clearBtn.addEventListener('click', () => {
    if (confirm('Wirklich alle Artikel entfernen?')) clearCart();
  });

  firstName.addEventListener('input', () => patchCustomer({ firstName: firstName.value.slice(0, 60) }));
  notes.addEventListener('input', () => patchCustomer({ notes: sanitizeNotes(notes.value) }));
  pickupSel.addEventListener('change', () => {
    patchCustomer({
      pickup: pickupSel.value === 'asap'
        ? { kind: 'asap' }
        : { kind: 'scheduled', iso: pickupSel.value },
    });
  });

  root.querySelectorAll<HTMLButtonElement>('[data-cart-fulfillment]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const mode = btn.getAttribute('data-cart-fulfillment') as FulfillmentMode;
      patchCustomer({ fulfillment: mode });
    });
  });

  function syncDeliveryAddress() {
    if ($customer.get().fulfillment !== 'lieferung') return;
    patchCustomer({
      delivery: {
        zoneId: zoneSel.value,
        postalCode: plzInp.value.slice(0, 5),
        street: streetInp.value.slice(0, 120),
      },
    });
  }
  zoneSel.addEventListener('change', syncDeliveryAddress);
  plzInp.addEventListener('input', syncDeliveryAddress);
  streetInp.addEventListener('input', syncDeliveryAddress);

  checkout.addEventListener('click', () => {
    if (!canSendWhatsApp()) {
      warning.hidden = false;
      warning.textContent = 'Bitte einen Moment warten, bevor du erneut sendest.';
      return;
    }
    const preview = currentWhatsAppPreview();
    if (!confirm('Deine Bestellung wird in WhatsApp geöffnet:\n\n' + preview)) return;
    const url = currentWhatsAppUrl(checkout.dataset.waNumber);
    recordWhatsAppSend();
    window.open(url, '_blank', 'noopener,noreferrer');
  });

  // Initial render
  renderLines();
  renderTotals();
  renderCustomer();
}
