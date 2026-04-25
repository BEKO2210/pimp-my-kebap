// Powered by skill: frontend-design

const eurFormatter = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
});

export function formatEUR(amount: number): string {
  return eurFormatter.format(amount);
}

/** Round to 2 decimal places to avoid float drift (e.g. 0.1+0.2). */
export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

const timeFormatter = new Intl.DateTimeFormat('de-DE', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Berlin',
});

export function formatTime(date: Date): string {
  return timeFormatter.format(date);
}

/** Quick UUID v4-ish string (good enough for client cart line IDs, not crypto). */
export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return 'id-' + Math.random().toString(36).slice(2, 11) + '-' + Date.now().toString(36);
}
