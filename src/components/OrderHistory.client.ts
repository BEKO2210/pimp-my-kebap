// Powered by skill: frontend-design, security
import { listOrders, clearHistory } from '../lib/history';
import { $lines, $customer, openCart } from '../lib/cart';
import { computeTotals } from '../lib/whatsapp';
import { formatEUR } from '../lib/format';
import { toast } from '../lib/toast';
import type { CartLine } from '../lib/cart-types';

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

  function reorder(lines: CartLine[]) {
    // Append a fresh copy with new ids so the cart reducer treats them as new
    const cloned: CartLine[] = lines.map((l) => ({
      ...l,
      id: 'reorder-' + Math.random().toString(36).slice(2, 10),
    }));
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
      reorderBtn.className = 'btn-secondary text-xs mt-auto';
      reorderBtn.textContent = '↻ Erneut bestellen';
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
