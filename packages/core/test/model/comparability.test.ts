import { describe, expect, it } from 'vitest';
import { explainComparability } from '../../src/model/comparability.ts';
import type { ComparabilityLevel } from '../../src/model/comparability.ts';
import { DEMO_CONDITIONS } from '../../src/fixtures.ts';
import { DEMO_DATASET } from '../../src/model/demo-dataset.ts';
import type { Measurement } from '../../src/model/types.ts';

const japanese = /[\u3040-\u30ff\u3400-\u9fff]/u;
const base: Measurement = {
  ...DEMO_DATASET.measurements[0]!,
  conditions: { loadOhms: 8, channelsDriven: 2, bandwidthHz: [20, 20000], outputLevel: '1 W', weighting: 'A' },
  uncertainty: { type: 'relative', plusMinusPercent: 1 },
};
const measurement = (patch: Partial<Measurement> = {}): Measurement => ({ ...base, ...patch });

interface Case {
  name: string;
  a: Measurement;
  b: Measurement;
  level: ComparabilityLevel;
  reasons: { code: string; details: string[] }[];
}

const cases: Case[] = [
  {
    name: 'identical conditions, observed evidence and stated uncertainties',
    a: measurement(), b: measurement({ id: 'b', value: 90, conditions: { ...base.conditions, bandwidthHz: [20, 20000] } }),
    level: 'comparable', reasons: [],
  },
  {
    name: 'different metrics even when the published units match',
    a: measurement({ metric: 'thdn', unit: 'dB', value: -80 }), b: measurement({ metric: 'snr', unit: 'dB', value: 105 }),
    level: 'not-comparable', reasons: [{ code: 'metric.differs', details: ['thdn', 'snr'] }],
  },
  {
    name: 'a missing status even with an inconsistent non-null value',
    a: measurement({ status: 'missing' }), b: measurement(),
    level: 'not-comparable', reasons: [
      { code: 'value.missing', details: ['m-a-power', 'm-a-power'] },
      { code: 'evidence.tier-differs', details: ['missing', 'observed'] },
    ],
  },
  {
    name: 'a missing value even with a non-missing status',
    a: measurement(), b: measurement({ id: 'null-value', value: null }),
    level: 'not-comparable', reasons: [{ code: 'value.missing', details: ['m-a-power', 'null-value'] }],
  },
  {
    name: 'both sides missing, without a spurious unit conversion failure',
    a: measurement({ status: 'missing', value: null, sourceId: null }), b: measurement({ id: 'missing-b', status: 'missing', value: null, sourceId: null }),
    level: 'not-comparable', reasons: [{ code: 'value.missing', details: ['m-a-power', 'missing-b'] }],
  },
  {
    name: 'different loads',
    a: measurement(), b: measurement({ conditions: { ...base.conditions, loadOhms: 4 } }),
    level: 'not-comparable', reasons: [{ code: 'conditions.mismatch', details: ['loadOhms'] }],
  },
  {
    name: 'unrecorded S/N weighting on one side also counts as a mismatch',
    a: measurement({ metric: 'snr', unit: 'dB' }),
    b: measurement({ metric: 'snr', unit: 'dB', conditions: { loadOhms: 8, channelsDriven: 2, bandwidthHz: [20, 20000], outputLevel: '1 W' } }),
    level: 'not-comparable', reasons: [
      { code: 'conditions.mismatch', details: ['weighting'] },
      { code: 'conditions.unrecorded', details: ['weighting'] },
    ],
  },
  {
    name: 'both condition sets empty',
    a: measurement({ conditions: {} }), b: measurement({ conditions: {} }),
    level: 'not-comparable', reasons: [{ code: 'conditions.unrecorded', details: ['loadOhms', 'channelsDriven', 'bandwidthHz'] }],
  },
  {
    name: 'equal recorded conditions do not fill an absent required S/N condition',
    a: measurement({ metric: 'snr', unit: 'dB', conditions: { outputLevel: '1 W' } }),
    b: measurement({ metric: 'snr', unit: 'dB', conditions: { outputLevel: '1 W' } }),
    level: 'not-comparable', reasons: [{ code: 'conditions.unrecorded', details: ['weighting'] }],
  },
  {
    name: 'empty price conditions are comparable: price has no required conditions',
    a: measurement({ metric: 'price', unit: 'JPY', conditions: {} }), b: measurement({ metric: 'price', unit: 'JPY', conditions: {} }),
    level: 'comparable', reasons: [],
  },
  {
    name: 'observed versus manufacturer evidence',
    a: measurement(), b: measurement({ status: 'manufacturer', sourceId: 'DEMO-MFG-001' }),
    level: 'comparable-with-caveats', reasons: [{ code: 'evidence.tier-differs', details: ['observed', 'manufacturer'] }],
  },
  {
    name: 'THD+N percentage versus decibels with fully recorded conditions',
    a: measurement({ metric: 'thdn', unit: '%', value: 0.01 }), b: measurement({ metric: 'thdn', unit: 'dB', value: -80 }),
    level: 'comparable-with-caveats', reasons: [{ code: 'unit.converted', details: ['%', 'dB'] }],
  },
  {
    name: 'power in dB is not convertible',
    a: measurement(), b: measurement({ unit: 'dB' }),
    level: 'not-comparable', reasons: [{ code: 'unit.not-convertible', details: ['W', 'dB'] }],
  },
  {
    name: 'matching invalid units still cannot convert',
    a: measurement({ unit: 'dB' }), b: measurement({ unit: 'dB' }),
    level: 'not-comparable', reasons: [{ code: 'unit.not-convertible', details: ['dB', 'dB'] }],
  },
  {
    name: 'conversion overflow is reported without claiming successful conversion',
    a: measurement({ metric: 'thdn', unit: '%', value: 0.01 }), b: measurement({ metric: 'thdn', unit: 'dB', value: 100000 }),
    level: 'not-comparable', reasons: [{ code: 'unit.not-convertible', details: ['%', 'dB'] }],
  },
  {
    name: 'one uncertainty unstated',
    a: measurement(), b: measurement({ id: 'unstated', uncertainty: null }),
    level: 'comparable-with-caveats', reasons: [{ code: 'uncertainty.unstated', details: ['unstated'] }],
  },
  {
    name: 'both uncertainties unstated produce one reason naming both records',
    a: measurement({ id: 'unstated-a', uncertainty: null }), b: measurement({ id: 'unstated-b', uncertainty: null }),
    level: 'comparable-with-caveats', reasons: [{ code: 'uncertainty.unstated', details: ['unstated-a', 'unstated-b'] }],
  },
  {
    name: 'estimated evidence on both sides',
    a: measurement({ id: 'estimate-a', status: 'estimated', derivation: '計算式' }), b: measurement({ id: 'estimate-b', status: 'estimated', derivation: '計算式' }),
    level: 'comparable-with-caveats', reasons: [{ code: 'evidence.estimated', details: ['estimate-a', 'estimate-b'] }],
  },
  {
    name: 'different evidence tiers plus unstated uncertainty',
    a: measurement(), b: measurement({ id: 'manufacturer', status: 'manufacturer', sourceId: 'DEMO-MFG-001', uncertainty: null }),
    level: 'comparable-with-caveats', reasons: [
      { code: 'evidence.tier-differs', details: ['observed', 'manufacturer'] },
      { code: 'uncertainty.unstated', details: ['manufacturer'] },
    ],
  },
  {
    name: 'condition mismatch outranks but retains an evidence caveat',
    a: measurement(), b: measurement({ status: 'manufacturer', sourceId: 'DEMO-MFG-001', conditions: { ...base.conditions, loadOhms: 4 } }),
    level: 'not-comparable', reasons: [
      { code: 'conditions.mismatch', details: ['loadOhms'] },
      { code: 'evidence.tier-differs', details: ['observed', 'manufacturer'] },
    ],
  },
  {
    name: 'all four caveats are retained in contract order',
    a: measurement({ metric: 'thdn', unit: '%', value: 0.01 }),
    b: measurement({ id: 'estimate', metric: 'thdn', unit: 'dB', value: -80, status: 'estimated', derivation: '計算式', uncertainty: null }),
    level: 'comparable-with-caveats', reasons: [
      { code: 'evidence.tier-differs', details: ['observed', 'estimated'] },
      { code: 'evidence.estimated', details: ['estimate'] },
      { code: 'unit.converted', details: ['%', 'dB'] },
      { code: 'uncertainty.unstated', details: ['estimate'] },
    ],
  },
  {
    name: 'different metrics skip condition rules and absent values skip unit probes',
    a: measurement({ metric: 'thdn', unit: 'W', value: null, conditions: { loadOhms: 8 }, uncertainty: null }),
    b: measurement({ id: 'estimate', metric: 'snr', unit: 'dB', status: 'estimated', derivation: '計算式', conditions: { loadOhms: 4 }, uncertainty: null }),
    level: 'not-comparable', reasons: [
      { code: 'metric.differs', details: ['thdn', 'snr'] },
      { code: 'value.missing', details: ['m-a-power', 'estimate'] },
      { code: 'evidence.tier-differs', details: ['observed', 'estimated'] },
      { code: 'evidence.estimated', details: ['estimate'] },
      { code: 'uncertainty.unstated', details: ['m-a-power', 'estimate'] },
    ],
  },
];

describe('comparability contract', () => {
  it.each(cases)('$name', ({ a, b, level, reasons }) => {
    const result = explainComparability(a, b);
    expect(result.level).toBe(level);
    expect(result.reasons.map(({ code, details }) => ({ code, details }))).toEqual(reasons);
    for (const reason of result.reasons) expect(reason.message).toMatch(japanese);
  });

  it.each(cases)('swapping sides preserves the level and reason codes: $name', ({ a, b, level, reasons }) => {
    const result = explainComparability(b, a);
    expect(result.level).toBe(level);
    expect(result.reasons.map(({ code }) => code)).toEqual(reasons.map(({ code }) => code));
    for (const reason of result.reasons) expect(reason.message).toMatch(japanese);
  });

  it('reports all incompatible condition keys in the comparator alphabetical order', () => {
    const result = explainComparability(base, measurement({ conditions: { ...base.conditions, loadOhms: 4, channelsDriven: 1, bandwidthHz: [100, 10000] } }));
    expect(result.level).toBe('not-comparable');
    expect(result.reasons.map(({ code, details }) => ({ code, details }))).toEqual([
      { code: 'conditions.mismatch', details: ['bandwidthHz', 'channelsDriven', 'loadOhms'] },
    ]);
  });

  it('compares evidence across different products without inventing a product-identity blocker', () => {
    expect(explainComparability(base, measurement({ productId: 'b' }))).toEqual({ level: 'comparable', reasons: [] });
  });

  it('does not alter values, conditions or uncertainty while explaining conversion', () => {
    const a = Object.freeze(measurement({
      metric: 'thdn', unit: '%', value: 0.01,
      conditions: Object.freeze({ ...base.conditions, bandwidthHz: Object.freeze([20, 20000] as const) }),
      uncertainty: Object.freeze({ type: 'relative', plusMinusPercent: 1 }),
    }));
    const b = Object.freeze({ ...a, id: 'b', unit: 'dB' as const, value: -80 });
    const before = JSON.stringify([a, b]);
    expect(explainComparability(a, b).level).toBe('comparable-with-caveats');
    expect(JSON.stringify([a, b])).toBe(before);
  });
});

describe('price is not blocked by unrecorded conditions (no required conditions)', () => {
  it('ignores demo conditions recorded on only one price', () => {
    const a = measurement({ metric: 'price', unit: 'JPY', conditions: DEMO_CONDITIONS });
    const b = measurement({ metric: 'price', unit: 'JPY', conditions: {} });
    expect(explainComparability(a, b)).toEqual({ level: 'comparable', reasons: [] });
  });

  it('compares two prices recorded without any conditions', () => {
    const a = DEMO_DATASET.measurements.find((m) => m.id === 'm-a-price')!;
    const b = DEMO_DATASET.measurements.find((m) => m.id === 'm-c-price')!;
    const result = explainComparability({ ...a, conditions: {} }, { ...b, conditions: {} });
    expect(result.reasons.map((r) => r.code)).not.toContain('conditions.unrecorded');
    expect(result.level).toBe('comparable-with-caveats');
  });

  it('still blocks a metric with required conditions when both sides are unrecorded', () => {
    const a = DEMO_DATASET.measurements.find((m) => m.id === 'm-a-power')!;
    const b = DEMO_DATASET.measurements.find((m) => m.id === 'm-b-power')!;
    const result = explainComparability({ ...a, conditions: {} }, { ...b, conditions: {} });
    expect(result.level).toBe('not-comparable');
    expect(result.reasons.map((r) => r.code)).toContain('conditions.unrecorded');
  });
});

describe('review regression: recorded values and explanatory messages', () => {
  it.each([NaN, Infinity, -Infinity])('treats %s on either side as missing without a unit reason', (value) => {
    const invalid = measurement({ metric: 'thdn', unit: 'dB', value });
    const valid = measurement({ metric: 'thdn', unit: '%', value: 0.01 });
    for (const [a, b] of [[invalid, valid], [valid, invalid]] as const) {
      expect(explainComparability(a, b).reasons.map((r) => r.code)).toEqual(['value.missing']);
    }
  });

  it.each(['dB', 'W'] as const)('does not probe a missing THD+N value in %s', (unit) => {
    const absent = measurement({ metric: 'thdn', unit, value: null, status: 'missing', sourceId: null });
    const present = measurement({ metric: 'thdn', unit: '%', value: 0.01 });
    for (const [a, b] of [[absent, present], [present, absent]] as const) {
      const result = explainComparability(a, b);
      expect(result.level).toBe('not-comparable');
      expect(result.reasons.map((r) => r.code)).toEqual(['value.missing', 'evidence.tier-differs']);
    }
  });

  it('still diagnoses an unconvertible real value opposite a missing value', () => {
    const result = explainComparability(measurement({ value: null }), measurement({ unit: 'dB' }));
    expect(result.reasons.map((r) => r.code)).toEqual(['value.missing', 'unit.not-convertible']);
    expect(result.reasons[1]!.message).toContain('dB');
  });

  it('treats method as relevant to power and names both methods', () => {
    const result = explainComparability(
      measurement({ conditions: { ...base.conditions, method: '方法A' } }),
      measurement({ conditions: { ...base.conditions, method: '方法B' } }),
    );
    expect(result.reasons.map((r) => r.code)).toEqual(['conditions.mismatch']);
    expect(result.reasons[0]!.message).toContain('測定方法が 方法A と 方法B');
  });

  it('names every mismatched condition and both values', () => {
    const result = explainComparability(base, measurement({ conditions: { ...base.conditions, loadOhms: 4, channelsDriven: 1 } }));
    const message = result.reasons[0]!.message;
    for (const fragment of ['負荷インピーダンス', '8 Ω', '4 Ω', '駆動チャンネル数が 2 と 1', '、']) {
      expect(message).toContain(fragment);
    }
  });

  it('names missing conditions and marks the missing value in a mismatch', () => {
    const result = explainComparability(base, measurement({ conditions: { loadOhms: 8 } }));
    const unrecorded = result.reasons.find((r) => r.code === 'conditions.unrecorded')!;
    expect(unrecorded.message).toContain('駆動チャンネル数');
    expect(unrecorded.message).toContain('測定帯域');
    expect(result.reasons.find((r) => r.code === 'conditions.mismatch')!.message).toContain('未記録');
  });

  it('names both evidence tiers in Japanese', () => {
    const reason = explainComparability(base, measurement({ status: 'manufacturer' })).reasons[0]!;
    expect(reason.message).toContain('第三者測定');
    expect(reason.message).toContain('メーカー公称');
  });
});
