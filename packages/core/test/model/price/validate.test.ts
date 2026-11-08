import { describe, expect, it } from 'vitest';
import { DEMO_DATASET } from '../../../src/model/demo-dataset.ts';
import { DEMO_EXCHANGE_RATES, DEMO_PRICE_OBSERVATIONS, DEMO_PRICE_SOURCES } from '../../../src/model/price/demo-prices.ts';
import type { Currency, ExchangeRate, PriceObservation } from '../../../src/model/price/types.ts';
import { arePricesUsable, validatePriceObservations } from '../../../src/model/price/validate.ts';
import type { PriceValidationInput } from '../../../src/model/price/validate.ts';

const price = DEMO_PRICE_OBSERVATIONS.find((p) => p.id === 'demo-price-a-street')!;
const rate = DEMO_EXCHANGE_RATES[0]!;
const sources = [...DEMO_DATASET.sources, ...DEMO_PRICE_SOURCES];
const base: PriceValidationInput = { observations: [price], rates: [rate], products: [DEMO_DATASET.products[0]!], sources };
const demo: PriceValidationInput = { ...base, observations: DEMO_PRICE_OBSERVATIONS, products: DEMO_DATASET.products };
const withPrice = (patch: Partial<PriceObservation>): PriceValidationInput => ({ ...base, observations: [{ ...price, ...patch }] });
const withRate = (patch: Partial<ExchangeRate>): PriceValidationInput => ({ ...base, rates: [{ ...rate, ...patch }] });
const errors = (input: PriceValidationInput) => validatePriceObservations(input).filter((issue) => issue.severity === 'error').map((issue) => issue.code);

function freeze(value: unknown): void {
  if (value !== null && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
}

describe('price validation contract', () => {
  it('has zero demo errors and exactly the intended warnings (list prices have no shipping term)', () => {
    expect(errors(demo)).toEqual([]);
    expect(arePricesUsable(demo)).toBe(true);
    const issues = validatePriceObservations(demo);
    expect(issues.every((i) => i.severity === 'warning')).toBe(true);
    const byCode = new Map<string, string[]>();
    for (const i of issues) byCode.set(i.code, [...(byCode.get(i.code) ?? []), ...i.relatedIds]);
    expect(byCode.get('price.tax-unstated')).toEqual(['demo-price-d-tax-unknown']);
    expect(byCode.get('price.amount-missing')).toEqual(['demo-price-f-missing']);
    expect([...(byCode.get('price.shipping-unstated') ?? [])].sort()).toEqual(
      ['demo-price-a-list', 'demo-price-c-list', 'demo-price-d-shipping-unknown', 'demo-price-e-list', 'demo-price-f-list'],
    );
    expect(byCode.size).toBe(3);
  });

  it('requires a non-blank rate method and bounds UTC offsets', () => {
    expect(errors(withRate({ method: '   ' }))).toEqual(['rate.method-empty']);
    expect(errors(withRate({ method: '' }))).toEqual(['rate.method-empty']);
    expect(errors(withPrice({ observedAt: '2026-11-08T09:00:00+14:00' }))).toEqual([]);
    expect(errors(withPrice({ observedAt: '2026-11-08T09:00:00+14:01' }))).toEqual(['price.observed-at-invalid']);
    expect(errors(withPrice({ observedAt: '2026-11-08T09:00:00-00:00' }))).toEqual(['price.observed-at-invalid']);
    expect(errors(withPrice({ observedAt: '2026-11-08T24:00:00Z' }))).toEqual(['price.observed-at-invalid']);
    expect(errors(withPrice({ observedAt: '2026-11-08T23:60:00Z' }))).toEqual(['price.observed-at-invalid']);
    expect(errors(withPrice({ observedAt: '2024-02-29T00:00:00Z' }))).toEqual([]);
    expect(errors(withPrice({ observedAt: '2026-02-29T00:00:00Z' }))).toEqual(['price.observed-at-invalid']);
  });

  it('labels all demo records fictional and uses manufacturer list sources only where available', () => {
    expect(DEMO_PRICE_OBSERVATIONS).toHaveLength(14);
    for (const product of DEMO_DATASET.products) {
      const prices = DEMO_PRICE_OBSERVATIONS.filter((p) => p.productId === product.id);
      expect(prices.length).toBeGreaterThanOrEqual(2);
      expect(prices.length).toBeLessThanOrEqual(3);
      const mfg = DEMO_DATASET.measurements.find((m) => m.productId === product.id && m.metric === 'price' && m.sourceId?.startsWith('DEMO-MFG-'));
      expect(prices.filter((p) => p.kind === 'list').map((p) => [p.sourceId, p.amount])).toEqual(mfg ? [[mfg.sourceId, mfg.value]] : []);
    }
    for (const observation of DEMO_PRICE_OBSERVATIONS) expect(observation.notes).toContain('架空');
    for (const source of DEMO_PRICE_SOURCES) {
      expect(source).toMatchObject({ kind: 'retailer', url: null, accessedAt: '2026-11-08' });
      expect(source.notes).toContain('架空');
    }
    expect(DEMO_EXCHANGE_RATES).toHaveLength(1);
    expect(rate).toMatchObject({ from: 'USD', to: 'JPY' });
    expect(rate.method).toContain('架空');
    expect(DEMO_PRICE_OBSERVATIONS.some((p) => p.conditions.itemCondition === 'used')).toBe(true);
    expect(DEMO_PRICE_OBSERVATIONS.some((p) => p.conditions.couponApplied !== null)).toBe(true);
    expect(DEMO_PRICE_OBSERVATIONS.some((p) => p.amount === 0 && !!p.zeroPriceReason)).toBe(true);
  });

  const cases: [string, PriceValidationInput][] = [
    ['price.duplicate-id', { ...base, observations: [price, price] }],
    ['price.id-empty', withPrice({ id: '' })],
    ['rate.duplicate-id', { ...base, rates: [rate, rate] }],
    ['rate.id-empty', withRate({ id: '' })],
    ['price.unknown-product', withPrice({ productId: 'unknown' })],
    ['price.unknown-source', withPrice({ sourceId: 'unknown' })],
    ['rate.unknown-source', withRate({ sourceId: 'unknown' })],
    ['price.amount-invalid', withPrice({ amount: -0.01 })],
    ['price.zero-reason-required', withPrice({ amount: 0 })],
    ['price.zero-reason-forbidden', withPrice({ zeroPriceReason: '架空の無料提供' })],
    ['price.currency-unsupported', withPrice({ currency: 'AUD' as Currency })],
    ['price.observed-at-invalid', withPrice({ observedAt: '2026-11-08T09:00:00' })],
    ['price.merchant-empty', withPrice({ merchant: ' \t ' })],
    ['price.locale-empty', withPrice({ conditions: { ...price.conditions, locale: '' } })],
    ['price.blank-text', withPrice({ notes: ' ' })],
    ['price.version-invalid', withPrice({ version: 0 })],
    ['price.list-from-non-manufacturer', withPrice({ kind: 'list' })],
    ['rate.value-invalid', withRate({ rate: 0 })],
    ['rate.same-currency', withRate({ to: 'USD' })],
    ['rate.date-invalid', withRate({ rateDate: '2026-02-29' })],
    ['rate.currency-unsupported', withRate({ from: 'AUD' as Currency })],
  ];
  it.each(cases)('reports %s from a minimal mutation', (code, input) => {
    expect(errors(input)).toEqual([code]);
    expect(arePricesUsable(input)).toBe(false);
    for (const issue of validatePriceObservations(input)) expect(issue.message).toMatch(/[\u3040-\u30ff\u3400-\u9fff]/u);
  });

  it.each([-0.01, NaN, Infinity, -Infinity])('rejects invalid amount %s', (amount) => {
    expect(errors(withPrice({ amount }))).toEqual(['price.amount-invalid']);
  });
  it('distinguishes free, missing and positive amounts', () => {
    expect(errors(withPrice({ amount: 0, zeroPriceReason: '架空の無償提供' }))).toEqual([]);
    expect(errors(withPrice({ amount: 0 }))).toEqual(['price.zero-reason-required']);
    expect(errors(withPrice({ amount: 0, zeroPriceReason: ' ' }))).toEqual(['price.zero-reason-required', 'price.blank-text']);
    expect(errors(withPrice({ amount: null, zeroPriceReason: '架空の無償提供' }))).toEqual(['price.zero-reason-forbidden']);
    expect(errors(withPrice({ amount: null }))).toEqual([]);
    expect(errors(withPrice({ amount: 0.01 }))).toEqual([]);
  });
  it.each(['2026-11-08T09:00:00+09:00', '2026-11-08T00:00:00Z', '2026-11-07T19:00:00-05:00', '2026-11-08T09:00+09:00', '2026-11-08T09:00:00.123Z'])('accepts offset datetime %s', (observedAt) => {
    expect(errors(withPrice({ observedAt }))).toEqual([]);
  });
  it.each(['2026-11-08T09:00:00', '2026-11-08', 'invalid', '', '2026-13-08T09:00:00Z', '2026-11-08T25:00:00Z', '2026-11-08T09:00:00+25:00'])('rejects datetime %s', (observedAt) => {
    expect(errors(withPrice({ observedAt }))).toEqual(['price.observed-at-invalid']);
  });
  it('rejects impossible calendar days in observedAt even when Date.parse would roll them over', () => {
    // Contract limitation: do not silently strengthen the shared helper here.
    expect(errors(withPrice({ observedAt: '2026-02-30T09:00:00Z' }))).toEqual(['price.observed-at-invalid']);
  });
  it.each([0, 1.5, -1, NaN, Infinity])('rejects version %s', (version) => expect(errors(withPrice({ version }))).toEqual(['price.version-invalid']));
  it('accepts version 1', () => expect(errors(withPrice({ version: 1 }))).toEqual([]));

  it.each(['', ' \t '])('handles blank strings %j separately from null', (blank) => {
    expect(errors(withPrice({ id: blank }))).toEqual(['price.id-empty']);
    expect(errors(withRate({ id: blank }))).toEqual(['rate.id-empty']);
    expect(errors(withPrice({ merchant: blank }))).toEqual(['price.merchant-empty']);
    expect(errors(withPrice({ conditions: { ...price.conditions, locale: blank } }))).toEqual(['price.locale-empty']);
    for (const field of ['couponApplied', 'bundle'] as const) {
      expect(errors(withPrice({ conditions: { ...price.conditions, [field]: blank } }))).toEqual(['price.blank-text']);
      expect(errors(withPrice({ conditions: { ...price.conditions, [field]: null } }))).toEqual([]);
    }
    expect(errors(withPrice({ notes: blank }))).toEqual(['price.blank-text']);
    expect(errors(withPrice({ notes: null, zeroPriceReason: null }))).toEqual([]);
  });
  it.each([0, -1, NaN, Infinity, -Infinity])('rejects rate %s', (value) => expect(errors(withRate({ rate: value }))).toEqual(['rate.value-invalid']));
  it.each(['2026-02-30', '2026-02-29', '2026-04-31', '1900-02-29', '2026-00-01', '2026-11-00', '2026-13-01', '2026-1-08', '2026/11/08', '2026-11-08T00:00:00Z', ''])('rejects rate calendar date %s', (rateDate) => expect(errors(withRate({ rateDate }))).toEqual(['rate.date-invalid']));
  it.each(['2026-11-08', '2024-02-29', '2000-02-29'])('accepts rate calendar date %s', (rateDate) => expect(errors(withRate({ rateDate }))).toEqual([]));
  it('checks both rate currencies and permits a manufacturer list source', () => {
    expect(errors(withRate({ to: 'AUD' as Currency }))).toEqual(['rate.currency-unsupported']);
    expect(errors(withPrice({ kind: 'list', sourceId: 'DEMO-MFG-001' }))).toEqual([]);
    expect(errors(withPrice({ kind: 'list', sourceId: 'unknown' }))).toEqual(['price.unknown-source']);
  });
  it('does not implement the explicitly absent sold-without-date-time warning', () => {
    expect(validatePriceObservations(withPrice({ kind: 'sold' }))).toEqual([]);
    expect(errors(withPrice({ kind: 'sold', observedAt: '' }))).toEqual(['price.observed-at-invalid']);
  });
  it('keeps observation, rate and product warning order without mutating frozen input', () => {
    const input: PriceValidationInput = {
      ...base,
      observations: [{ ...price, amount: null, conditions: { ...price.conditions, taxIncluded: null, shippingIncluded: null } }, { ...price, id: 'second', version: 0 }],
      rates: [{ ...rate, rate: 0 }], products: [...base.products, { ...base.products[0]!, id: 'empty' }],
    };
    const before = JSON.stringify(input);
    freeze(input);
    const issues = validatePriceObservations(input);
    // Conditions of an unobservable price are not reported; only the missing amount is.
    expect(issues.map(({ code, path, relatedIds }) => [code, path, relatedIds])).toEqual([
      ['price.amount-missing', 'prices[0]', [price.id]], ['price.version-invalid', 'prices[1]', ['second']],
      ['rate.value-invalid', 'rates[0]', [rate.id]], ['price.product-without-prices', 'products[1]', ['empty']],
    ]);
    expect(validatePriceObservations(input)).toEqual(issues);
    expect(JSON.stringify(input)).toBe(before);
  });
});
