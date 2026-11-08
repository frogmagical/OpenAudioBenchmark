/** Whether two price observations may be compared, and why not. Implemented by the core worker. */
import type { Comparability } from '../comparability.ts';
import type { ExchangeRate, PriceObservation } from './types.ts';

/**
 * Rules (all applicable reasons reported; level = strongest):
 *
 * not-comparable
 * - `amount.missing`: either amount is null.
 * - `currency.differs`: currencies differ and no rate in `rates` converts one into the other (either direction).
 * - `kind.differs`: list vs street vs sold.
 * - `condition.item-differs`: itemCondition differs (details: both labels).
 * - `condition.tax-differs`: taxIncluded true on one side and false on the other.
 * - `condition.shipping-differs`: likewise for shippingIncluded.
 * - `condition.bundle-differs`: bundle null vs non-null, or two different bundle strings.
 *
 * comparable-with-caveats
 * - `currency.converted`: currencies differ but a rate exists (details: from, to, rateId).
 * - `condition.tax-unstated` / `condition.shipping-unstated`: null on either side.
 * - `condition.coupon-applied`: couponApplied non-null on either side (details: the coupon texts).
 * - `merchant.differs`, `locale.differs`.
 * - `observed-at.gap`: observations on different calendar days (details: [days as string]); no threshold — the gap is reported, the reader judges.
 * - `zero-price`: either amount is 0 (details: the zeroPriceReason texts).
 *
 * Messages in Japanese must name the differing values (e.g. 「新品 と 中古」「税込 と 税抜」「JPY と USD」).
 */
export function explainPriceComparability(a: PriceObservation, b: PriceObservation, rates: readonly ExchangeRate[] = []): Comparability {
  void a;
  void b;
  void rates;
  throw new Error('not implemented');
}
