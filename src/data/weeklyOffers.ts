// Powered by skill: frontend-design
// Aktionstage. Day numbers follow ISO: 1=Mon ... 7=Sun.

export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface WeeklyOffer {
  day: Weekday;
  shortLabel: string; // e.g. "Mo"
  title: string;
  description: string;
  badge: string; // displayed in banner
}

export const WEEKLY_OFFERS: readonly WeeklyOffer[] = [
  {
    day: 1,
    shortLabel: 'Mo',
    title: 'Dönerteller-Tag',
    description: 'Heute jeder Dönerteller für 11,00 € statt 13,00 €.',
    badge: '11,00 €',
  },
  {
    day: 2,
    shortLabel: 'Di',
    title: 'Pide-Tag',
    description: 'Heute jede Pide-Sorte einheitlich für 9,00 €.',
    badge: '9,00 €',
  },
  {
    day: 3,
    shortLabel: 'Mi',
    title: 'Pizza-Tag',
    description: 'Heute jede Pizza für 9,00 €. Ja, wirklich JEDE.',
    badge: '9,00 €',
  },
  {
    day: 6,
    shortLabel: 'Sa',
    title: 'Seelen-Calzone-Tag',
    description: 'Frisch gebackene Seele aus dem Steinofen.',
    badge: 'Special',
  },
] as const;

export function offerForDay(day: number): WeeklyOffer | undefined {
  return WEEKLY_OFFERS.find((o) => o.day === day);
}
