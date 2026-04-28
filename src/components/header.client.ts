// Powered by skill: frontend-design, accessibility
// Mobile burger toggle — opens/closes the mobile nav panel, syncs the
// menu↔close icon swap, traps esc + outside clicks, and locks body scroll
// while the panel is open.
//
// Plus: Hydration des Status-Pills ("Jetzt geöffnet — bis 21:00 Uhr"), weil
// die Site statisch deployt wird und sonst der Build-Tag eingefroren waere.

import { getCurrentOpeningStatus } from '../lib/time';

const TONE_CLASSES = [
  'text-brand-green-soft',
  'text-brand-gold',
  'text-brand-red-soft',
  'text-brand-cream/60',
];
const DOT_CLASSES = [
  'bg-brand-green-leaf',
  'bg-brand-gold',
  'bg-brand-red-fire',
  'bg-brand-cream/30',
];

function updateOpeningPill(): void {
  const pill = document.querySelector<HTMLElement>('[data-opening-pill]');
  const dot = pill?.querySelector<HTMLElement>('[data-opening-dot]');
  const short = pill?.querySelector<HTMLElement>('[data-opening-short]');
  const full = pill?.querySelector<HTMLElement>('[data-opening-full]');
  if (!pill || !dot || !short || !full) return;

  const status = getCurrentOpeningStatus();

  let dotClass = 'bg-brand-red-fire';
  let toneClass = 'text-brand-red-soft';
  let shortLabel = 'Geschlossen';
  let fullLabel = 'Geschlossen';

  if (status.isOpen && status.reason === 'regular') {
    dotClass = 'bg-brand-green-leaf';
    toneClass = 'text-brand-green-soft';
    shortLabel = `bis ${status.todayClose}`;
    fullLabel = `Jetzt geöffnet — bis ${status.todayClose} Uhr`;
  } else if (status.isOpen && status.reason === 'holiday') {
    dotClass = 'bg-brand-gold';
    toneClass = 'text-brand-gold';
    shortLabel = `bis ${status.todayClose}`;
    fullLabel = `Heute Feiertag — bis ${status.todayClose} Uhr`;
  } else if (status.reason === 'closed_sunday') {
    shortLabel = status.nextOpenShortLabel ?? 'Mo wieder';
    fullLabel = `Heute geschlossen (So) — ${status.nextOpenLabel ?? ''}`;
  } else if (status.reason === 'before_opening') {
    shortLabel = status.nextOpenShortLabel ?? `ab ${status.todayOpen}`;
    fullLabel = `Geschlossen — ${status.nextOpenLabel ?? ''}`;
  } else if (status.reason === 'after_closing') {
    shortLabel = status.nextOpenShortLabel ?? 'morgen wieder';
    fullLabel = `Geschlossen — ${status.nextOpenLabel ?? ''}`;
  }

  TONE_CLASSES.forEach((c) => pill.classList.remove(c));
  pill.classList.add(toneClass);

  DOT_CLASSES.forEach((c) => dot.classList.remove(c));
  dot.classList.add(dotClass);
  if (!dot.classList.contains('animate-pulse')) dot.classList.add('animate-pulse');

  short.textContent = shortLabel;
  full.textContent = fullLabel;
  pill.setAttribute('aria-label', fullLabel);
  pill.removeAttribute('data-loading');
}

updateOpeningPill();
// Re-evaluate jede Minute, damit die Pill bei Tageswechsel / Schliessungszeit
// (10:30, 21:00) ohne Reload mitlaeuft.
setInterval(updateOpeningPill, 60_000);

const toggle = document.querySelector<HTMLButtonElement>('[data-mobile-nav-toggle]');
const panel = document.querySelector<HTMLElement>('[data-mobile-nav-panel]');

if (toggle && panel) {
  const iconMenu = toggle.querySelector<HTMLElement>('[data-icon-menu]');
  const iconClose = toggle.querySelector<HTMLElement>('[data-icon-close]');

  const setOpen = (open: boolean) => {
    if (open) {
      panel.removeAttribute('hidden');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Menü schließen');
      document.body.classList.add('mobile-nav-open');
      iconMenu?.classList.add('hidden');
      iconMenu?.classList.remove('block');
      iconClose?.classList.remove('hidden');
      iconClose?.classList.add('block');
    } else {
      panel.setAttribute('hidden', '');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Menü öffnen');
      document.body.classList.remove('mobile-nav-open');
      iconMenu?.classList.remove('hidden');
      iconMenu?.classList.add('block');
      iconClose?.classList.add('hidden');
      iconClose?.classList.remove('block');
    }
  };

  const isOpen = () => !panel.hasAttribute('hidden');

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    setOpen(!isOpen());
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) {
      setOpen(false);
      toggle.focus();
    }
  });

  document.addEventListener('click', (e) => {
    if (!isOpen()) return;
    const target = e.target as Node;
    if (panel.contains(target) || toggle.contains(target)) return;
    setOpen(false);
  });

  panel.querySelectorAll('a').forEach((a) =>
    a.addEventListener('click', () => setOpen(false)),
  );

  const mq = window.matchMedia('(min-width: 768px)');
  mq.addEventListener('change', (ev) => {
    if (ev.matches && isOpen()) setOpen(false);
  });
}
