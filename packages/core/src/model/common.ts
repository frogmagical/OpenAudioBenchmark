/** Validation primitives shared by the dataset, trace and price validators. */
import type { Uncertainty } from './types.ts';

/** `YYYY-MM-DD` that exists in the proleptic Gregorian calendar (UTC round-trip). */
export function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/** Non-null string that is empty or whitespace only. */
export function isBlank(value: string | null | undefined): boolean {
  return value !== null && value !== undefined && value.trim() === '';
}

/** Magnitude 0 (or a degenerate range): unknown uncertainty must be `null`, never 0. */
export function isZeroUncertainty(u: Uncertainty): boolean {
  switch (u.type) {
    case 'absolute': return u.plusMinus === 0;
    case 'relative': return u.plusMinusPercent === 0;
    case 'range': return u.low === u.high;
  }
}

/** Negative or non-finite magnitude, non-finite bounds, or a reversed range. */
export function isInvalidUncertainty(u: Uncertainty): boolean {
  switch (u.type) {
    case 'absolute': return !Number.isFinite(u.plusMinus) || u.plusMinus < 0;
    case 'relative': return !Number.isFinite(u.plusMinusPercent) || u.plusMinusPercent < 0;
    case 'range': return !Number.isFinite(u.low) || !Number.isFinite(u.high) || u.low > u.high;
  }
}

/** Unit carried by an absolute/range uncertainty; `null` for relative. */
export function uncertaintyUnit(u: Uncertainty): string | null {
  return u.type === 'relative' ? null : u.unit;
}
