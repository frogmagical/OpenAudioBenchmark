import { describe, expect, it } from 'vitest';
import { summarizePrices } from '../../../src/model/price/summary.ts';
import { DEMO_EXCHANGE_RATES, DEMO_PRICE_OBSERVATIONS } from '../../../src/model/price/demo-prices.ts';
import type { PriceObservation } from '../../../src/model/price/types.ts';

const base = DEMO_PRICE_OBSERVATIONS.find((p) => p.id === 'demo-price-a-street')!;
const rate = DEMO_EXCHANGE_RATES[0]!;
const observation = (id: string, amount: number | null, patch: Partial<PriceObservation> = {}): PriceObservation => ({ ...base, id, amount, ...patch });
const conditions = (patch: Partial<PriceObservation['conditions']>): Partial<PriceObservation> => ({ conditions: { ...base.conditions, ...patch } });

function freeze(value: unknown): void {
  if (value !== null && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
}

describe('condition-specific price summaries', () => {
  const differentKeys: Partial<PriceObservation>[] = [
    { currency: 'USD' }, { kind: 'list' }, { kind: 'sold' },
    conditions({ itemCondition: 'used' }), conditions({ itemCondition: 'open-box' }), conditions({ itemCondition: 'refurbished' }),
    conditions({ taxIncluded: false }), conditions({ taxIncluded: null }),
    conditions({ shippingIncluded: false }), conditions({ shippingIncluded: null }),
    conditions({ bundle: '架空セットA' }), conditions({ bundle: '架空セットB' }),
  ];
  it.each(differentKeys)('never merges a distinct grouping key %j', (patch) => {
    const result = summarizePrices('a', [observation('first', 100), observation('second', 200, patch)], 'JPY');
    expect(result).toHaveLength(2);
    expect(result.map((group) => group.count)).toEqual([1, 1]);
    expect(result.map((group) => group.median).sort((a, b) => a! - b!)).toEqual([100, 200]);
  });
  it('keeps null, false and true flags and literal bundle strings distinct', () => {
    const records = [null, false, true].flatMap((taxIncluded, index) => [null, 'null', 'false', 'true', 'セット|A'].map((bundle, bundleIndex) =>
      observation(`${index}-${bundleIndex}`, 100, conditions({ taxIncluded, bundle }))));
    const result = summarizePrices('a', records, 'JPY');
    expect(result).toHaveLength(15);
    expect(new Set(result.map((group) => JSON.stringify(group.key))).size).toBe(15);
  });
  it('excludes original zero and null amounts and lists them without treating missing as zero', () => {
    const result = summarizePrices('a', [observation('zero', 0, { zeroPriceReason: '架空の無償提供' }), observation('null', null), observation('price', 100)], 'JPY');
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ observationIds: ['price'], excludedIds: ['null', 'zero'], count: 1, min: 100, median: 100, max: 100 });
  });
  it('returns null statistics and dates for a group with only excluded observations', () => {
    const result = summarizePrices('a', [observation('null', null), observation('zero', 0, { zeroPriceReason: '架空の無償提供' })], 'JPY');
    expect(result[0]).toMatchObject({ observationIds: [], excludedIds: ['null', 'zero'], count: 0, min: null, median: null, max: null, earliestObservedAt: null, latestObservedAt: null });
  });
  it.each([
    { amounts: [30, 10, 20], min: 10, median: 20, max: 30 },
    { amounts: [40, 10, 20, 30], min: 10, median: 25, max: 40 },
    { amounts: [20, 10, 10, 90], min: 10, median: 15, max: 90 },
    { amounts: [7], min: 7, median: 7, max: 7 },
  ])('calculates statistics for $amounts', ({ amounts, min, median, max }) => {
    const result = summarizePrices('a', amounts.map((amount, i) => observation(String(i), amount)), 'JPY');
    expect(result[0]).toMatchObject({ count: amounts.length, min, median, max });
  });
  it('avoids overflow while averaging large finite prices', () => {
    expect(summarizePrices('a', [observation('a', 1e308), observation('b', 1e308)], 'JPY')[0]!.median).toBe(1e308);
  });
  it('converts USD into a compatible JPY group with explicit selection, conversion and aggregation lineage', () => {
    const prices = [observation('jpy', 100), observation('usd', 2, { currency: 'USD' })];
    const result = summarizePrices('a', prices, 'JPY', [rate]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ key: { currency: 'JPY' }, observationIds: ['jpy', 'usd'], count: 2, min: 100, median: 200, max: 300 });
    const steps = result[0]!.steps;
    expect(steps.map((step) => step.op)).toEqual(['select-measurement', 'unit-convert', 'unit-convert', 'normalize']);
    expect(steps[0]).toMatchObject({ input: prices, output: ['jpy', 'usd'] });
    expect(steps[2]).toMatchObject({ input: { observationId: 'usd', value: 2, currency: 'USD', rate }, output: { value: 300, currency: 'JPY' } });
    for (const text of ['150', rate.rateDate, rate.method, rate.sourceId]) expect(steps[2]!.note).toContain(text);
    expect(steps.at(-1)).toMatchObject({ input: { methodologyVersion: 'price-summary-v1', observationIds: ['jpy', 'usd'], values: [100, 300] }, output: { count: 2, min: 100, median: 200, max: 300 } });
  });
  it('keeps USD in its own currency group without a usable directed rate', () => {
    const prices = [observation('jpy', 100), observation('usd', 2, { currency: 'USD' })];
    for (const rates of [[], [{ ...rate, from: 'JPY' as const, to: 'USD' as const }], [{ ...rate, rate: 0 }]]) {
      const result = summarizePrices('a', prices, 'JPY', rates);
      expect(result.map((group) => [group.key.currency, group.median])).toEqual([['JPY', 100], ['USD', 2]]);
    }
  });
  it('places excluded USD observations in the target group only when a rate exists', () => {
    const prices = [observation('null', null, { currency: 'USD' }), observation('zero', 0, { currency: 'USD', zeroPriceReason: '架空の無料提供' })];
    expect(summarizePrices('a', prices, 'JPY', [rate])[0]).toMatchObject({ key: { currency: 'JPY' }, excludedIds: ['null', 'zero'], count: 0 });
    expect(summarizePrices('a', prices, 'JPY')[0]).toMatchObject({ key: { currency: 'USD' }, excludedIds: ['null', 'zero'], count: 0 });
  });
  it('retains a positive original observation even when currency rounding produces zero', () => {
    const result = summarizePrices('a', [observation('small', 0.001, { currency: 'USD' })], 'JPY', [rate]);
    expect(result[0]).toMatchObject({ observationIds: ['small'], excludedIds: [], count: 1, min: 0, median: 0, max: 0 });
    expect(result[0]!.steps[1]!.note).toContain('0桁');
  });
  it('uses only the requested product and returns no groups for an absent product', () => {
    expect(summarizePrices('absent', DEMO_PRICE_OBSERVATIONS, 'JPY')).toEqual([]);
    expect(summarizePrices('a', [observation('a', 100), observation('b', 1, { productId: 'b' })], 'JPY')[0]).toMatchObject({ observationIds: ['a'], min: 100 });
  });
  it('uses instants for the included date range, preserving original offset text', () => {
    const prices = [
      observation('late', 300, { observedAt: '2026-11-08T00:30:00Z' }),
      observation('early', 100, { observedAt: '2026-11-08T09:00:00+09:00' }),
      observation('excluded', null, { observedAt: '2020-01-01T00:00:00Z' }),
    ];
    expect(summarizePrices('a', prices, 'JPY')[0]).toMatchObject({ earliestObservedAt: '2026-11-08T09:00:00+09:00', latestObservedAt: '2026-11-08T00:30:00Z' });
  });
  it('documents grouping caveats without silently normalizing coupons, locale, merchants or dates', () => {
    const prices = [observation('first', 100), observation('second', 200, {
      merchant: '架空の別店舗', observedAt: '2026-11-10T09:00:00+09:00', ...conditions({ locale: 'US', couponApplied: '架空クーポン' }),
    })];
    const result = summarizePrices('a', prices, 'JPY');
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ count: 2, median: 150 });
    expect(result[0]!.steps[0]!.input).toEqual(prices);
    for (const text of ['販売店', '地域', 'クーポン', '観測日時', '補正していません', '未記録']) expect(result[0]!.steps.at(-1)!.note).toContain(text);
  });
  it('sorts by key tuple, then ids, deterministically without mutating frozen inputs', () => {
    const prices = [
      observation('usd', 100, { currency: 'USD' }),
      observation('bundle', 100, conditions({ bundle: 'セットA' })),
      observation('default-z', 200), observation('default-a', 100),
      observation('shipping-null', 100, conditions({ shippingIncluded: null })),
      observation('shipping-false', 100, conditions({ shippingIncluded: false })),
      observation('tax-null', 100, conditions({ taxIncluded: null })),
      observation('tax-false', 100, conditions({ taxIncluded: false })),
      observation('used', 100, conditions({ itemCondition: 'used' })),
      observation('list', 100, { kind: 'list', sourceId: 'DEMO-MFG-001' }),
    ];
    const before = JSON.stringify(prices);
    freeze(prices);
    const result = summarizePrices('a', prices, 'JPY');
    expect(result.map((group) => group.observationIds)).toEqual([
      ['list'], ['tax-null'], ['tax-false'], ['shipping-null'], ['shipping-false'], ['default-a', 'default-z'], ['bundle'], ['used'], ['usd'],
    ]);
    expect(summarizePrices('a', prices, 'JPY')).toEqual(result);
    expect(summarizePrices('a', [...prices].reverse(), 'JPY')).toEqual(result);
    expect(JSON.stringify(prices)).toBe(before);
  });
});
