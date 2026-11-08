/** Aggregation of comparable price observations only. Implemented by the core worker. */
import type { TransformStep } from '../types.ts';
import type { Currency, ExchangeRate, PriceObservation } from './types.ts';

export interface PriceGroupKey {
  readonly currency: Currency;
  readonly kind: PriceObservation['kind'];
  readonly itemCondition: PriceObservation['conditions']['itemCondition'];
  readonly taxIncluded: boolean | null;
  readonly shippingIncluded: boolean | null;
  readonly bundle: string | null;
}

export interface PriceSummary {
  readonly productId: string;
  readonly key: PriceGroupKey;
  readonly observationIds: readonly string[];
  /** Excluded because the amount was null or 0 (zero prices are reported, not aggregated). */
  readonly excludedIds: readonly string[];
  readonly count: number;
  readonly min: number | null;
  readonly median: number | null;
  readonly max: number | null;
  readonly earliestObservedAt: string | null;
  readonly latestObservedAt: string | null;
  readonly steps: readonly TransformStep[];
}

/**
 * Group one product's observations by `PriceGroupKey` (after converting to `target` when a rate exists;
 * observations without a usable rate stay in their own currency group) and summarise each group.
 * - Groups are never merged across different keys.
 * - Amounts null or 0 are listed in `excludedIds`, not aggregated.
 * - `median`: middle value, or mean of the two middle values for an even count.
 * - `steps`: one `select-measurement` step listing included ids, one `unit-convert` step per converted
 *   observation (reuse `convertPrice` steps), one `normalize` step describing the aggregation.
 * - Output sorted by key (currency, kind, itemCondition, taxIncluded, shippingIncluded, bundle) for stability.
 */
export function summarizePrices(productId: string, observations: readonly PriceObservation[], target: Currency, rates: readonly ExchangeRate[] = []): PriceSummary[] {
  void productId;
  void observations;
  void target;
  void rates;
  throw new Error('not implemented');
}
