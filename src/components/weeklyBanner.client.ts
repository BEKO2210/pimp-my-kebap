// Powered by skill: frontend-design
// Blendet den Wochenangebots-Banner client-seitig ein (statisch deployt =
// Build-Time-Tag waere am Dienstag noch "Mo-Special"). Liest die Offer-Liste
// aus dem data-offers-Attribut, picked nach getCurrentWeekday() den passenden
// Eintrag und schaltet das <aside> sichtbar.

import { getCurrentWeekday } from '../lib/time';

interface Offer {
  day: number;
  shortLabel: string;
  title: string;
  description: string;
}

function readOffers(banner: HTMLElement): Offer[] {
  const raw = banner.getAttribute('data-offers');
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Offer[]) : [];
  } catch {
    return [];
  }
}

function update(): void {
  const banner = document.querySelector<HTMLElement>('[data-weekly-banner]');
  if (!banner) return;
  const prefix = banner.querySelector<HTMLElement>('[data-weekly-prefix]');
  const text = banner.querySelector<HTMLElement>('[data-weekly-text]');
  if (!prefix || !text) return;

  const day = getCurrentWeekday();
  const offer = readOffers(banner).find((o) => o.day === day);
  if (!offer) {
    banner.setAttribute('hidden', '');
    return;
  }

  prefix.textContent = `${offer.shortLabel}-Special:`;
  text.textContent = `${offer.title} · ${offer.description}`;
  banner.removeAttribute('hidden');
}

update();
// Tageswechsel mitnehmen, ohne dass der User reloadet (5-Min-Poll genuegt).
setInterval(update, 5 * 60_000);
