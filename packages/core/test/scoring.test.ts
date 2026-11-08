import { describe, expect, it } from 'vitest';
import {
  calculateUtility, DEMO_PRODUCTS, METRIC_BOUNDS, METRIC_KEYS, normalize,
  metricScore, weightPercentages, WEIGHT_PRESETS,
} from '../src/index.ts';
import type { DemoProduct, MetricKey, Weights } from '../src/index.ts';

const product = DEMO_PRODUCTS[0]!;

describe('normalization', () => {
  it.each<[MetricKey, number, number]>([
    ['price', 1, 100], ['price', 20000, 100], ['price', 60000, 50],
    ['price', 100000, 0], ['price', 200000, 0],
    ['power', 0, 0], ['power', 20, 0], ['power', 90, 50],
    ['power', 160, 100], ['power', 300, 100],
    ['snr', 0, 0], ['snr', 70, 0], ['snr', 95, 50], ['snr', 120, 100], ['snr', 140, 100],
    ['thdn', 0.00001, 100], ['thdn', 0.0001, 100], ['thdn', 0.001, 200 / 3],
    ['thdn', 0.01, 100 / 3], ['thdn', 0.1, 0], ['thdn', 1, 0],
  ])('%s value %s maps to %s', (key, value, expected) => {
    const result = normalize(value, METRIC_BOUNDS[key]);
    expect(result).toBeCloseTo(expected, 10);
    expect(Number.isFinite(result)).toBe(true);
    expect(metricScore({ ...product, [key]: value }, key)).toBe(result);
  });

  it.each(METRIC_KEYS)('treats missing, negative and non-finite %s as unknown', key => {
    for (const value of [null, -1, NaN, Infinity, -Infinity]) {
      expect(normalize(value, METRIC_BOUNDS[key])).toBeNull();
      expect(metricScore({ ...product, [key]: value }, key)).toBeNull();
    }
  });

  it('rejects zero THD+N before applying the logarithm', () => {
    expect(normalize(0, METRIC_BOUNDS.thdn)).toBeNull();
  });

  it('treats a price of 0 as invalid data, not as the best price (methodology 0.5.0-demo)', () => {
    expect(normalize(0, METRIC_BOUNDS.price)).toBeNull();
    expect(metricScore({ ...product, price: 0 }, 'price')).toBeNull();
    const result = calculateUtility({ ...product, price: 0 }, WEIGHT_PRESETS.balanced);
    expect(result.metricScores.price).toBeNull();
    expect(result.coverage).toBe(0.75);
    expect(result.usedWeight).toBe(75);
  });

  it('still scores 0 W and 0 dB as the bottom of their ranges (requirePositive is per metric)', () => {
    expect(normalize(0, METRIC_BOUNDS.power)).toBe(0);
    expect(normalize(0, METRIC_BOUNDS.snr)).toBe(0);
    expect(normalize(0, { ...METRIC_BOUNDS.power, requirePositive: true })).toBeNull();
  });

  it('returns unknown for invalid bounds instead of NaN/Infinity', () => {
    for (const [min, max] of [[1, 1], [2, 1], [NaN, 1], [0, Infinity]] as const) {
      expect(normalize(1, { ...METRIC_BOUNDS.power, min, max })).toBeNull();
    }
  });
});

describe('weighted utility and coverage', () => {
  it.each<[MetricKey, number]>([['thdn', 70], ['snr', 80]])(
    'excludes missing %s from the denominator', (key, usedWeight) => {
      const result = calculateUtility({ ...product, [key]: null }, WEIGHT_PRESETS.balanced);
      // Independent values from the documented fixed ranges for Reference Amp A.
      const expectedMetrics = { price: 67.5, power: 6500 / 140, thdn: 100 * (-1 - Math.log10(0.005)) / 3, snr: 70 };
      const numerator = METRIC_KEYS.filter(k => k !== key)
        .reduce((sum, k) => sum + WEIGHT_PRESETS.balanced[k] * expectedMetrics[k], 0);
      expect(result.metricScores[key]).toBeNull();
      expect(result.usedWeight).toBe(usedWeight);
      expect(result.totalWeight).toBe(100);
      expect(result.coverage).toBe(usedWeight / 100);
      expect(result.score).toBeCloseTo(numerator / usedWeight, 10);
      expect(result.methodologyVersion).toBe('0.5.0-demo');
    },
  );

  it.each<[Weights, number, string]>([
    [{ price: 30, power: 40, thdn: 30, snr: 0 }, 0.7, 'scored'],
    // Binary-exact weights total 125: 87.375 / 125 = 69.9%, within the 0–100 weight range (not reachable with the UI step of 5).
    [{ price: 37.5, power: 49.875, thdn: 37.625, snr: 0 }, 0.699, 'pending'],
  ])('keeps the 70 percent boundary inclusive (%j)', (weights, coverage, status) => {
    const result = calculateUtility({ ...product, thdn: null }, weights);
    expect(result.coverage).toBe(coverage);
    expect(result.status).toBe(status);
    expect(result.score).not.toBeNull(); // Pending retains the internal mean, not a displayed score.
  });

  it('all zero weights give no score and zero display percentages', () => {
    const weights = { price: 0, power: 0, thdn: 0, snr: 0 };
    expect(calculateUtility(product, weights)).toMatchObject({
      totalWeight: 0, usedWeight: 0, coverage: 0, score: null, status: 'pending', methodologyVersion: '0.5.0-demo',
    });
    expect(weightPercentages(weights)).toEqual(weights);
  });

  it('all missing metrics give no score even with positive weights', () => {
    const unknown: DemoProduct = { ...product, price: null, power: null, thdn: null, snr: null };
    expect(calculateUtility(unknown, WEIGHT_PRESETS.balanced)).toEqual({
      totalWeight: 100, usedWeight: 0, coverage: 0, score: null, status: 'pending',
      metricScores: { price: null, power: null, thdn: null, snr: null }, methodologyVersion: '0.5.0-demo',
    });
  });

  it('only weighting an unavailable metric does not manufacture a score', () => {
    expect(calculateUtility({ ...product, thdn: null }, { price: 0, power: 0, thdn: 100, snr: 0 }))
      .toMatchObject({ totalWeight: 100, usedWeight: 0, coverage: 0, score: null, status: 'pending' });
  });

  it('negative and non-finite weights count as zero in both APIs', () => {
    const weights = { price: -1, power: NaN, thdn: Infinity, snr: 20 };
    expect(calculateUtility(product, weights)).toMatchObject({ totalWeight: 20, usedWeight: 20, score: 70, coverage: 1 });
    expect(weightPercentages(weights)).toEqual({ price: 0, power: 0, thdn: 0, snr: 100 });
    const invalid = { price: -1, power: NaN, thdn: Infinity, snr: -Infinity };
    expect(calculateUtility(product, invalid)).toMatchObject({ totalWeight: 0, usedWeight: 0, score: null, coverage: 0 });
    expect(weightPercentages(invalid)).toEqual({ price: 0, power: 0, thdn: 0, snr: 0 });
  });

  it('rounds display percentages independently without forcing a total of 100', () => {
    expect(weightPercentages({ price: 1, power: 1, thdn: 1, snr: 0 })).toEqual({ price: 33, power: 33, thdn: 33, snr: 0 });
  });

  it('versions all fixture/preset results and leaves inputs unchanged', () => {
    for (const fixture of DEMO_PRODUCTS) {
      for (const preset of Object.values(WEIGHT_PRESETS)) {
        const result = calculateUtility(Object.freeze({ ...fixture }), Object.freeze({ ...preset }));
        expect(result.methodologyVersion).toBe('0.5.0-demo');
        expect(result.coverage).toBeGreaterThanOrEqual(0);
        expect(result.coverage).toBeLessThanOrEqual(1);
        expect(Number.isFinite(result.score)).toBe(true);
      }
    }
  });
});
