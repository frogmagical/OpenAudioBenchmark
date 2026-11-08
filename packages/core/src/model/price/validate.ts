/** Validation of price observations and exchange rates. Implemented by the core worker. */
import type { Product, QualityIssue, Source } from '../types.ts';
import type { ExchangeRate, PriceObservation } from './types.ts';

export interface PriceValidationInput {
  readonly observations: readonly PriceObservation[];
  readonly rates: readonly ExchangeRate[];
  readonly products: readonly Product[];
  readonly sources: readonly Source[];
}

/**
 * Pure validation; never mutates. Paths: `prices[i]`, `rates[i]`. `relatedIds` lists the ids involved.
 *
 * Errors:
 * - `price.duplicate-id`, `price.id-empty`, `rate.duplicate-id`, `rate.id-empty`.
 * - `price.unknown-product`, `price.unknown-source`, `rate.unknown-source`.
 * - `price.amount-invalid`: amount is non-finite or negative.
 * - `price.zero-reason-required`: `amount === 0` with `zeroPriceReason` null/blank.
 * - `price.zero-reason-forbidden`: `zeroPriceReason` set while `amount !== 0` (including null).
 * - `price.currency-unsupported`: currency not in `CURRENCIES`.
 * - `price.observed-at-invalid`: `observedAt` fails `isIsoDateTimeWithOffset`.
 * - `price.merchant-empty`, `price.locale-empty`: empty/blank strings.
 * - `price.blank-text`: `couponApplied`, `bundle`, `notes` or `zeroPriceReason` is an empty/blank string (use null).
 * - `price.version-invalid`: not a positive integer.
 * - `price.list-from-non-manufacturer`: `kind === 'list'` whose source `kind` is not `manufacturer`.
 * - `rate.value-invalid`: rate non-finite or ≤ 0.  `rate.same-currency`: from === to.
 * - `rate.date-invalid`: `rateDate` not a calendar date (YYYY-MM-DD, real date).
 * - `rate.currency-unsupported`.
 *
 * Warnings:
 * - `price.tax-unstated`, `price.shipping-unstated`: the corresponding flag is `null`.
 * - `price.amount-missing`: `amount === null` (recorded as unobservable; informational).
 * - `price.sold-without-date-time`: never — `observedAt` is required for all kinds (no rule).
 * - `price.product-without-prices`: a product with no observation at all (one per product).
 *
 * Order: observations in input order, then rates, then product warnings. Deterministic.
 */
export function validatePriceObservations(input: PriceValidationInput): QualityIssue[] {
  void input;
  throw new Error('not implemented');
}

/** True when no `error` issue is reported. */
export function arePricesUsable(input: PriceValidationInput): boolean {
  void input;
  throw new Error('not implemented');
}
