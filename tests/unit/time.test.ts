import { describe, it, expect } from 'vitest';
import {
  getCurrentOpeningStatus,
  isSchoolHoursWindow,
  isSchoolDay,
  getCurrentWeekday,
  getBerlinNow,
} from '../../src/lib/time';
import { isHolidayBW, holidaysBW } from '../../src/lib/holidays';

// Helpers: build a UTC instant that lands at a given Europe/Berlin wall time.
// Berlin is UTC+1 (winter) or UTC+2 (summer). Tests pick months where it matters.

function berlinWinter(year: number, month1: number, day: number, hour: number, min = 0): Date {
  // CET: UTC+1
  return new Date(Date.UTC(year, month1 - 1, day, hour - 1, min));
}
function berlinSummer(year: number, month1: number, day: number, hour: number, min = 0): Date {
  // CEST: UTC+2
  return new Date(Date.UTC(year, month1 - 1, day, hour - 2, min));
}

describe('holidays BW (anonymous Gregorian Easter)', () => {
  it('lists 12 holidays per year', () => {
    expect(holidaysBW(2026)).toHaveLength(12);
    expect(holidaysBW(2027)).toHaveLength(12);
  });

  it('includes Neujahr 1.1.', () => {
    const day = holidaysBW(2026)[0]!;
    expect(day.getUTCMonth()).toBe(0);
    expect(day.getUTCDate()).toBe(1);
  });

  it('marks Karfreitag 2026 = 3.4.2026', () => {
    expect(isHolidayBW(berlinSummer(2026, 4, 3, 12))).toBe(true);
  });

  it('marks Ostermontag 2026 = 6.4.2026', () => {
    expect(isHolidayBW(berlinSummer(2026, 4, 6, 12))).toBe(true);
  });

  it('marks Tag der Arbeit 1.5.2026', () => {
    expect(isHolidayBW(berlinSummer(2026, 5, 1, 12))).toBe(true);
  });

  it('marks 1. Weihnachtstag 25.12.2026', () => {
    expect(isHolidayBW(berlinWinter(2026, 12, 25, 12))).toBe(true);
  });

  it('does NOT mark a regular Tuesday as holiday', () => {
    expect(isHolidayBW(berlinSummer(2026, 7, 7, 12))).toBe(false);
  });

  it('marks 12 specific 2027 holidays', () => {
    const holidays2027 = holidaysBW(2027).map((d) => `${d.getUTCMonth() + 1}-${d.getUTCDate()}`);
    expect(holidays2027).toContain('1-1');
    expect(holidays2027).toContain('1-6');
    expect(holidays2027).toContain('5-1');
    expect(holidays2027).toContain('10-3');
    expect(holidays2027).toContain('11-1');
    expect(holidays2027).toContain('12-25');
    expect(holidays2027).toContain('12-26');
  });
});

describe('getCurrentOpeningStatus', () => {
  it('regular weekday inside hours = open/regular', () => {
    // Tuesday 7.7.2026 14:00 Berlin (summer)
    const status = getCurrentOpeningStatus(berlinSummer(2026, 7, 7, 14));
    expect(status.isOpen).toBe(true);
    expect(status.reason).toBe('regular');
    expect(status.todayClose).toBe('21:00');
  });

  it('Sunday is closed_sunday', () => {
    // Sunday 5.7.2026 13:00
    const status = getCurrentOpeningStatus(berlinSummer(2026, 7, 5, 13));
    expect(status.isOpen).toBe(false);
    expect(status.reason).toBe('closed_sunday');
    expect(status.nextOpenLabel).toMatch(/Mo/);
  });

  it('weekday before opening = before_opening', () => {
    // Monday 6.7.2026 09:00
    const status = getCurrentOpeningStatus(berlinSummer(2026, 7, 6, 9));
    expect(status.isOpen).toBe(false);
    expect(status.reason).toBe('before_opening');
  });

  it('weekday after closing = after_closing with next-day label', () => {
    // Friday 10.7.2026 22:30
    const status = getCurrentOpeningStatus(berlinSummer(2026, 7, 10, 22, 30));
    expect(status.isOpen).toBe(false);
    expect(status.reason).toBe('after_closing');
    expect(status.nextOpenLabel).toMatch(/Sa/);
    expect(status.nextOpenShortLabel).toBe('morgen wieder');
  });

  it('Saturday after closing skips Sunday — short label says "Mo wieder"', () => {
    // Saturday 11.7.2026 22:30 — next open is Monday 13.7.
    const status = getCurrentOpeningStatus(berlinSummer(2026, 7, 11, 22, 30));
    expect(status.reason).toBe('after_closing');
    expect(status.nextOpenLabel).toMatch(/Mo/);
    expect(status.nextOpenShortLabel).toBe('Mo wieder');
  });

  it('public holiday during opening hours = open/holiday', () => {
    // Karfreitag 3.4.2026 13:00 Berlin
    const status = getCurrentOpeningStatus(berlinSummer(2026, 4, 3, 13));
    expect(status.isOpen).toBe(true);
    expect(status.reason).toBe('holiday');
    expect(status.todayOpen).toBe('12:00');
  });

  it('public holiday before holiday opening = before_opening', () => {
    // 25.12.2026 11:00 Berlin
    const status = getCurrentOpeningStatus(berlinWinter(2026, 12, 25, 11));
    expect(status.isOpen).toBe(false);
    expect(status.reason).toBe('before_opening');
    expect(status.todayOpen).toBe('12:00');
  });

  it('Sunday that is also a holiday is STILL closed_sunday (Sonntag ueberschreibt Feiertag)', () => {
    // 25.12.2022 war ein SONNTAG und gleichzeitig 1. Weihnachtstag.
    // Geschaeftsregel des Inhabers: Sonntag ist immer zu — auch an Feiertagen.
    // Test sperrt diese Domaenen-Regel ein und schuetzt vor versehentlicher
    // Re-Aktivierung der Holiday-Override-Logik.
    const status = getCurrentOpeningStatus(berlinWinter(2022, 12, 25, 14));
    expect(status.isOpen).toBe(false);
    expect(status.reason).toBe('closed_sunday');
    expect(status.nextOpenLabel).toMatch(/Mo/);
  });

  it('Neujahr 2023 (Sonntag) = closed_sunday (gleiche Regel)', () => {
    const status = getCurrentOpeningStatus(berlinWinter(2023, 1, 1, 14));
    expect(status.isOpen).toBe(false);
    expect(status.reason).toBe('closed_sunday');
  });
});

describe('isSchoolHoursWindow', () => {
  it('Mon-Fri before 16:00 = true', () => {
    expect(isSchoolHoursWindow(berlinSummer(2026, 7, 6, 14))).toBe(true);
  });

  it('Mon-Fri after 16:00 = false', () => {
    expect(isSchoolHoursWindow(berlinSummer(2026, 7, 6, 16, 1))).toBe(false);
  });

  it('Saturday = false even mid-day', () => {
    expect(isSchoolHoursWindow(berlinSummer(2026, 7, 11, 12))).toBe(false);
  });

  it('Holidays = false', () => {
    expect(isSchoolHoursWindow(berlinSummer(2026, 5, 1, 12))).toBe(false);
  });
});

describe('isSchoolDay', () => {
  it('Mon-Fri = true regardless of time of day', () => {
    expect(isSchoolDay(berlinSummer(2026, 7, 6, 9))).toBe(true);
    expect(isSchoolDay(berlinSummer(2026, 7, 6, 19))).toBe(true);
  });

  it('Saturday = false', () => {
    expect(isSchoolDay(berlinSummer(2026, 7, 11, 10))).toBe(false);
  });

  it('Sunday = false', () => {
    expect(isSchoolDay(berlinSummer(2026, 7, 12, 10))).toBe(false);
  });

  it('Holidays on a weekday = false', () => {
    // 1.5.2026 is a Friday and a public holiday (Tag der Arbeit).
    expect(isSchoolDay(berlinSummer(2026, 5, 1, 10))).toBe(false);
  });
});

describe('getBerlinNow', () => {
  it('returns weekday 1..7 in ISO ordering', () => {
    const monday = getBerlinNow(berlinSummer(2026, 7, 6, 12));
    expect(monday.weekday).toBe(1);
    const sunday = getBerlinNow(berlinSummer(2026, 7, 5, 12));
    expect(sunday.weekday).toBe(7);
  });

  it('aligns getCurrentWeekday', () => {
    expect(getCurrentWeekday(berlinSummer(2026, 7, 8, 12))).toBe(3);
  });
});
