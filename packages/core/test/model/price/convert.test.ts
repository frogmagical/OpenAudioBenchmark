import { describe, expect, it } from 'vitest';
import { convertPrice } from '../../../src/model/price/convert.ts';
import { DEMO_EXCHANGE_RATES, DEMO_PRICE_OBSERVATIONS } from '../../../src/model/price/demo-prices.ts';
import type { ExchangeRate } from '../../../src/model/price/types.ts';

const usd = DEMO_PRICE_OBSERVATIONS.find((p) => p.currency === 'USD')!;
const rate = DEMO_EXCHANGE_RATES[0]!;

describe('tracked price conversion', () => {
  it('records exactly one identity step and preserves published precision', () => {
    const result = convertPrice({ ...usd, amount: 1.234 }, 'USD', []);
    expect(result).toMatchObject({ value: 1.234, currency: 'USD', observationId: usd.id, rateId: null });
    expect(result.steps).toHaveLength(1);
    expect(result.steps[0]).toMatchObject({ op: 'unit-convert', output: { value: 1.234, currency: 'USD' } });
    expect(result.steps[0]!.note).toContain('変換なし');
  });
  it('converts USD to JPY keeping the unrounded value; display rounds 1518.75 half-up to 1519', () => {
    const result = convertPrice({ ...usd, amount: 10.125 }, 'JPY', [rate]);
    expect(result).toMatchObject({ value: 1518.75, display: 1519, currency: 'JPY', rateId: rate.id, observationId: usd.id });
    expect(result.steps).toHaveLength(1);
    const step = result.steps[0]!;
    expect(step).toMatchObject({ op: 'unit-convert', input: { value: 10.125, currency: 'USD', observationId: usd.id, rate }, output: { value: 1518.75, display: 1519, currency: 'JPY' } });
    for (const text of ['150', rate.rateDate, rate.method, rate.sourceId, '0桁']) expect(step.note).toContain(text);
  });
  it('converts EUR to USD: value 12.345 × 1.2 = 14.814 unrounded, display 14.81; half-up is decimal, not binary', () => {
    const eurRate: ExchangeRate = { ...rate, id: 'fictional-eur-usd', from: 'EUR', to: 'USD', rate: 1.2 };
    const result = convertPrice({ ...usd, currency: 'EUR', amount: 12.345 }, 'USD', [eurRate]);
    expect(result.value).toBeCloseTo(14.814, 10);
    expect(result.display).toBe(14.81);
    const unitRate: ExchangeRate = { ...eurRate, id: 'unit', rate: 1 };
    expect(convertPrice({ ...usd, currency: 'EUR', amount: 1.005 }, 'USD', [unitRate]).display).toBe(1.01);
    expect(convertPrice({ ...usd, currency: 'EUR', amount: 8.345 }, 'USD', [unitRate]).display).toBe(8.35);
    expect(convertPrice({ ...usd, currency: 'EUR', amount: 0.285 }, 'USD', [unitRate]).display).toBe(0.29);
    expect(result.rateId).toBe(eurRate.id);
    expect(result.steps[0]!.note).toContain('2桁');
  });
  it('withholds missing rates, never inferring inverses or cross rates', () => {
    for (const rates of [[], [{ ...rate, from: 'JPY' as const, to: 'USD' as const }], [{ ...rate, from: 'EUR' as const }]]) {
      const result = convertPrice(usd, 'JPY', rates);
      expect(result).toMatchObject({ value: null, currency: 'JPY', rateId: null });
      expect(result.steps).toHaveLength(1);
      expect(result.steps[0]!.op).toBe('withhold');
      expect(result.steps[0]!.note).toContain('USD');
      expect(result.steps[0]!.note).toContain('JPY');
    }
  });
  it('withholds null before identity or missing rate checks while retaining an applicable rate id', () => {
    for (const target of ['USD', 'JPY'] as const) {
      for (const rates of [[], [rate]]) {
        const result = convertPrice({ ...usd, amount: null }, target, rates);
        expect(result.value).toBeNull();
        expect(result.rateId).toBe(target === 'JPY' && rates.length ? rate.id : null);
        expect(result.steps).toHaveLength(1);
        expect(result.steps[0]).toMatchObject({ op: 'withhold', note: '金額が未観測' });
      }
    }
  });
  it('preserves zero as an observed amount, normalises -0, and rounds the JPY display half up', () => {
    expect(convertPrice({ ...usd, amount: 0, zeroPriceReason: '架空の無料提供' }, 'JPY', [rate]).value).toBe(0);
    expect(Object.is(convertPrice({ ...usd, currency: 'JPY', amount: -0, zeroPriceReason: 'x' }, 'JPY', []).value, -0)).toBe(false);
    const small = convertPrice({ ...usd, amount: 0.01 }, 'JPY', [rate]);
    expect(small.value).toBeCloseTo(1.5, 12);
    expect(small.display).toBe(2);
  });
  it('uses the first matching directed rate without mutating recursively frozen inputs', () => {
    const observation = Object.freeze({ ...usd, conditions: Object.freeze({ ...usd.conditions }) });
    const rates = Object.freeze([Object.freeze({ ...rate }), Object.freeze({ ...rate, id: 'second', rate: 200 })]);
    const before = JSON.stringify({ observation, rates });
    const first = convertPrice(observation, 'JPY', rates);
    expect(first.value).toBe(42000);
    expect(first.rateId).toBe(rate.id);
    expect(convertPrice(observation, 'JPY', rates)).toEqual(first);
    expect(JSON.stringify({ observation, rates })).toBe(before);
  });
  it('withholds invalid numeric inputs and overflow instead of emitting non-finite prices', () => {
    for (const amount of [NaN, Infinity, -1, Number.MAX_VALUE]) {
      expect(convertPrice({ ...usd, amount }, 'JPY', [rate])).toMatchObject({ value: null, steps: [{ op: 'withhold' }] });
    }
    for (const value of [0, -1, NaN, Infinity]) expect(convertPrice(usd, 'JPY', [{ ...rate, rate: value }]).value).toBeNull();
  });
});
