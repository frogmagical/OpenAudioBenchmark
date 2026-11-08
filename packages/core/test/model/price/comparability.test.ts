import { describe, expect, it } from 'vitest';
import { explainPriceComparability } from '../../../src/model/price/comparability.ts';
import { DEMO_EXCHANGE_RATES, DEMO_PRICE_OBSERVATIONS } from '../../../src/model/price/demo-prices.ts';
import type { ExchangeRate, PriceObservation } from '../../../src/model/price/types.ts';

const base = DEMO_PRICE_OBSERVATIONS.find((p) => p.id === 'demo-price-a-street')!;
const rate = DEMO_EXCHANGE_RATES[0]!;
const conditions = (patch: Partial<PriceObservation['conditions']>): Partial<PriceObservation> => ({ conditions: { ...base.conditions, ...patch } });
const codes = (a: PriceObservation, b: PriceObservation, rates: readonly ExchangeRate[] = []) => explainPriceComparability(a, b, rates).reasons.map((reason) => reason.code);

const blockers: [string, Partial<PriceObservation>, string[]][] = [
  ['amount.missing', { amount: null }, ['未観測']],
  ['currency.differs', { currency: 'USD' }, ['JPY', 'USD']],
  ['kind.differs', { kind: 'list' }, ['店頭・販売価格', 'メーカー希望小売価格']],
  ['kind.differs', { kind: 'sold' }, ['店頭・販売価格', '成約価格']],
  ['condition.item-differs', conditions({ itemCondition: 'used' }), ['新品', '中古']],
  ['condition.tax-differs', conditions({ taxIncluded: false }), ['税込', '税抜']],
  ['condition.shipping-differs', conditions({ shippingIncluded: false }), ['送料込み', '送料別']],
  ['condition.bundle-differs', conditions({ bundle: '架空スピーカー付き' }), ['（セットなし）', '架空スピーカー付き']],
];
const caveats: [string, Partial<PriceObservation>, string[]][] = [
  ['currency.converted', { currency: 'USD' }, ['JPY', 'USD', rate.id]],
  ['condition.tax-unstated', conditions({ taxIncluded: null }), ['税込', '未記録']],
  ['condition.shipping-unstated', conditions({ shippingIncluded: null }), ['送料込み', '未記録']],
  ['condition.coupon-applied', conditions({ couponApplied: '架空の10%引き' }), ['なし', '架空の10%引き']],
  ['merchant.differs', { merchant: '架空店B' }, [base.merchant, '架空店B']],

  ['observed-at.gap', { observedAt: '2026-11-10T09:00:00+09:00' }, [base.observedAt, '2026-11-10', '2日']],
  ['zero-price', { amount: 0, zeroPriceReason: '架空の販促無償提供' }, ['架空の販促無償提供']],
];

describe('price comparability rules', () => {
  it('compares matching conditions without caveats even across product ids', () => {
    expect(explainPriceComparability(base, { ...base, id: 'other', productId: 'b', amount: 123 })).toEqual({ level: 'comparable', reasons: [] });
  });
  it.each(blockers)('blocks %s with concrete values', (code, patch, texts) => {
    const other = { ...base, ...patch };
    const result = explainPriceComparability(base, other);
    expect(result.level).toBe('not-comparable');
    expect(result.reasons.map((reason) => reason.code)).toEqual([code]);
    for (const text of texts) expect(result.reasons[0]!.message).toContain(text);
    expect(explainPriceComparability(other, base).level).toBe(result.level);
    expect(codes(other, base)).toEqual([code]);
  });
  it.each(caveats)('reports %s with concrete values', (code, patch, texts) => {
    const other = { ...base, ...patch };
    const result = explainPriceComparability(base, other, [rate]);
    expect(result.level).toBe('comparable-with-caveats');
    expect(result.reasons.map((reason) => reason.code)).toEqual([code]);
    for (const text of texts) expect(result.reasons[0]!.message).toContain(text);
    expect(explainPriceComparability(other, base, [rate]).level).toBe(result.level);
    expect(codes(other, base, [rate])).toEqual([code]);
  });
  it('includes exact specified conversion, item, coupon and zero details', () => {
    expect(explainPriceComparability(base, { ...base, currency: 'USD' }, [rate]).reasons[0]!.details).toEqual(['USD', 'JPY', rate.id]);
    expect(explainPriceComparability(base, { ...base, ...conditions({ itemCondition: 'used' }) }).reasons[0]!.details).toEqual(['新品', '中古']);
    const a = { ...base, ...conditions({ couponApplied: '券A' }) };
    const b = { ...base, ...conditions({ couponApplied: '券B' }) };
    expect(explainPriceComparability(a, b).reasons[0]!.details).toEqual(['券A', '券B']);
    expect(explainPriceComparability({ ...base, amount: 0, zeroPriceReason: '理由A' }, { ...base, amount: 0, zeroPriceReason: '理由B' }).reasons[0]!.details).toEqual(['理由A', '理由B']);
  });
  it('treats two different bundle texts as incompatible', () => {
    expect(codes({ ...base, ...conditions({ bundle: 'セットA' }) }, { ...base, ...conditions({ bundle: 'セットB' }) })).toEqual(['condition.bundle-differs']);
  });
  it('keeps unstated tax/shipping and equal applied coupons as caveats', () => {
    const other = { ...base, ...conditions({ taxIncluded: null, shippingIncluded: null, couponApplied: '券A' }) };
    expect(codes(other, other)).toEqual(['condition.tax-unstated', 'condition.shipping-unstated', 'condition.coupon-applied']);
  });
  it('accepts a rate in either direction without requiring both', () => {
    for (const rates of [[rate], [{ ...rate, from: 'JPY' as const, to: 'USD' as const, rate: 1 / 150 }]]) {
      expect(codes(base, { ...base, currency: 'USD' }, rates)).toEqual(['currency.converted']);
    }
  });
  it('reports local calendar day differences even for less than one elapsed day', () => {
    const a = { ...base, observedAt: '2026-11-08T23:59:00+09:00' };
    const b = { ...base, observedAt: '2026-11-09T00:01:00+09:00' };
    expect(explainPriceComparability(a, b).reasons).toMatchObject([{ code: 'observed-at.gap', details: ['0'] }]);
    expect(codes(base, { ...base, observedAt: '2026-11-08T10:00:00+09:00' })).toEqual([]);
    expect(codes(base, { ...base, observedAt: '2026-11-07T19:00:00-05:00' })).toEqual(['observed-at.gap']);
  });
  it('reports all applicable rules and preserves level and code set when swapped', () => {
    const a = Object.freeze({ ...base, amount: null, conditions: Object.freeze({ ...base.conditions }) });
    const b = Object.freeze({ ...base, amount: 0, zeroPriceReason: '架空の提供', currency: 'USD' as const, kind: 'sold' as const,
      merchant: '架空店B', observedAt: '2026-11-10T09:00:00+09:00',
      conditions: Object.freeze({ ...base.conditions, itemCondition: 'used' as const, taxIncluded: false, shippingIncluded: false, bundle: '架空セット', couponApplied: '架空クーポン', locale: 'US' }),
    });
    const expected = ['amount.missing', 'currency.differs', 'kind.differs', 'condition.item-differs', 'condition.tax-differs', 'condition.shipping-differs', 'condition.bundle-differs', 'condition.locale-differs', 'condition.coupon-applied', 'merchant.differs', 'observed-at.gap', 'zero-price'];
    const before = JSON.stringify([a, b]);
    for (const rates of [[], [rate]]) {
      const result = explainPriceComparability(a, b, rates);
      const reverse = explainPriceComparability(b, a, rates);
      expect(result.level).toBe('not-comparable');
      expect(reverse.level).toBe(result.level);
      expect(new Set(result.reasons.map((reason) => reason.code))).toEqual(new Set(rates.length ? [...expected.filter((code) => code !== 'currency.differs'), 'currency.converted'] : expected));
      expect(new Set(reverse.reasons.map((reason) => reason.code))).toEqual(new Set(result.reasons.map((reason) => reason.code)));
    }
    expect(JSON.stringify([a, b])).toBe(before);
  });
});

describe('market (locale) is a blocking condition; bundle placeholder is distinct from literal text', () => {
  const base = DEMO_PRICE_OBSERVATIONS.find((p) => p.id === 'demo-price-a-street')!;
  it('blocks a cross-market pair even in the same currency', () => {
    const us = { ...base, id: 'us', conditions: { ...base.conditions, locale: 'US' } };
    const result = explainPriceComparability(base, us);
    expect(result.level).toBe('not-comparable');
    const locale = result.reasons.find((r) => r.code === 'condition.locale-differs')!;
    expect(locale.details).toEqual(['JP', 'US']);
    expect(locale.message).toContain('JP');
    expect(locale.message).toContain('US');
  });
  it('distinguishes "no bundle" from a literal bundle text', () => {
    const literal = { ...base, id: 'lit', conditions: { ...base.conditions, bundle: '製品単体' } };
    const reason = explainPriceComparability(base, literal).reasons.find((r) => r.code === 'condition.bundle-differs')!;
    expect(reason.message).toContain('（セットなし）');
    expect(reason.message).toContain('製品単体');
    expect(reason.details).toEqual(['（セットなし）', '製品単体']);
  });
  it('demo: the JP street price and the US pre-tax price are not comparable, with the reasons named', () => {
    const usd = DEMO_PRICE_OBSERVATIONS.find((p) => p.id === 'demo-price-a-usd')!;
    const result = explainPriceComparability(base, usd, DEMO_EXCHANGE_RATES);
    expect(result.level).toBe('not-comparable');
    const codes = result.reasons.map((r) => r.code);
    expect(codes).toContain('condition.locale-differs');
    expect(codes).toContain('condition.tax-differs');
    expect(codes).toContain('currency.converted');
  });
});
