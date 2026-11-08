/**
 * Price observations (P2-3A, ADR-0005). A price is an observation at a
 * merchant on a date under stated conditions — never a bare number on the
 * product. Observations under different conditions are not compared or
 * aggregated without an explicit, recorded conversion.
 */
import type { DerivedValue } from '../types.ts';

/** ISO 4217 codes accepted in Phase 2. Extend deliberately; validation rejects anything else. */
export const CURRENCIES = ['JPY', 'USD', 'EUR', 'GBP', 'CNY'] as const;
export type Currency = (typeof CURRENCIES)[number];

export type ItemCondition = 'new' | 'open-box' | 'refurbished' | 'used';

export type PriceKind =
  /** Manufacturer's suggested or list price. */
  | 'list'
  /** Price displayed by a merchant at observation time. */
  | 'street'
  /** Realised sale (auction, marketplace). */
  | 'sold';

export interface PriceConditions {
  readonly itemCondition: ItemCondition;
  /** Whether the amount includes consumption tax / VAT. `null` = not stated (a comparability caveat). */
  readonly taxIncluded: boolean | null;
  /** Whether shipping is included. `null` = not stated. */
  readonly shippingIncluded: boolean | null;
  /** Coupon, points or rebate applied to reach `amount`. Empty string not allowed; `null` = none. */
  readonly couponApplied: string | null;
  /** Bundle contents when the price covers more than the product. `null` = product only. */
  readonly bundle: string | null;
  /** Region/market the price applies to (BCP 47 region or free text), e.g. "JP". */
  readonly locale: string;
}

export interface PriceObservation {
  readonly id: string;
  readonly productId: string;
  readonly merchant: string;
  /** `null` = price not observable (out of stock, "ask"). 0 is allowed only with `zeroPriceReason`. */
  readonly amount: number | null;
  readonly currency: Currency;
  readonly kind: PriceKind;
  /** ISO 8601 date-time with offset, e.g. 2026-11-08T09:00:00+09:00. */
  readonly observedAt: string;
  readonly conditions: PriceConditions;
  /** Required when `amount === 0`; forbidden otherwise. e.g. "bundled with speakers", "promotional giveaway". */
  readonly zeroPriceReason: string | null;
  readonly sourceId: string;
  readonly notes: string | null;
  readonly version: number;
}

/** A recorded exchange rate; conversions are tracked transforms, never silent. */
export interface ExchangeRate {
  readonly id: string;
  readonly from: Currency;
  readonly to: Currency;
  /** Units of `to` per 1 unit of `from`. */
  readonly rate: number;
  /** Date the rate applies to (YYYY-MM-DD). */
  readonly rateDate: string;
  readonly sourceId: string;
  /** e.g. "TTM midpoint", "ECB reference rate". */
  readonly method: string;
}

export interface ConvertedPrice extends DerivedValue<number | null> {
  readonly currency: Currency;
  readonly observationId: string;
  readonly rateId: string | null;
}
