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
import { BRAND } from '../../data/brand';
import { BREADS } from '../../data/breads';
import { BASES, MEATS } from '../../data/configurator';
import { SAUCES } from '../../data/sauces';
import { TOPPINGS } from '../../data/ingredients';
import { MIN_DELIVERY_ORDER_EUR } from '../../data/delivery';
import { copyShareCartLink } from '../../lib/share-cart';
import { recordOrder } from '../../lib/history';
import { toast } from '../../lib/toast';
import { getCurrentOpeningStatus } from '../../lib/time';

const root = document.querySelector<HTMLElement>('[data-cart-root]');
if (root) {
  // Track which delivery fields the user has interacted with — we only paint
  // the red invalid border after they've actually touched the field, never on
  // first open of an empty form.
  let plzTouched = false;
  let streetTouched = false;
  // Last seen item count so we can pulse the cart bar only when it grows.
  let previousCount = 0;

  const itemsList = root.querySelector<HTMLUListElement>('[data-cart-items]')!;
  const headerCount = root.querySelector<HTMLElement>('[data-cart-header-count]')!;
  const scrollArea = root.querySelector<HTMLElement>('[data-cart-scroll]')!;
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
  const shareBtn = root.querySelector<HTMLButtonElement>('[data-cart-share]')!;
  const printBtn = root.querySelector<HTMLButtonElement>('[data-cart-print]')!;
  const firstName = root.querySelector<HTMLInputElement>('[data-cart-firstname]')!;
  const pickupSel = root.querySelector<HTMLSelectElement>('[data-cart-pickup]')!;
  const notes = root.querySelector<HTMLTextAreaElement>('[data-cart-notes]')!;
  const deliveryBlock = root.querySelector<HTMLElement>('[data-cart-delivery]')!;
  const zoneSel = root.querySelector<HTMLSelectElement>('[data-cart-zone]')!;
  const plzInp = root.querySelector<HTMLInputElement>('[data-cart-plz]')!;
  const streetInp = root.querySelector<HTMLInputElement>('[data-cart-street]')!;
  const pickupLabel = root.querySelector<HTMLElement>('[data-cart-pickup-label]')!;
  const fulfillmentBtns = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-cart-fulfillment]'));

  const bar = document.querySelector<HTMLElement>('[data-cart-bar]');
  const barCount = document.querySelector<HTMLElement>('[data-cart-bar-count]');
  const barTotal = document.querySelector<HTMLElement>('[data-cart-bar-total]');
  const openBarBtn = document.querySelector<HTMLButtonElement>('[data-cart-open-bar]');

  // Pickup time options: 15-min steps starting at max(now+20m, todayOpen),
  // ending at todayClose. Closed days (Sunday) only show ASAP.
  function buildPickupOptions() {
    pickupSel.replaceChildren();
    const asap = document.createElement('option');
    asap.value = 'asap';
    asap.textContent = 'So schnell wie möglich';
    pickupSel.appendChild(asap);

    const status = getCurrentOpeningStatus();
    if (!status.todayOpen || !status.todayClose) return; // closed all day

    const now = new Date();
    const [openH, openM] = status.todayOpen.split(':').map((n) => Number.parseInt(n, 10));
    const [closeH, closeM] = status.todayClose.split(':').map((n) => Number.parseInt(n, 10));

    // Start at max(now+20min, todayOpen)
    const earliest = new Date(now.getTime() + 20 * 60_000);
    earliest.setSeconds(0, 0);
    const todayOpenDate = new Date(now);
    todayOpenDate.setHours(openH ?? 10, openM ?? 30, 0, 0);
    if (earliest < todayOpenDate) earliest.setTime(todayOpenDate.getTime());

    // Round up to next 15-min step
    const minutesPast = earliest.getMinutes() % 15;
    if (minutesPast !== 0) earliest.setMinutes(earliest.getMinutes() + (15 - minutesPast));

    const closing = new Date(now);
    closing.setHours(closeH ?? 21, closeM ?? 0, 0, 0);

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

  /**
   * Rebuild the pickup-time options and preserve the user's selection if it's
   * still in the future. Called every time the drawer opens, otherwise a slot
   * picked many minutes ago could already be in the past.
   */
  function rebuildPickupOptions() {
    const previous = pickupSel.value;
    buildPickupOptions();
    const stillValid = Array.from(pickupSel.options).some((o) => o.value === previous);
    if (stillValid) {
      pickupSel.value = previous;
    } else if (previous !== 'asap') {
      // Previously chosen ISO is no longer offered (now in the past). Reset
      // to ASAP and sync the store so the WhatsApp message doesn't carry it.
      pickupSel.value = 'asap';
      patchCustomer({ pickup: { kind: 'asap' } });
    }
  }

  function lineSummary(line: CartLine): string {
    if (line.kind === 'kebab') {
      const base = BASES.find((b) => b.id === line.config.base)?.shortName ?? line.config.base;
      // Bread label is only relevant for Kebap Basic (im Brot).
      if (line.config.base !== 'kebap_basic') return base;
      const bread = BREADS.find((b) => b.id === line.config.bread)?.name ?? '';
      return `${base} (${bread})`;
    }
    if (line.kind === 'menu') return line.itemName + (line.promoApplied ? ' (Aktion)' : '');
    return `${line.drinkName} ${line.variantLabel}`;
  }

  function lineDetails(line: CartLine): string {
    if (line.kind === 'menu') {
      const parts: string[] = [];
      if (line.optionsLabel) parts.push(line.optionsLabel);
      if (line.notes?.trim()) parts.push(`Anm.: ${line.notes.trim()}`);
      return parts.join(' · ');
    }
    if (line.kind === 'drink') {
      return line.unitDepositEur > 0 ? `+ ${formatEUR(line.unitDepositEur)} Pfand pro Stück` : '';
    }
    const parts: string[] = [];
    const meat = MEATS.find((m) => m.id === line.config.meat);
    if (meat) parts.push(meat.name);
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
      return;
    }
    empty.hidden = true;
    for (const line of lines) {
      const li = document.createElement('li');
      li.className = 'card p-3 flex flex-col gap-2';
      li.dataset.lineId = line.id;

      const top = document.createElement('div');
      top.className = 'flex items-start justify-between gap-3';
      const title = document.createElement('p');
      title.className = 'display text-base text-brand-cream leading-tight';
      title.textContent = lineSummary(line);
      const price = document.createElement('span');
      price.className = 'text-brand-gold font-semibold text-base num shrink-0';
      price.textContent = formatEUR(line.unitPriceEur * line.quantity);
      top.append(title, price);
      li.appendChild(top);

      const details = lineDetails(line);
      if (details) {
        const p = document.createElement('p');
        p.className = 'text-xs text-brand-cream/60 leading-relaxed';
        p.textContent = details;
        li.appendChild(p);
      }

      const stepperRow = document.createElement('div');
      stepperRow.className = 'flex items-center justify-between gap-2 mt-1';
      const stepper = document.createElement('div');
      stepper.className = 'inline-flex items-center gap-2';
      const dec = document.createElement('button');
      dec.type = 'button';
      dec.className = 'btn-secondary !px-3 !py-1.5 text-base';
      dec.setAttribute('aria-label', 'Weniger');
      dec.textContent = '−';
      dec.addEventListener('click', () => setQuantity(line.id, line.quantity - 1));
      const qty = document.createElement('span');
      qty.className = 'min-w-[1.5rem] text-center font-semibold num text-brand-cream';
      qty.textContent = String(line.quantity);
      const inc = document.createElement('button');
      inc.type = 'button';
      inc.className = 'btn-secondary !px-3 !py-1.5 text-base';
      inc.setAttribute('aria-label', 'Mehr');
      inc.textContent = '+';
      inc.addEventListener('click', () => setQuantity(line.id, line.quantity + 1));
      stepper.append(dec, qty, inc);
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'text-xs text-brand-cream/60 hover:text-brand-red-fire transition-colors';
      remove.textContent = 'Entfernen';
      remove.addEventListener('click', () => removeLine(line.id));
      stepperRow.append(stepper, remove);
      li.appendChild(stepperRow);

      itemsList.appendChild(li);
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
    let plzInvalid = false;
    let streetInvalid = false;
    const c = $customer.get();
    if (c.fulfillment === 'lieferung') {
      const plzMissing = !c.delivery?.postalCode?.trim();
      const plzBadFormat = !plzMissing && !/^\d{5}$/.test(c.delivery!.postalCode.trim());
      const streetMissing = !c.delivery?.street?.trim();
      plzInvalid = plzMissing || plzBadFormat;
      streetInvalid = streetMissing;
      if (t.belowDeliveryMinimum) {
        warn = `Lieferung erst ab ${formatEUR(MIN_DELIVERY_ORDER_EUR)}. Bitte mehr Artikel hinzufügen.`;
      } else if (plzMissing || streetMissing) {
        warn = 'Lieferung: PLZ und Straße eingeben.';
      } else if (plzBadFormat) {
        warn = 'PLZ muss 5 Ziffern haben (z. B. 71691).';
      }
    }
    warning.hidden = warn === '';
    warning.textContent = warn;
    checkout.disabled = $lines.get().length === 0 || !!warn;

    // Visual invalid state — only after the user has actually touched the
    // field. We don't want the form to scream red on first open.
    const showPlzError = plzInvalid && plzTouched && c.fulfillment === 'lieferung';
    const showStreetError = streetInvalid && streetTouched && c.fulfillment === 'lieferung';
    plzInp.toggleAttribute('aria-invalid', showPlzError);
    streetInp.toggleAttribute('aria-invalid', showStreetError);

    const count = $itemCount.get();
    if (bar) {
      bar.hidden = count === 0;
      // Gold pulse on the bar whenever the count rises — visual confirmation
      // that the click on a Speisekarte/Drink "+" actually reached the cart,
      // without forcing the drawer open.
      if (count > previousCount && count > 0) {
        bar.classList.remove('cart-bar-pulse');
        void bar.offsetWidth;
        bar.classList.add('cart-bar-pulse');
      }
    }
    previousCount = count;
    // Body class lets the configurator's sticky footer lift itself above the
    // mobile cart bar so its "In den Warenkorb"-button stays visible.
    document.body.classList.toggle('has-cart-bar', count > 0);
    if (barCount) barCount.textContent = String(count);
    if (barTotal) barTotal.textContent = formatEUR(t.grandTotalEur);
    headerCount.textContent = count === 0 ? '' : `${count} Artikel`;
  }

  const PICKUP_LABEL: Record<FulfillmentMode, string> = {
    abholung: 'Abholzeit',
    'vor-ort': 'Wunsch-Uhrzeit',
    lieferung: 'Lieferzeit',
  };

  function renderCustomer() {
    const c = $customer.get();
    // Avoid clobbering inputs the user is currently editing — and avoid
    // triggering input events that would bounce back through patchCustomer.
    if (firstName.value !== c.firstName) firstName.value = c.firstName;
    const notesValue = c.notes ?? '';
    if (notes.value !== notesValue) notes.value = notesValue;
    deliveryBlock.hidden = c.fulfillment !== 'lieferung';
    pickupLabel.textContent = PICKUP_LABEL[c.fulfillment];
    if (c.delivery) {
      if (zoneSel.value !== c.delivery.zoneId) zoneSel.value = c.delivery.zoneId;
      if (plzInp.value !== c.delivery.postalCode) plzInp.value = c.delivery.postalCode;
      if (streetInp.value !== c.delivery.street) streetInp.value = c.delivery.street;
    }
    for (const btn of fulfillmentBtns) {
      const active = btn.getAttribute('data-cart-fulfillment') === c.fulfillment;
      btn.setAttribute('aria-pressed', String(active));
      btn.setAttribute('data-active', String(active));
    }
  }

  function setOpen(open: boolean) {
    if (open) {
      rebuildPickupOptions();
      scrollArea.scrollTop = 0;
    }
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

  for (const btn of fulfillmentBtns) {
    btn.addEventListener('click', () => {
      const mode = btn.getAttribute('data-cart-fulfillment') as FulfillmentMode;
      patchCustomer({ fulfillment: mode });
    });
  }

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
  plzInp.addEventListener('input', () => {
    plzTouched = true;
    syncDeliveryAddress();
  });
  streetInp.addEventListener('input', () => {
    streetTouched = true;
    syncDeliveryAddress();
  });

  // Practical ceiling for wa.me URLs. WhatsApp, the OS share-sheet and some
  // Android WebViews start truncating long prefilled messages around 7-8 KB.
  // Below this we let the order through; above we tell the customer to call.
  const WHATSAPP_URL_SAFE_LIMIT = 6500;

  checkout.addEventListener('click', () => {
    if (!canSendWhatsApp()) {
      warning.hidden = false;
      warning.textContent = 'Bitte einen Moment warten, bevor du erneut sendest.';
      return;
    }
    const url = currentWhatsAppUrl(checkout.dataset.waNumber);
    const status = getCurrentOpeningStatus();
    const c = $customer.get();

    const hints: string[] = [];
    if (!status.isOpen && c.pickup.kind === 'asap') {
      const next = status.nextOpenLabel ?? 'morgen';
      hints.push(`Wir haben gerade geschlossen — wir bearbeiten deine Bestellung ${next}.`);
    }
    if (url.length > WHATSAPP_URL_SAFE_LIMIT) {
      const sizeKb = Math.round((url.length / 1024) * 10) / 10;
      hints.push(
        `Deine Bestellung ist sehr lang (${sizeKb.toString().replace('.', ',')} KB). ` +
        `WhatsApp könnte die Nachricht abschneiden. ` +
        `Sicher geht's per Telefon: ${BRAND.contact.phoneDisplay}.`,
      );
    }

    const confirmText =
      (hints.length > 0 ? hints.map((h) => 'Hinweis: ' + h).join('\n\n') + '\n\n' : '') +
      'Deine Bestellung wird in WhatsApp geöffnet:\n\n' +
      currentWhatsAppPreview();

    if (!confirm(confirmText)) return;
    recordWhatsAppSend();
    recordOrder($lines.get(), $customer.get());
    window.open(url, '_blank', 'noopener,noreferrer');
    toast('Bestellung gesendet — bitte WhatsApp prüfen', { tone: 'success', ms: 5000 });
  });

  shareBtn.addEventListener('click', () => {
    if ($lines.get().length === 0) {
      toast('Erst Artikel in den Warenkorb, dann teilen.', { tone: 'info' });
      return;
    }
    void copyShareCartLink();
  });

  printBtn.addEventListener('click', () => {
    if ($lines.get().length === 0) {
      toast('Warenkorb ist leer — nichts zu drucken.', { tone: 'info' });
      return;
    }
    const body = document.getElementById('print-receipt-body');
    if (body) body.textContent = currentWhatsAppPreview();
    window.print();
  });

  // Initial render
  renderLines();
  renderTotals();
  renderCustomer();
}
