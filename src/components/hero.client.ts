// Powered by skill: frontend-design
// Blendet die "Heute"-Tagesangebots-Karte im Hero clientseitig ein — analog
// zu weeklyBanner.client.ts. Die Site ist statisch (GitHub Pages); ein
// Build-Time-Tag waere fuer alle Besucher bis zum naechsten Build eingefroren.

import { getCurrentWeekday } from '../lib/time';

interface Offer {
  day: number;
  shortLabel: string;
  title: string;
  description: string;
  badge: string;
}

function readOffers(el: HTMLElement): Offer[] {
  const raw = el.getAttribute('data-offers');
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Offer[]) : [];
  } catch {
    return [];
  }
}

function update(): void {
  const card = document.querySelector<HTMLElement>('[data-hero-offer]');
  if (!card) return;

  const day = getCurrentWeekday();
  const offer = readOffers(card).find((o) => o.day === day);
  if (!offer) {
    card.setAttribute('hidden', '');
    return;
  }

  const dayEl = card.querySelector<HTMLElement>('[data-hero-day]');
  const titleEl = card.querySelector<HTMLElement>('[data-hero-title]');
  const descEl = card.querySelector<HTMLElement>('[data-hero-desc]');
  const badgeEl = card.querySelector<HTMLElement>('[data-hero-badge]');
  if (dayEl) dayEl.textContent = offer.shortLabel;
  if (titleEl) titleEl.textContent = offer.title;
  if (descEl) descEl.textContent = offer.description;
  if (badgeEl) badgeEl.textContent = offer.badge;
  card.setAttribute('aria-label', `Heute: ${offer.title}`);
  card.removeAttribute('hidden');
}

update();
setInterval(update, 5 * 60_000);
