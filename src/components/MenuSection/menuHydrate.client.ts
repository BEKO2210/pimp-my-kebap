// Powered by skill: frontend-design
// Hydratisiert die Speisekarte clientseitig — analog zu weeklyBanner.client.ts
// und header.client.ts. Die Site ist statisch (GitHub Pages); Promo-Preise
// (Tages-Aktion) und die Schüler-Verfügbarkeit (Mo–Fr ≤16:00) duerfen NICHT
// zur Build-Zeit eingefroren werden — sonst zeigt z.B. der Mittwoch-Pizza-Tag
// keinen 9-€-Preis, oder die Schüler-Karte taucht samstags auf.
//
// Pro Karte stehen data-item-base-price (Vollpreis) und data-item-promo-map
// (JSON der promoPriceMap) bereit. Hier wird nach getCurrentWeekday() der
// effektive Preis berechnet und Preis-Anzeige + data-Attribute (die
// menuSection.client.ts beim Add-to-Cart liest) aktualisiert.

import { getCurrentWeekday, isSchoolDay, isSchoolHoursWindow } from '../../lib/time';
import { offerForDay } from '../../data/weeklyOffers';
import { formatEUR } from '../../lib/format';

type PromoMap = Partial<Record<string, number>>;

function repriceCard(card: HTMLElement, weekday: number): void {
  const base = Number.parseFloat(card.dataset.itemBasePrice ?? '');
  if (Number.isNaN(base)) return; // "Auf Anfrage" — kein Preis

  let map: PromoMap = {};
  try {
    const parsed = JSON.parse(card.dataset.itemPromoMap ?? '{}');
    if (parsed && typeof parsed === 'object') map = parsed as PromoMap;
  } catch {
    map = {};
  }

  // Sonntag (7) kennt keine Aktionspreise — Laden ist ohnehin zu.
  const promoRaw = weekday === 7 ? undefined : map[String(weekday)];
  const promo = typeof promoRaw === 'number' && promoRaw < base;
  const eff = promo ? (promoRaw as number) : base;

  // data-Attribute (von menuSection.client.ts beim Hinzufuegen gelesen).
  card.dataset.itemPrice = String(eff);
  card.dataset.itemPromo = promo ? 'true' : 'false';

  // Options-Payload (Dialog) mitziehen, damit konfigurierte Items den
  // Aktionspreis als Basis nehmen.
  if (card.dataset.itemOptions) {
    try {
      const payload = JSON.parse(card.dataset.itemOptions);
      payload.basePriceEur = eff;
      payload.promo = promo;
      card.dataset.itemOptions = JSON.stringify(payload);
    } catch {
      // payload kaputt — Anzeige unten trotzdem aktualisieren
    }
  }

  // Sichtbare Preis-Anzeige.
  const del = card.querySelector<HTMLElement>('[data-price-original]');
  const cur = card.querySelector<HTMLElement>('[data-price-current]');
  const savings = card.querySelector<HTMLElement>('[data-price-savings]');
  const badge = card.querySelector<HTMLElement>('[data-promo-badge]');

  if (cur) {
    cur.textContent = formatEUR(eff);
    cur.setAttribute('data-content', String(eff));
  }

  if (promo) {
    if (del) {
      del.textContent = formatEUR(base);
      del.removeAttribute('hidden');
    }
    if (savings) {
      const short = offerForDay(weekday)?.shortLabel;
      savings.textContent = `${short ? `${short}-Special` : 'Tages-Aktion'} · −${formatEUR(base - eff)}`;
      savings.removeAttribute('hidden');
    }
    badge?.removeAttribute('hidden');
  } else {
    if (del) {
      del.setAttribute('hidden', '');
      del.textContent = '';
    }
    if (savings) {
      savings.setAttribute('hidden', '');
      savings.textContent = '';
    }
    badge?.setAttribute('hidden', '');
  }
}

function hydrateSchoolCard(card: HTMLElement, schoolOpen: boolean): void {
  if (card.dataset.itemSchool !== 'true') return;
  const stepper = card.querySelector<HTMLElement>('[data-order-stepper]');
  const reason = card.querySelector<HTMLElement>('[data-order-reason]');
  card.dataset.itemOrderable = schoolOpen ? 'true' : 'false';
  if (schoolOpen) {
    stepper?.removeAttribute('hidden');
    reason?.setAttribute('hidden', '');
  } else {
    stepper?.setAttribute('hidden', '');
    reason?.removeAttribute('hidden');
  }
}

function update(): void {
  const weekday = getCurrentWeekday();
  const schoolDay = isSchoolDay();
  const schoolOpen = isSchoolHoursWindow();

  const cards = document.querySelectorAll<HTMLElement>('article[data-item-id]');
  for (const card of cards) {
    repriceCard(card, weekday);
    hydrateSchoolCard(card, schoolOpen);
  }

  // Schüler-Sektion am Wochenende/Feiertag ganz ausblenden, sonst nur abdimmen,
  // wenn das Zeitfenster (≤16:00) zu ist. Eigene Klassen statt [hidden], damit
  // der Filter (menuFilter.client.ts) nicht ueberschrieben wird.
  const section = document.querySelector<HTMLElement>('[data-school-section]');
  if (section) {
    section.classList.toggle('school-day-off', !schoolDay);
    section.classList.toggle('school-closed', schoolDay && !schoolOpen);
  }
  const navLink = document.querySelector<HTMLElement>('[data-cat-jump="schueler"]');
  const navItem = navLink?.closest('li') ?? navLink;
  navItem?.classList.toggle('school-day-off', !schoolDay);

  // Badge-Text: "Mo–Fr ≤16:00" vs "außerhalb Schulzeit".
  const badge = document.querySelector<HTMLElement>('[data-school-badge]');
  if (badge) {
    if (schoolOpen) {
      badge.textContent = 'Mo–Fr ≤16:00';
      badge.classList.add('badge-veg');
      badge.classList.remove('badge-spicy');
    } else {
      badge.textContent = 'außerhalb Schulzeit';
      badge.classList.add('badge-spicy');
      badge.classList.remove('badge-veg');
    }
  }
}

update();
// Tageswechsel / 16:00-Grenze ohne Reload mitnehmen (5-Min-Poll genuegt).
setInterval(update, 5 * 60_000);
