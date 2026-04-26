// Powered by skill: frontend-design, security
import { listOrders, clearHistory } from '../lib/history';
import { $lines, openCart } from '../lib/cart';
import { computeTotals } from '../lib/whatsapp';
import { formatEUR } from '../lib/format';
import { toast } from '../lib/toast';
import { priceKebab, effectiveMenuPrice } from '../lib/pricing';
import { getCurrentWeekday } from '../lib/time';
import { MENU } from '../data/menu';
import { DRINKS } from '../data/drinks';
import type { CartLine } from '../lib/cart-types';

const SVG_NS = 'http://www.w3.org/2000/svg';
function buildRepeatIcon(): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('width', '14');
  svg.setAttribute('height', '14');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  const append = (tag: string, attrs: Record<string, string>) => {
    const el = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    svg.appendChild(el);
  };
  // lucide: rotate-cw
  append('path', { d: 'M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8' });
  append('path', { d: 'M21 3v5h-5' });
  return svg;
}

const root = document.querySelector<HTMLElement>('[data-history-root]');
if (root) {
  const listEl = root.querySelector<HTMLUListElement>('[data-history-list]')!;
  const clearBtn = root.querySelector<HTMLButtonElement>('[data-history-clear]')!;

  function summary(lines: CartLine[]): string {
    const c = lines.length;
    const labels = lines
      .map((l) => {
        if (l.kind === 'kebab') return `Kebap`;
        if (l.kind === 'menu') return l.itemName;
        return l.drinkName;
      })
      .slice(0, 3);
    const more = c > labels.length ? ` +${c - labels.length}` : '';
    return labels.join(' · ') + more;
  }

  function dateLabel(ts: number): string {
    return new Intl.DateTimeFormat('de-DE', {
      timeZone: 'Europe/Berlin',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(ts));
  }

  /**
   * Reapply prices to the cloned lines using *today's* pricing rules.
   * Without this, a Mo-promo Dönerteller (11 €) would re-enter the cart at
   * 11 € on a Tuesday — which is wrong (regular price 13 €).
   * Lines whose source item is no longer on the menu are skipped (e.g. a
   * pimp-pizza-... saved months ago) — those keep their stored unit price.
   */
  function repriceLine(l: CartLine): CartLine {
    const id = 'reorder-' + Math.random().toString(36).slice(2, 10);
    if (l.kind === 'kebab') {
      // Kebab price is fully derived from config — recompute deterministically.
      const breakdown = priceKebab(l.config);
      return { ...l, id, unitPriceEur: breakdown.unitTotal };
    }
    if (l.kind === 'menu') {
      const item = MENU.find((m) => m.id === l.itemId);
      if (item) {
        const today = getCurrentWeekday();
        const eff = effectiveMenuPrice(item, today);
        if (eff !== null) {
          // Sum option price-deltas back in (e.g. Steak +1,00 €, Schmelzkäse
          // +1,00 €) so reorder doesn't silently drop the upcharges the
          // customer originally picked. Multi-options carry an array.
          let delta = 0;
          if (l.selectedOptions && item.options) {
            for (const opt of item.options) {
              const raw = l.selectedOptions[opt.id];
              const ids = Array.isArray(raw) ? raw : raw ? [raw] : [];
              for (const choiceId of ids) {
                const choice = opt.choices.find((c) => c.id === choiceId);
                if (choice?.priceDeltaEur) delta += choice.priceDeltaEur;
              }
            }
          }
          const promo = item.priceEur !== null && eff < item.priceEur;
          return { ...l, id, unitPriceEur: eff + delta, promoApplied: promo };
        }
      }
      return { ...l, id };
    }
    // l.kind === 'drink' (only remaining branch)
    const drink = DRINKS.find((d) => d.id === l.drinkId);
    const variant = drink?.variants.find((v) => v.id === l.id || v.label === l.variantLabel);
    if (drink && variant) {
      return { ...l, id, unitPriceEur: variant.priceEur, unitDepositEur: variant.depositEur };
    }
    return { ...l, id };
  }

  function reorder(lines: CartLine[]) {
    const cloned: CartLine[] = lines.map(repriceLine);
    $lines.set([...$lines.get(), ...cloned]);
    openCart();
    toast('Bestellung erneut in den Warenkorb gelegt', { tone: 'success' });
  }

  function render() {
    const orders = listOrders();
    if (orders.length === 0) {
      root!.hidden = true;
      return;
    }
    root!.hidden = false;
    listEl.replaceChildren();
    for (const order of orders) {
      const totals = computeTotals(order.lines as CartLine[], {
        fulfillment: order.customer.fulfillment,
        deliveryZoneId: order.customer.delivery?.zoneId,
      });
      const li = document.createElement('li');
      li.className = 'card p-4 flex flex-col gap-2';

      const date = document.createElement('p');
      date.className = 'eyebrow';
      date.textContent = dateLabel(order.at);
      li.appendChild(date);

      const sum = document.createElement('p');
      sum.className = 'text-brand-cream text-sm';
      sum.textContent = summary(order.lines as CartLine[]);
      li.appendChild(sum);

      const total = document.createElement('p');
      total.className = 'display text-xl text-brand-gold num';
      total.textContent = formatEUR(totals.grandTotalEur);
      li.appendChild(total);

      const reorderBtn = document.createElement('button');
      reorderBtn.type = 'button';
      reorderBtn.className = 'btn-secondary text-xs mt-auto inline-flex items-center justify-center gap-1.5';
      reorderBtn.append(buildRepeatIcon(), document.createTextNode('Erneut bestellen'));
      reorderBtn.addEventListener('click', () => reorder(order.lines as CartLine[]));
      li.appendChild(reorderBtn);

      listEl.appendChild(li);
    }
  }

  clearBtn.addEventListener('click', () => {
    if (confirm('Bestellverlauf wirklich löschen?')) {
      clearHistory();
      render();
      toast('Verlauf gelöscht', { tone: 'info' });
    }
  });

  render();
  // Re-render when localStorage changes from another tab.
  window.addEventListener('storage', (e) => {
    if (e.key && e.key.includes('history')) render();
  });
}
