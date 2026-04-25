// Powered by skill: frontend-design, security
import { addLine } from '../../lib/cart';

function flashAddedConfirmation(btn: HTMLButtonElement) {
  // Brief gold pulse on the +-button so the customer sees the click landed.
  btn.classList.remove('cart-added-pulse');
  // Force a reflow so the animation re-runs even on rapid repeat clicks.
  void btn.offsetWidth;
  btn.classList.add('cart-added-pulse');
}

document.querySelectorAll<HTMLButtonElement>('[data-drink-add]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const id = btn.getAttribute('data-drink-id') ?? '';
    const name = btn.getAttribute('data-drink-name') ?? id;
    const variant = btn.getAttribute('data-variant-label') ?? '';
    const price = Number.parseFloat(btn.getAttribute('data-price') ?? '0');
    const deposit = Number.parseFloat(btn.getAttribute('data-deposit') ?? '0');
    if (Number.isNaN(price)) return;
    addLine({
      kind: 'drink',
      quantity: 1,
      drinkId: id,
      drinkName: name,
      variantLabel: variant,
      unitPriceEur: price,
      unitDepositEur: Number.isNaN(deposit) ? 0 : deposit,
    });
    if (navigator.vibrate) navigator.vibrate(10);
    flashAddedConfirmation(btn);
  });
});
