// Powered by skill: seo-local
// Opening-hours and weekday helpers — all timezone-aware (Europe/Berlin).
import { BRAND } from '../data/brand';
import { isHolidayBW } from './holidays';

const TZ = 'Europe/Berlin';

interface BerlinNow {
  year: number;
  month: number;
  day: number;
  weekday: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  hour: number;
  minute: number;
}

/** Returns the wall-clock components in Europe/Berlin for a given date. */
export function getBerlinNow(date: Date = new Date()): BerlinNow {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ,
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  const weekdayMap: Record<string, BerlinNow['weekday']> = {
    Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7,
  };
  return {
    year: Number.parseInt(get('year'), 10),
    month: Number.parseInt(get('month'), 10),
    day: Number.parseInt(get('day'), 10),
    weekday: weekdayMap[get('weekday')] ?? 1,
    hour: Number.parseInt(get('hour'), 10),
    minute: Number.parseInt(get('minute'), 10),
  };
}

export type OpeningStatusReason =
  | 'regular'
  | 'holiday'
  | 'closed_sunday'
  | 'before_opening'
  | 'after_closing';

export interface OpeningStatus {
  isOpen: boolean;
  reason: OpeningStatusReason;
  /** Today's open time in HH:MM (Berlin), or null if closed all day. */
  todayOpen: string | null;
  todayClose: string | null;
  /** Next time the shop opens (best-effort label). */
  nextOpenLabel: string | null;
  /** Compact label for the header pill, e.g. "morgen wieder" / "Mo wieder". */
  nextOpenShortLabel: string | null;
}

function parseHHMM(s: string): { h: number; m: number } {
  const [h, m] = s.split(':').map((n) => Number.parseInt(n, 10));
  return { h: h ?? 0, m: m ?? 0 };
}

function minutes(h: number, m: number): number {
  return h * 60 + m;
}

const WEEKDAY_LABELS: Record<BerlinNow['weekday'], string> = {
  1: 'Mo', 2: 'Di', 3: 'Mi', 4: 'Do', 5: 'Fr', 6: 'Sa', 7: 'So',
};

export function getCurrentOpeningStatus(date: Date = new Date()): OpeningStatus {
  const now = getBerlinNow(date);
  const isHoliday = isHolidayBW(date);
  const isSunday = now.weekday === 7;

  // Sonntag ist IMMER zu — auch wenn es gleichzeitig ein Feiertag ist
  // (z.B. 25.12 / 1.1 / 1.5 / 3.10 / 1.11 die rotierend auf Sonntag
  // fallen koennen). Geschaeftsregel des Inhabers, ueberschreibt die
  // Holiday-Hours fuer diesen einen Sonderfall.
  if (isSunday) {
    return {
      isOpen: false,
      reason: 'closed_sunday',
      todayOpen: null,
      todayClose: null,
      nextOpenLabel: 'Mo wieder ab 10:30 Uhr',
      nextOpenShortLabel: 'Mo wieder',
    };
  }

  const hours = isHoliday
    ? BRAND.openingHours.holiday
    : BRAND.openingHours.weekday;
  const { h: oh, m: om } = parseHHMM(hours.open);
  const { h: ch, m: cm } = parseHHMM(hours.close);

  const nowMin = minutes(now.hour, now.minute);
  const openMin = minutes(oh, om);
  const closeMin = minutes(ch, cm);

  if (nowMin < openMin) {
    return {
      isOpen: false,
      reason: 'before_opening',
      todayOpen: hours.open,
      todayClose: hours.close,
      nextOpenLabel: `heute ab ${hours.open} Uhr`,
      nextOpenShortLabel: `ab ${hours.open}`,
    };
  }
  if (nowMin >= closeMin) {
    // Calendar-next day, then skip Sunday (shop is closed).
    let nextDay = ((now.weekday % 7) + 1) as BerlinNow['weekday'];
    if (nextDay === 7) nextDay = 1; // Sunday → Monday
    const nextLabel = `${WEEKDAY_LABELS[nextDay]} ab 10:30 Uhr`;
    // Saturday closes → next open is Monday, so "morgen" would be wrong.
    const shortLabel = now.weekday === 6 ? 'Mo wieder' : 'morgen wieder';
    return {
      isOpen: false,
      reason: 'after_closing',
      todayOpen: hours.open,
      todayClose: hours.close,
      nextOpenLabel: nextLabel,
      nextOpenShortLabel: shortLabel,
    };
  }

  return {
    isOpen: true,
    reason: isHoliday ? 'holiday' : 'regular',
    todayOpen: hours.open,
    todayClose: hours.close,
    nextOpenLabel: null,
    nextOpenShortLabel: null,
  };
}

/**
 * Schüler-Zeitfenster: Mo–Fr (1..5), bis 16:00 Uhr lokal (Berlin), nicht an
 * Feiertagen.
 */
export function isSchoolHoursWindow(date: Date = new Date()): boolean {
  const now = getBerlinNow(date);
  if (now.weekday > 5) return false;
  if (isHolidayBW(date)) return false;
  return minutes(now.hour, now.minute) < minutes(16, 0);
}

/**
 * "Schultag" — der Kalendertag, an dem Schüler-Angebote überhaupt sinnvoll
 * sind (Mo–Fr, kein Feiertag). Unabhängig von der Uhrzeit, im Gegensatz zu
 * isSchoolHoursWindow. Wird benutzt, um die Schüler-Sektion am Wochenende
 * und an Feiertagen ganz aus der Speisekarte zu entfernen.
 */
export function isSchoolDay(date: Date = new Date()): boolean {
  const now = getBerlinNow(date);
  if (now.weekday > 5) return false;
  return !isHolidayBW(date);
}

export function getCurrentWeekday(date: Date = new Date()): BerlinNow['weekday'] {
  return getBerlinNow(date).weekday;
}
