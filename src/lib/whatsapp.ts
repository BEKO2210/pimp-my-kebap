// Powered by skill: security
// Pure functions that turn the cart into a human-readable WhatsApp message.

import type { CartLine, CustomerInfo, CartTotals } from './cart-types';
import { formatEUR, round2 } from './format';
import { BREADS } from '../data/breads';
import { BASES, MEATS } from '../data/configurator';
import { SAUCES } from '../data/sauces';
import { TOPPINGS } from '../data/ingredients';
import { BRAND, resolveWhatsAppNumber } from '../data/brand';
import { findZone, MIN_DELIVERY_ORDER_EUR, DELIVERY_ZONE_OTHER } from '../data/delivery';

const SEPARATOR = '─────────────────────────────────';

function nameOf<T extends { id: string; name: string }>(list: readonly T[], id: string): string {
  return list.find((x) => x.id === id)?.name ?? id;
}
function shortOf<T extends { id: string; shortName: string }>(list: readonly T[], id: string): string {
  return list.find((x) => x.id === id)?.shortName ?? id;
}

function describeKebab(line: Extract<CartLine, { kind: 'kebab' }>): string[] {
  const { config } = line;
  const baseLabel = shortOf(BASES, config.base);
  const breadLabel = nameOf(BREADS, config.bread);
  const meat = MEATS.find((m) => m.id === config.meat)!;
  const out: string[] = [];
  out.push(`${line.quantity}x ${baseLabel} (${breadLabel})`);

  if (meat.upchargeEur > 0) {
    out.push(`   • Fleisch: ${meat.name} (+${formatEUR(meat.upchargeEur)})`);
  } else {
    out.push(`   • Fleisch: ${meat.name}`);
  }
  if (config.extraMeat50g > 0) {
    out.push(
      `   • Mehr Fleisch: ${config.extraMeat50g}× 50 g (+${formatEUR(config.extraMeat50g * 1.5)})`,
    );
  }
  if (config.schmelzkaese) {
    out.push(`   • Schmelzkäse: ja (+${formatEUR(1.0)})`);
  }
  if (config.sauces.length > 0) {
    const sauceNames = config.sauces.map((s) => nameOf(SAUCES, s));
    const extra = Math.max(0, config.sauces.length - 2);
    const extraText = extra > 0 ? ` (${extra}× +${formatEUR(0.5)})` : '';
    out.push(`   • Soßen: ${sauceNames.join(', ')}${extraText}`);
  }
  if (config.toppings.length > 0) {
    const toppingNames = config.toppings.map((t) => nameOf(TOPPINGS, t));
    out.push(
      `   • Toppings: ${toppingNames.join(', ')} (${config.toppings.length}× +${formatEUR(0.5)})`,
    );
  }
  if (line.notes && line.notes.trim()) {
    out.push(`   • Anmerkung: ${line.notes.trim()}`);
  }
  out.push(`   = ${formatEUR(round2(line.unitPriceEur * line.quantity))}`);
  return out;
}

function describeMenuItem(line: Extract<CartLine, { kind: 'menu' }>): string[] {
  const promo = line.promoApplied ? ' (Aktion)' : '';
  return [
    `${line.quantity}x ${line.itemName}${promo}`,
    line.notes && line.notes.trim() ? `   • Anmerkung: ${line.notes.trim()}` : null,
    `   = ${formatEUR(round2(line.unitPriceEur * line.quantity))}`,
  ].filter((s): s is string => s !== null);
}

function describeDrink(line: Extract<CartLine, { kind: 'drink' }>): string[] {
  const itemTotal = round2(line.unitPriceEur * line.quantity);
  const depositTotal = round2(line.unitDepositEur * line.quantity);
  return depositTotal > 0
    ? [`${line.quantity}x ${line.drinkName} (${line.variantLabel})`,
       `   = ${formatEUR(itemTotal)} + ${formatEUR(depositTotal)} Pfand`]
    : [`${line.quantity}x ${line.drinkName} (${line.variantLabel})`,
       `   = ${formatEUR(itemTotal)}`];
}

export interface ComputeTotalsOptions {
  fulfillment?: CustomerInfo['fulfillment'];
  deliveryZoneId?: string;
}

export function computeTotals(
  lines: CartLine[],
  opts: ComputeTotalsOptions = {},
): CartTotals {
  let items = 0;
  let deposit = 0;
  let count = 0;
  for (const line of lines) {
    items += round2(line.unitPriceEur * line.quantity);
    count += line.quantity;
    if (line.kind === 'drink') {
      deposit += round2(line.unitDepositEur * line.quantity);
    }
  }
  const itemsSubtotalEur = round2(items);
  const depositSubtotalEur = round2(deposit);

  let deliveryFeeEur: number | null = 0;
  let belowDeliveryMinimum = false;
  if (opts.fulfillment === 'lieferung') {
    const zone = opts.deliveryZoneId ? findZone(opts.deliveryZoneId) : null;
    if (zone) {
      deliveryFeeEur = zone.feeEur;
    } else if (opts.deliveryZoneId === DELIVERY_ZONE_OTHER.id) {
      deliveryFeeEur = null; // nach Absprache
    }
    belowDeliveryMinimum = itemsSubtotalEur < MIN_DELIVERY_ORDER_EUR;
  }

  const grand = round2(
    itemsSubtotalEur + depositSubtotalEur + (deliveryFeeEur ?? 0),
  );
  return {
    itemsSubtotalEur,
    depositSubtotalEur,
    deliveryFeeEur,
    grandTotalEur: grand,
    itemCount: count,
    belowDeliveryMinimum,
  };
}

export interface BuildWhatsAppOptions {
  cart: { lines: CartLine[]; customer: CustomerInfo };
  /** Date for the "ASAP / scheduled" rendering (defaults to now). */
  now?: Date;
}

export function buildWhatsAppMessage({ cart, now = new Date() }: BuildWhatsAppOptions): string {
  const { lines, customer } = cart;
  const totals = computeTotals(lines, {
    fulfillment: customer.fulfillment,
    deliveryZoneId: customer.delivery?.zoneId,
  });

  const header = '🥙 Pimp My Kebap – Neue Bestellung';
  const customerName = customer.firstName.trim() || '(ohne Name)';
  const fulfillLabel =
    customer.fulfillment === 'vor-ort'
      ? 'Vor-Ort-Verzehr'
      : customer.fulfillment === 'lieferung'
        ? 'Lieferung'
        : 'Abholung';
  const timeLabel = customer.fulfillment === 'lieferung' ? 'Lieferung' : 'Abholung';
  const pickupLabel =
    customer.pickup.kind === 'asap'
      ? 'ASAP'
      : new Intl.DateTimeFormat('de-DE', {
          timeZone: 'Europe/Berlin',
          hour: '2-digit',
          minute: '2-digit',
        }).format(new Date(customer.pickup.iso)) + ' Uhr';
  void now;

  const lineBlocks: string[] = [];
  for (const line of lines) {
    if (line.kind === 'kebab') lineBlocks.push(describeKebab(line).join('\n'));
    else if (line.kind === 'menu') lineBlocks.push(describeMenuItem(line).join('\n'));
    else lineBlocks.push(describeDrink(line).join('\n'));
  }

  const totalsBlock: string[] = [];
  totalsBlock.push(`Zwischensumme: ${formatEUR(totals.itemsSubtotalEur)}`);
  if (totals.depositSubtotalEur > 0) {
    totalsBlock.push(`Pfand:          ${formatEUR(totals.depositSubtotalEur)}`);
  }
  if (customer.fulfillment === 'lieferung') {
    if (totals.deliveryFeeEur === null) {
      totalsBlock.push(`Liefergebühr:  nach Absprache`);
    } else if (totals.deliveryFeeEur > 0) {
      totalsBlock.push(`Liefergebühr:  ${formatEUR(totals.deliveryFeeEur)}`);
    }
  }
  totalsBlock.push(`GESAMT:        ${formatEUR(totals.grandTotalEur)}`);
  if (totals.belowDeliveryMinimum) {
    totalsBlock.push(`⚠️  Hinweis: Lieferung erst ab ${formatEUR(20)} möglich.`);
  }

  const noteBlock = customer.notes?.trim()
    ? [SEPARATOR, `Hinweis: ${customer.notes.trim()}`]
    : [];

  const deliveryBlock: string[] =
    customer.fulfillment === 'lieferung' && customer.delivery
      ? [
          SEPARATOR,
          `🛵 Lieferadresse:`,
          `   ${customer.delivery.street}`,
          `   ${customer.delivery.postalCode} ${
            findZone(customer.delivery.zoneId)?.city ?? customer.delivery.zoneId
          }`,
          ...(customer.delivery.notesAddress?.trim()
            ? [`   (${customer.delivery.notesAddress.trim()})`]
            : []),
        ]
      : [];

  const footer = [
    SEPARATOR,
    customer.fulfillment === 'lieferung'
      ? `📍 Restaurant: ${BRAND.address.street}, ${BRAND.address.postalCode} ${BRAND.address.city}`
      : `📍 Abholung: ${BRAND.address.street}, ${BRAND.address.postalCode} ${BRAND.address.city}`,
    `📞 Rückfragen: ${BRAND.contact.phoneDisplay}`,
  ];

  const empty = lines.length === 0;
  const messageLines = [
    header,
    SEPARATOR,
    `👤 Name: ${customerName}`,
    `🛍️ ${timeLabel}: ${pickupLabel}`,
    `🍽️ Verzehr: ${fulfillLabel}`,
    ...deliveryBlock,
    SEPARATOR,
    ...(empty ? ['(Warenkorb ist leer)'] : lineBlocks),
    SEPARATOR,
    ...totalsBlock,
    ...noteBlock,
    ...footer,
  ];

  return messageLines.join('\n');
}

export interface BuildWhatsAppUrlOptions extends BuildWhatsAppOptions {
  whatsappNumberE164NoPlus?: string;
}

export function buildWhatsAppUrl(opts: BuildWhatsAppUrlOptions): string {
  const message = buildWhatsAppMessage(opts);
  const number = resolveWhatsAppNumber(opts.whatsappNumberE164NoPlus);
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
