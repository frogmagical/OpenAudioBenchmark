/** Declarative rules for price observations (P2-3A). */
import type { PriceConditions, PriceObservation } from './types.ts';

/**
 * ISO 8601 date-time with an explicit UTC offset or `Z`, e.g.
 * `2026-11-08T09:00:00+09:00`. Local times without offset are rejected:
 * a price observation without a determinable instant is not reproducible.
 */
export const ISO_DATETIME_WITH_OFFSET = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/;

/** Largest UTC offset in use (ISO 8601 / RFC 3339 practical range). `-00:00` (unknown offset) is rejected. */
export const MAX_UTC_OFFSET_MINUTES = 14 * 60;

export function isIsoDateTimeWithOffset(value: string): boolean {
  if (!ISO_DATETIME_WITH_OFFSET.test(value)) return false;
  const offset = /(Z|[+-]\d{2}:\d{2})$/.exec(value)![1]!;
  if (offset === '-00:00') return false;
  if (offset !== 'Z') {
    const minutes = Number(offset.slice(1, 3)) * 60 + Number(offset.slice(4, 6));
    if (minutes > MAX_UTC_OFFSET_MINUTES || Number(offset.slice(4, 6)) > 59) return false;
  }
  // Date.parse tolerates impossible calendar days in some engines; check the date part explicitly.
  const day = value.slice(0, 10);
  const utc = new Date(`${day}T00:00:00.000Z`);
  if (!Number.isFinite(utc.getTime()) || utc.toISOString().slice(0, 10) !== day) return false;
  const [, hh = '0', mm = '0', ss = '0'] = /T(\d{2}):(\d{2})(?::(\d{2}))?/.exec(value) ?? [];
  if (Number(hh) > 23 || Number(mm) > 59 || Number(ss) > 59) return false;
  return Number.isFinite(Date.parse(value));
}

/**
 * Condition fields that must be equal for two observations to be compared
 * without caveats. `taxIncluded` / `shippingIncluded` being `null` on either
 * side is a caveat (unstated), a `true` vs `false` difference is a block.
 * `comparability.ts` and `summary.ts` derive their checks and grouping key
 * from these lists so that the policy lives in one place (ADR-0005).
 */
export const BLOCKING_CONDITION_KEYS: readonly (keyof PriceConditions)[] = ['itemCondition', 'taxIncluded', 'shippingIncluded', 'bundle', 'locale'];
export const CAVEAT_CONDITION_KEYS: readonly (keyof PriceConditions)[] = ['couponApplied'];

/** Round half-up to `decimals` places in decimal arithmetic (avoids toFixed's binary rounding). */
export function roundHalfUp(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  const scaled = Math.round((Math.abs(value) * factor + Number.EPSILON) * 1e6) / 1e6;
  return Math.sign(value) * Math.floor(scaled + 0.5) / factor + 0;
}

/** Minor-unit digits per currency for display rounding. */
export const MINOR_UNIT_DIGITS: Readonly<Record<string, number>> = { JPY: 0, USD: 2, EUR: 2, GBP: 2, CNY: 2 };

export const ITEM_CONDITION_LABELS: Readonly<Record<PriceConditions['itemCondition'], string>> = {
  new: '新品',
  'open-box': '開封済み未使用',
  refurbished: '整備済み',
  used: '中古',
};

export const PRICE_KIND_LABELS: Readonly<Record<PriceObservation['kind'], string>> = {
  list: 'メーカー希望小売価格',
  street: '店頭・販売価格',
  sold: '成約価格',
};

/** Whole days between two observation instants (absolute, floor). */
export function daysBetween(aIso: string, bIso: string): number {
  return Math.floor(Math.abs(Date.parse(aIso) - Date.parse(bIso)) / 86_400_000);
}
