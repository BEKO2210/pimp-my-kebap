// Powered by skill: seo-local
// Gesetzliche Feiertage Baden-Württemberg.
// Implements the Anonymous Gregorian Easter algorithm and derives the movable
// holidays from Easter Sunday. Range: 1900–2099.

function easterSunday(year: number): Date {
  // Anonymous Gregorian algorithm
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3=March, 4=April
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

function addDays(d: Date, days: number): Date {
  const out = new Date(d.getTime());
  out.setUTCDate(out.getUTCDate() + days);
  return out;
}

function fixed(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

/** Returns the set of BW public holidays (UTC midnight) for the given year. */
export function holidaysBW(year: number): Date[] {
  const easter = easterSunday(year);
  return [
    fixed(year, 1, 1), // Neujahr
    fixed(year, 1, 6), // Heilige Drei Könige
    addDays(easter, -2), // Karfreitag
    addDays(easter, 1), // Ostermontag
    fixed(year, 5, 1), // Tag der Arbeit
    addDays(easter, 39), // Christi Himmelfahrt
    addDays(easter, 50), // Pfingstmontag
    addDays(easter, 60), // Fronleichnam
    fixed(year, 10, 3), // Tag der Deutschen Einheit
    fixed(year, 11, 1), // Allerheiligen
    fixed(year, 12, 25), // 1. Weihnachtstag
    fixed(year, 12, 26), // 2. Weihnachtstag
  ];
}

function dateKeyBerlin(d: Date): string {
  // Use the Europe/Berlin calendar date, not UTC.
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return fmt.format(d); // YYYY-MM-DD
}

export function isHolidayBW(date: Date): boolean {
  const yearStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
  }).format(date);
  const year = Number.parseInt(yearStr, 10);
  const todayKey = dateKeyBerlin(date);
  return holidaysBW(year).some((h) => dateKeyBerlin(h) === todayKey);
}
