// Powered by skill: frontend-design, security
// Wires "+ Hinzufügen" buttons on every menu item card to the cart store.
import { addLine, openCart } from '../../lib/cart';
import type { MenuCategory } from '../../data/menu';

document.querySelectorAll<HTMLElement>('[data-item-id]').forEach((card) => {
  const btn = card.querySelector<HTMLButtonElement>('[data-item-add]');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const id = card.getAttribute('data-item-id') ?? '';
    const name = card.getAttribute('data-item-name') ?? id;
    const cat = (card.getAttribute('data-item-category') as MenuCategory) ?? 'drehspiess';
    const priceStr = card.getAttribute('data-item-price') ?? '';
    const promo = card.getAttribute('data-item-promo') === 'true';
    const price = Number.parseFloat(priceStr);
    if (Number.isNaN(price)) return;
    addLine({
      kind: 'menu',
      quantity: 1,
      itemId: id,
      itemName: name,
      category: cat,
      unitPriceEur: price,
      promoApplied: promo,
    });
    if (navigator.vibrate) navigator.vibrate(10);
    openCart();
  });
});
