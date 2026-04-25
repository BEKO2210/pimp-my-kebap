import { describe, it, expect } from 'vitest';
import { formatEUR, round2, uid } from '../../src/lib/format';

describe('formatEUR', () => {
  it('formats with EUR sign and German decimal comma', () => {
    expect(formatEUR(7.5)).toMatch(/7,50/);
    expect(formatEUR(7.5)).toMatch(/€/);
  });
  it('keeps two decimal places for round numbers', () => {
    expect(formatEUR(13)).toMatch(/13,00/);
  });
});

describe('round2', () => {
  it('avoids float drift', () => {
    expect(round2(0.1 + 0.2)).toBe(0.3);
    expect(round2(2.005)).toBe(2.01);
  });
});

describe('uid', () => {
  it('produces unique strings', () => {
    const a = uid();
    const b = uid();
    expect(a).not.toBe(b);
    expect(typeof a).toBe('string');
  });
});
