/** Aggregation of comparable price observations only. Implemented by the core worker. */
import type { TransformStep } from '../types.ts';
import type { Currency, ExchangeRate, PriceObservation } from './types.ts';
import { convertPrice } from './convert.ts';

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
  const groups = new Map<string, { key: PriceGroupKey; records: { observation: PriceObservation; converted: ReturnType<typeof convertPrice> }[] }>();
  for (const observation of observations) {
    if (observation.productId !== productId) continue;
    const conversion = convertPrice(observation, target, rates);
    const canConvert = observation.currency === target || (conversion.rateId !== null && (conversion.value !== null || observation.amount === null));
    const converted = canConvert ? conversion : convertPrice(observation, observation.currency, []);
    const { itemCondition, taxIncluded, shippingIncluded, bundle } = observation.conditions;
    const key: PriceGroupKey = { currency: converted.currency, kind: observation.kind, itemCondition, taxIncluded, shippingIncluded, bundle };
    const serialized = JSON.stringify(key);
    const group = groups.get(serialized) ?? { key, records: [] };
    group.records.push({ observation, converted });
    groups.set(serialized, group);
  }
  const compareText = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
  // Explicit null < false < true; null bundles precede every non-null string.
  const compareNullable = (a: string | boolean | null, b: string | boolean | null): number =>
    a === b ? 0 : a === null ? -1 : b === null ? 1 : compareText(String(a), String(b));
  const keys = ['currency', 'kind', 'itemCondition', 'taxIncluded', 'shippingIncluded', 'bundle'] as const;
  return [...groups.values()].sort((a, b) => {
    for (const key of keys) {
      const order = compareNullable(a.key[key], b.key[key]);
      if (order) return order;
    }
    return 0;
  }).map(({ key, records }) => {
    records.sort((a, b) => compareText(a.observation.id, b.observation.id));
    const included = records.filter(({ observation, converted }) => observation.amount !== null && observation.amount > 0 && converted.value !== null);
    const excludedIds = records.filter(({ observation, converted }) => observation.amount === null || observation.amount === 0 || converted.value === null).map(({ observation }) => observation.id);
    const observationIds = included.map(({ observation }) => observation.id);
    const values = included.map(({ converted }) => converted.value!).sort((a, b) => a - b);
    const count = values.length;
    const middle = Math.floor(count / 2);
    // Difference-based averaging avoids overflow for finite non-negative prices.
    const median = count === 0 ? null : count % 2 ? values[middle]! : values[middle - 1]! + (values[middle]! - values[middle - 1]!) / 2;
    // The date range covers aggregated observations, not excluded prices.
    const dates = included.map(({ observation }) => observation.observedAt)
      .sort((a, b) => Date.parse(a) - Date.parse(b) || compareText(a, b));
    const min = values[0] ?? null;
    const max = values.at(-1) ?? null;
    const steps: TransformStep[] = [
      { op: 'select-measurement', input: records.map(({ observation }) => observation), output: observationIds,
        note: `価格集計 price-summary-v1: 製品 ${productId} の条件別観測を選択。原観測の未観測と金額0は除外: ${excludedIds.join('、') || 'なし'}` },
      ...records.flatMap(({ converted }) => converted.steps),
      { op: 'normalize', input: { methodologyVersion: 'price-summary-v1', key, observationIds, values }, output: { count, min, median, max },
        note: '価格集計 price-summary-v1: 同じ通貨・価格種別・商品状態・税・送料・セット内容ごとに最小値、中央値（偶数件は中央2値の平均）、最大値を算出。販売店・地域・クーポン・観測日時は集計キーに含まず、補正していません。原観測の条件と期間を確認してください。税・送料が未記録の群は条件一致を保証しません。' },
    ];
    return { productId, key, observationIds, excludedIds, count, min, median, max,
      earliestObservedAt: dates[0] ?? null, latestObservedAt: dates.at(-1) ?? null, steps };
  });
}
