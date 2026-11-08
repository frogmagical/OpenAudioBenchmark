import { describe, expect, it } from 'vitest';
import { calculateUtility, DEMO_PRODUCTS, filterProducts, rankProducts, WEIGHT_PRESETS } from '../src/index.ts';

const ids = (products: readonly { id: string }[]) => products.map(product => product.id);
const product = DEMO_PRODUCTS[0]!;

describe('catalog filtering', () => {
  it('applies an inclusive budget and preserves input order', () => {
    expect(ids(filterProducts(DEMO_PRODUCTS, { budgetMax: 34000 }))).toEqual(['b', 'c', 'e']);
  });

  it('requires every feature, not just one', () => {
    expect(ids(filterProducts(DEMO_PRODUCTS, { requiredFeatures: ['usb', 'phono'] }))).toEqual(['c']);
    expect(filterProducts(DEMO_PRODUCTS, { requiredFeatures: [] })).toEqual(DEMO_PRODUCTS);
  });

  it('requires independent evidence when requested', () => {
    expect(ids(filterProducts(DEMO_PRODUCTS, { verifiedOnly: true }))).toEqual(['a', 'b', 'd']);
    expect(filterProducts(DEMO_PRODUCTS, { verifiedOnly: false })).toEqual(DEMO_PRODUCTS);
  });

  it('combines all constraints', () => {
    expect(ids(filterProducts(DEMO_PRODUCTS, { budgetMax: 46000, requiredFeatures: ['usb', 'bt'], verifiedOnly: true })))
      .toEqual(['a']);
  });

  it.each([null, NaN, Infinity, -Infinity])('treats budget %s as unlimited, including unknown prices', budgetMax => {
    const products = [...DEMO_PRODUCTS, { ...product, id: 'unknown-price', price: null }];
    expect(filterProducts(products, { budgetMax })).toEqual(products);
  });

  it('excludes unknown prices only when a finite budget is set', () => {
    const unknown = { ...product, price: null };
    expect(filterProducts([unknown], { budgetMax: 100000 })).toEqual([]);
    expect(filterProducts([unknown], {})).toEqual([unknown]);
    expect(filterProducts([{ ...product, price: 0 }], { budgetMax: 0 })).toHaveLength(1);
  });

  it('returns new arrays without changing inputs, including empty results', () => {
    const products = Object.freeze([...DEMO_PRODUCTS]);
    expect(filterProducts(products, {})).toEqual(products);
    expect(filterProducts(products, {})).not.toBe(products);
    expect(filterProducts(products, { budgetMax: 1 })).toEqual([]);
    expect(filterProducts([], {})).toEqual([]);
  });
});

describe('catalog ranking', () => {
  it('ranks all six fixtures by the independent balanced formula', () => {
    // Σ(w*n)/usedWeight using the fixed bounds, not the implementation under test.
    const expected = DEMO_PRODUCTS.map(p => ({
      id: p.id,
      score: (
        25 * (100000 - p.price!) / 800 + 25 * (p.power! - 20) / 1.4 +
        (p.thdn === null ? 0 : 30 * (-1 - Math.log10(p.thdn)) * 100 / 3) +
        (p.snr === null ? 0 : 20 * (p.snr - 70) * 2)
      ) / (100 - (p.thdn === null ? 30 : 0) - (p.snr === null ? 20 : 0)),
    })).sort((a, b) => b.score - a.score);
    expect(expected.map(p => p.id)).toEqual(['b', 'd', 'f', 'a', 'c', 'e']);
    expect(ids(rankProducts(DEMO_PRODUCTS, WEIGHT_PRESETS.balanced))).toEqual(expected.map(p => p.id));
    for (const p of DEMO_PRODUCTS) {
      const result = calculateUtility(p, WEIGHT_PRESETS.balanced);
      expect(result.score).toBeCloseTo(expected.find(row => row.id === p.id)!.score, 10);
      expect(result.status).toBe('scored');
      expect(result.coverage).toBe(p.id === 'e' ? 0.7 : p.id === 'f' ? 0.8 : 1);
    }
  });

  it('places higher-scoring pending products after covered products, null last', () => {
    const covered = { ...product, id: 'covered', price: 100000, power: 20, thdn: 0.1, snr: 70 };
    const partial = { ...product, id: 'partial', price: 20000, power: 160, thdn: null, snr: null };
    const unknown = { ...product, id: 'unknown', price: null, power: null, thdn: null, snr: null };
    const lowerPartial = { ...partial, id: 'lower', power: 20 };
    expect(ids(rankProducts([unknown, lowerPartial, partial, covered], WEIGHT_PRESETS.balanced)))
      .toEqual(['covered', 'partial', 'lower', 'unknown']);
  });

  it('is stable for ties and all-zero weights, returning a new array', () => {
    const products = Object.freeze([{ ...product, id: 'z' }, { ...product, id: 'a' }]);
    const ranked = rankProducts(products, WEIGHT_PRESETS.balanced);
    expect(ids(ranked)).toEqual(['z', 'a']);
    expect(ranked).not.toBe(products);
    expect(rankProducts(DEMO_PRODUCTS, { price: 0, power: 0, thdn: 0, snr: 0 })).toEqual(DEMO_PRODUCTS);
    expect(rankProducts([], WEIGHT_PRESETS.balanced)).toEqual([]);
  });
});
