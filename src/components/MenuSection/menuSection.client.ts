// Powered by skill: frontend-design, security
// Wires +/- steppers on every menu card to the cart store.
// The displayed quantity reflects the current cart contents reactively.
import { addLine, setQuantity, removeLine, openCart, $lines } from '../../lib/cart';
import type { CartLine, MenuItemCartLine } from '../../lib/cart-types';
import type { MenuCategory } from '../../data/menu';

const isMenuLine = (l: CartLine): l is MenuItemCartLine => l.kind === 'menu';

const cards = Array.from(document.querySelectorAll<HTMLElement>('article[data-item-id]'));
if (cards.length > 0) {
  // Build a map of itemId → cards (an item may appear in multiple sections).
  const cardsByItem = new Map<string, HTMLElement[]>();
  for (const card of cards) {
    const id = card.dataset.itemId ?? '';
    const list = cardsByItem.get(id) ?? [];
    list.push(card);
    cardsByItem.set(id, list);
  }

  function syncCardsForItem(itemId: string) {
    const cards = cardsByItem.get(itemId) ?? [];
    const total = $lines
      .get()
      .filter(isMenuLine)
      .filter((l) => l.itemId === itemId)
      .reduce((s, l) => s + l.quantity, 0);
    for (const card of cards) {
      const qtyEl = card.querySelector<HTMLElement>('[data-item-qty]');
      const dec = card.querySelector<HTMLButtonElement>('[data-item-dec]');
      if (qtyEl) qtyEl.textContent = String(total);
      if (dec) dec.disabled = total === 0;
    }
  }

  function syncAll() {
    for (const id of cardsByItem.keys()) syncCardsForItem(id);
  }
  syncAll();
  $lines.subscribe(() => syncAll());

  function findFirstLineForItem(itemId: string): MenuItemCartLine | undefined {
    return $lines.get().filter(isMenuLine).find((l) => l.itemId === itemId);
  }

  for (const card of cards) {
    const id = card.dataset.itemId ?? '';
    const name = card.dataset.itemName ?? id;
    const cat = (card.dataset.itemCategory as MenuCategory) ?? 'drehspiess';
    const promo = card.dataset.itemPromo === 'true';
    const price = Number.parseFloat(card.dataset.itemPrice ?? '');
    const orderable = card.dataset.itemOrderable !== 'false';
    const hasOptions = card.dataset.itemHasOptions === 'true';
    const optionsRaw = card.dataset.itemOptions;

    const incBtn = card.querySelector<HTMLButtonElement>('[data-item-inc]');
    const decBtn = card.querySelector<HTMLButtonElement>('[data-item-dec]');

    if (incBtn) {
      incBtn.addEventListener('click', () => {
        if (Number.isNaN(price)) return;
        if (!orderable) return; // server-rendered as not orderable; ignore stray clicks
        // Items with options always open the dialog. Quantity stepper still
        // works on the - side for previously-added (configured) lines.
        if (hasOptions && optionsRaw) {
          const open = (window as unknown as { __openItemOptions?: (p: unknown) => void }).__openItemOptions;
          if (open) {
            try {
              open(JSON.parse(optionsRaw));
              return;
            } catch {
              // fall through to direct add as a last resort
            }
          }
        }
        const existing = findFirstLineForItem(id);
        if (existing) {
          setQuantity(existing.id, existing.quantity + 1);
        } else {
          addLine({
            kind: 'menu',
            quantity: 1,
            itemId: id,
            itemName: name,
            category: cat,
            unitPriceEur: price,
            promoApplied: promo,
          });
        }
        if (navigator.vibrate) navigator.vibrate(8);
        // Brief gold pulse on the +-button so the customer sees the click landed.
        incBtn.classList.remove('cart-added-pulse');
        void incBtn.offsetWidth;
        incBtn.classList.add('cart-added-pulse');
      });
    }

    if (decBtn) {
      decBtn.addEventListener('click', () => {
        const existing = findFirstLineForItem(id);
        if (!existing) return;
        if (existing.quantity <= 1) {
          removeLine(existing.id);
        } else {
          setQuantity(existing.id, existing.quantity - 1);
        }
      });
    }
  }

  // No auto-open on the menu page — the toast + sticky bottom bar give
  // enough feedback. Auto-open only happens for the dedicated configurators.
  void openCart;
}
