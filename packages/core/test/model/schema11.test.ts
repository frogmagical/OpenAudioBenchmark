/** Schema 1.1 contracts. All numbers and instruments below are fictional test data. */
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { CONDITION_KEYS } from '../../src/conditions.ts';
import { WEIGHT_PRESETS } from '../../src/fixtures.ts';
import { METRIC_BOUNDS } from '../../src/methodology.ts';
import * as scoring from '../../src/scoring.ts';
import type { MeasurementConditions, MetricKey } from '../../src/types.ts';
import { METRIC_KEYS } from '../../src/types.ts';
import { explainComparability } from '../../src/model/comparability.ts';
import { toDemoProduct } from '../../src/model/adapter.ts';
import { DEMO_CONDITIONS, DEMO_DATASET } from '../../src/model/demo-dataset.ts';
import { evaluateProduct } from '../../src/model/evaluate.ts';
import { projectMetric, projectProduct, toMetricValues } from '../../src/model/project.ts';
import {
  COMPARISON_REQUIRED_CONDITIONS, CONDITION_LABELS, METRIC_CATEGORIES, METRIC_UNITS,
  RELEVANT_CONDITIONS, REQUIRED_CONDITIONS, VALUE_DOMAIN, formatConditionValue, unrecordedRequiredConditions,
} from '../../src/model/rules.ts';
import { buildCatalogJson } from '../../src/export.ts';
import {
  DATASET_SCHEMA_VERSION, METRIC_IDS, REUSE_UNCHECKED, SPEAKER_METRIC_IDS, isScoringMetric,
} from '../../src/model/types.ts';
import type {
  Dataset, Measurement, MeasurementReference, Product, RangeMeasurement, ReusePermission, SourceReuse,
} from '../../src/model/types.ts';
import { conditionProblems, validateDataset } from '../../src/model/validate.ts';

const base = DEMO_DATASET.measurements[0]!;
const speaker: Product = {
  ...DEMO_DATASET.products[0]!, id: 'schema11-speaker', category: 'speaker',
  name: 'Schema 1.1 speaker（架空）', model: 'Fictional speaker', features: [],
  region: 'JP', dimensionsMm: { w: 200, h: 300, d: 250 }, massKg: 7,
};
const speakerConditions: MeasurementConditions = {
  sensitivityReference: '2.83V/1m', distanceM: 1, averaging: 'mean',
  averagingBandHz: [300, 3000], environment: 'anechoic', frequencyHz: 150,
  instrument: 'Fictional analyzer A',
};
const speakerMeasurements: readonly Measurement[] = [
  { ...base, id: 'speaker-sensitivity', productId: speaker.id, metric: 'sensitivity', value: 86, unit: 'dB', conditions: speakerConditions },
  { ...base, id: 'speaker-nominal', productId: speaker.id, metric: 'nominalImpedance', value: 8, unit: 'Ω', conditions: {} },
  { ...base, id: 'speaker-minimum', productId: speaker.id, metric: 'minimumImpedance', value: 3.7, unit: 'Ω', conditions: speakerConditions },
  { ...base, id: 'speaker-crossover', productId: speaker.id, metric: 'crossoverFrequency', value: 2000, unit: 'Hz', conditions: {} },
];
const speakerDataset: Dataset = {
  ...DEMO_DATASET, products: [...DEMO_DATASET.products, speaker],
  measurements: [...DEMO_DATASET.measurements, ...speakerMeasurements],
};
const reference: MeasurementReference = {
  id: 'reference-power', productId: base.productId, metric: 'power', sourceId: base.sourceId!,
  quantities: ['output power'], conditions: {}, status: 'observed', accessedAt: '2026-11-08', notes: null,
};
const range: RangeMeasurement = {
  id: 'range-speaker', productId: speaker.id, metric: 'frequencyRange',
  lowHz: 47, highHz: 45000, toleranceDb: -6, toleranceKind: 'minus',
  status: 'manufacturer', sourceId: 'DEMO-MFG-001', conditions: {},
  capturedAt: '2026-11-08', version: 1, notes: null,
};
const errors = (dataset: Dataset) => validateDataset(dataset).filter((issue) => issue.severity === 'error');
const withMeasurement = (patch: Partial<Measurement>): Dataset => ({
  ...speakerDataset,
  measurements: speakerDataset.measurements.map((m) => m.id === base.id ? { ...m, ...patch } : m),
});
const withReuse = (reuse: SourceReuse, fictional = true): Dataset => ({
  ...DEMO_DATASET, fictional,
  products: DEMO_DATASET.products.map((p) => ({ ...p, fictional })),
  sources: DEMO_DATASET.sources.map((s, i) => ({
    ...s, url: `https://example.invalid/fictional/${s.id}`, ...(i === 0 ? { reuse } : {}),
  })),
});
const withReference = (patch: Partial<MeasurementReference> = {}): Dataset => ({
  ...DEMO_DATASET, references: [{ ...reference, ...patch }],
});
const withRange = (patch: Partial<RangeMeasurement> = {}): Dataset => ({
  ...speakerDataset, ranges: [{ ...range, ...patch }],
});

function expectError(dataset: Dataset, code: string, path: string, relatedIds: readonly string[]) {
  expect(errors(dataset)).toEqual([{
    code, severity: 'error', path, relatedIds, message: expect.stringMatching(/[\u3040-\u30ff\u3400-\u9fff]/u),
  }]);
}

describe('schema 1.1 metric and scoring boundaries', () => {
  it('preserves the demo quality counts and six balanced-preset scores through the adapter', () => {
    const issues = validateDataset(DEMO_DATASET);
    expect(issues.filter((issue) => issue.severity === 'error')).toHaveLength(0);
    expect(issues.filter((issue) => issue.severity === 'warning')).toHaveLength(23);
    // Expected product order and one-decimal scores are the main-equivalent demo baseline.
    const expected = [
      ['b', '69.5'], ['d', '66.0'], ['f', '56.6'], ['a', '55.5'], ['c', '52.3'], ['e', '51.6'],
    ] as const;
    for (const [id, score] of expected) {
      const result = scoring.calculateUtility(toDemoProduct(DEMO_DATASET, id), WEIGHT_PRESETS.balanced);
      expect(result.status).toBe('scored');
      expect(result.score?.toFixed(1), id).toBe(score);
    }
  });

  it('uses schema 1.1 and permits omitted or empty references and ranges', () => {
    expect(DATASET_SCHEMA_VERSION).toBe('1.1');
    expect(DEMO_DATASET.schemaVersion).toBe('1.1');
    expect(validateDataset({ ...DEMO_DATASET, references: [], ranges: [] })).toEqual(validateDataset(DEMO_DATASET));
  });

  it('has exactly eight metric ids and complete rule tables', () => {
    expect([...METRIC_IDS].sort()).toEqual([
      'crossoverFrequency', 'minimumImpedance', 'nominalImpedance', 'power', 'price', 'sensitivity', 'snr', 'thdn',
    ]);
    for (const table of [METRIC_UNITS, METRIC_CATEGORIES, REQUIRED_CONDITIONS, RELEVANT_CONDITIONS, COMPARISON_REQUIRED_CONDITIONS, VALUE_DOMAIN]) {
      expect(Object.keys(table).sort()).toEqual([...METRIC_IDS].sort());
    }
  });

  it('keeps bounds, scoring types and the scoring guard limited to exactly four keys', () => {
    type ScoringKeys = 'price' | 'power' | 'thdn' | 'snr';
    expectTypeOf<MetricKey>().toEqualTypeOf<ScoringKeys>();
    expectTypeOf<keyof typeof METRIC_BOUNDS>().toEqualTypeOf<ScoringKeys>();
    expectTypeOf<keyof Parameters<typeof scoring.calculateUtility>[0]>().toEqualTypeOf<ScoringKeys>();
    expectTypeOf<keyof ReturnType<typeof toMetricValues>>().toEqualTypeOf<ScoringKeys>();
    expect([...METRIC_KEYS].sort()).toEqual(['power', 'price', 'snr', 'thdn']);
    expect(Object.keys(METRIC_BOUNDS).sort()).toEqual([...METRIC_KEYS].sort());
    expect(METRIC_IDS.filter(isScoringMetric)).toEqual(METRIC_KEYS);
    for (const metric of SPEAKER_METRIC_IDS) expect(isScoringMetric(metric)).toBe(false);
  });

  it('validates and projects all speaker metrics, but never passes them to calculateUtility', () => {
    expect(errors(speakerDataset)).toEqual([]);
    const projection = projectProduct(speakerDataset, speaker.id);
    expect(Object.keys(projection.metrics).sort()).toEqual([...METRIC_IDS].sort());
    for (const measurement of speakerMeasurements) {
      expect(projection.metrics[measurement.metric]).toMatchObject({
        measurementId: measurement.id, status: 'observed', derived: { value: measurement.value }, issues: [],
      });
    }
    const values = toMetricValues(projection);
    expect(values).toEqual({ price: null, power: null, thdn: null, snr: null });
    const calculate = vi.spyOn(scoring, 'calculateUtility');
    try {
      const weights = { price: 25, power: 25, thdn: 25, snr: 25 };
      const evaluation = evaluateProduct(speakerDataset, speaker.id, weights);
      expect(calculate).toHaveBeenCalledExactlyOnceWith(values, weights);
      expect(Object.keys(calculate.mock.calls[0]![0]).sort()).toEqual([...METRIC_KEYS].sort());
      expect(evaluation.utility).toMatchObject({ score: null, coverage: 0, status: 'pending' });
      expect(Object.keys(evaluation.lineage).sort()).toEqual([...METRIC_KEYS].sort());
    } finally {
      calculate.mockRestore();
    }
  });

  it('measurement.metric-category-mismatch: rejects cross-category metrics, allows price on both', () => {
    for (const measurement of speakerMeasurements) {
      expectError(withMeasurement({ metric: measurement.metric, unit: measurement.unit, value: measurement.value }),
        'measurement.metric-category-mismatch', 'measurements[0]', [base.id, base.productId]);
    }
    expectError(withMeasurement({ productId: speaker.id }),
      'measurement.metric-category-mismatch', 'measurements[0]', [base.id, speaker.id]);
    for (const productId of [base.productId, speaker.id]) {
      expect(errors(withMeasurement({ productId, metric: 'price', unit: 'JPY', value: 40000 }))).toEqual([]);
    }
  });
});

describe('source reuse', () => {
  it('range.source-reuse-not-permitted: gates real ranges by quoteFacts and exempts fictional ranges', () => {
    const permissions: readonly ReusePermission[] = ['unknown', 'prohibited', 'allowed', 'allowed-with-attribution', 'permitted-by-law-or-terms'];
    const sourceId = 'range-only-source';
    for (const fictional of [false, true]) {
      for (const quoteFacts of permissions) {
        // Synthetic copies exercise the real-dataset gate; these are not real-product claims.
        const dataset: Dataset = {
          ...speakerDataset, fictional,
          products: speakerDataset.products.map((p) => ({ ...p, fictional })),
          sources: [
            ...speakerDataset.sources.map((s) => ({ ...s, url: `https://example.invalid/fictional/${s.id}` })),
            {
              ...speakerDataset.sources.find((s) => s.id === range.sourceId)!, id: sourceId,
              url: 'https://example.invalid/fictional/range',
              reuse: { ...REUSE_UNCHECKED, quoteFacts, basis: 'Fictional permission record' },
            },
          ],
          ranges: [{ ...range, sourceId }],
        };
        if (!fictional && (quoteFacts === 'unknown' || quoteFacts === 'prohibited')) {
          expectError(dataset, 'range.source-reuse-not-permitted', 'ranges[0]', [range.id, sourceId]);
        } else {
          expect(errors(dataset)).toEqual([]);
        }
      }
    }
  });

  it('source.reuse-value-invalid: rejects out-of-vocabulary values in every permission field', () => {
    for (const key of ['quoteFacts', 'reproduceFigures', 'storeRawData', 'redistribute'] as const) {
      for (const invalid of ['', 'ALLOWED', 'x" onerror="alert(1)']) {
        const permission = invalid as unknown as ReusePermission;
        expectError(withReuse({ ...REUSE_UNCHECKED, [key]: permission, basis: 'Fictional permission record' }),
          'source.reuse-value-invalid', 'sources[0]', [base.sourceId!]);
      }
    }
  });

  it('measurement.source-reuse-not-permitted: gates numeric real records only by quoteFacts', () => {
    const permissions: readonly ReusePermission[] = ['unknown', 'prohibited', 'allowed', 'allowed-with-attribution', 'permitted-by-law-or-terms'];
    for (const quoteFacts of permissions) {
      // These are synthetic copies exercising the real-dataset gate, not real measurements.
      const dataset = withReuse({ ...REUSE_UNCHECKED, quoteFacts, basis: 'Fictional permission record' }, false);
      const rejected = quoteFacts === 'unknown' || quoteFacts === 'prohibited';
      const cited = dataset.measurements.flatMap((m, index) => m.sourceId === base.sourceId && m.value !== null
        ? [{ code: 'measurement.source-reuse-not-permitted', severity: 'error', path: `measurements[${index}]`, relatedIds: [m.id, base.sourceId] }] : []);
      expect(errors(dataset).map(({ code, severity, path, relatedIds }) => ({ code, severity, path, relatedIds })))
        .toEqual(rejected ? cited : []);
    }
    expect(errors(withReuse(REUSE_UNCHECKED))).toEqual([]);
    const dataset = withReuse(REUSE_UNCHECKED, false);
    const missingOnly: Dataset = {
      ...dataset, measurements: dataset.measurements.map((m) => m.sourceId === base.sourceId
        ? { ...m, value: null, status: 'missing', sourceId: null } : m),
    };
    expect(errors(missingOnly)).toEqual([]);
  });

  it('source.reuse-checked-at-invalid: rejects invalid dates and accepts unknown or calendar dates', () => {
    for (const checkedAt of ['', '2026-02-29', '2026/11/08', '2026-11-08T00:00:00Z']) {
      expectError(withReuse({ ...REUSE_UNCHECKED, checkedAt }), 'source.reuse-checked-at-invalid', 'sources[0]', [base.sourceId!]);
    }
    for (const checkedAt of [null, '2024-02-29', '2026-11-08']) {
      expect(errors(withReuse({ ...REUSE_UNCHECKED, checkedAt }))).toEqual([]);
    }
  });

  it('source.reuse-basis-required: every non-unknown permission needs a nonblank basis', () => {
    for (const key of ['quoteFacts', 'reproduceFigures', 'storeRawData', 'redistribute'] as const) {
      for (const permission of ['allowed', 'allowed-with-attribution', 'permitted-by-law-or-terms', 'prohibited'] as const) {
        for (const basis of [null, '', '  ']) {
          expectError(withReuse({ ...REUSE_UNCHECKED, [key]: permission, basis }),
            'source.reuse-basis-required', 'sources[0]', [base.sourceId!]);
        }
        expect(errors(withReuse({ ...REUSE_UNCHECKED, [key]: permission, basis: 'Fictional permission record' }))).toEqual([]);
      }
    }
    expect(errors(withReuse(REUSE_UNCHECKED))).toEqual([]);
  });
});

describe('sources cited only by references or ranges', () => {
  it.each(['reference', 'range'] as const)('%s-only citations require a URL and count as referenced', (kind) => {
    const sourceId = `${kind}-only-source`;
    for (const fictional of [true, false]) {
      for (const url of [null, '', '   ', 'https://example.invalid/fictional/citation']) {
        const originalSourceId = kind === 'reference' ? reference.sourceId : range.sourceId;
        const sourceIndex = speakerDataset.sources.length;
        const dataset: Dataset = {
          ...speakerDataset, fictional,
          products: speakerDataset.products.map((p) => ({ ...p, fictional })),
          sources: [
            ...speakerDataset.sources.map((s) => ({ ...s, url: `https://example.invalid/fictional/${s.id}` })),
            { ...speakerDataset.sources.find((s) => s.id === originalSourceId)!, id: sourceId, url },
          ],
          references: kind === 'reference' ? [{ ...reference, sourceId }] : [],
          ranges: kind === 'range' ? [{ ...range, sourceId }] : [],
        };
        expect(dataset.measurements.some((m) => m.sourceId === sourceId)).toBe(false);
        const issues = validateDataset(dataset);
        const sourceIssues = issues.filter((issue) => issue.relatedIds.includes(sourceId));
        const missingUrl = url === null || url.trim() === '';
        expect(sourceIssues).toEqual(missingUrl ? [{
          code: 'source.url-missing', severity: fictional ? 'warning' : 'error',
          path: `sources[${sourceIndex}]`, relatedIds: [sourceId], message: expect.any(String),
        }] : []);
        expect(issues.filter((issue) => issue.severity === 'error')).toHaveLength(missingUrl && !fictional ? 1 : 0);
      }
    }
  });
});

describe('measurement references', () => {
  it.each(['３．７ Ω', '٣٫٧ Ω'])('reference.quantities-contain-digits: rejects Unicode digits in %s', (quantity) => {
    expectError(withReference({ quantities: ['output power', quantity] }),
      'reference.quantities-contain-digits', 'references[0]', [reference.id]);
  });

  it('accepts quantity descriptions consisting of words without digits', () => {
    expect(validateDataset(withReference({ quantities: ['output power', '感度', 'インピーダンス振幅と位相'] })))
      .toEqual(validateDataset(DEMO_DATASET));
  });

  it('reference.status-source-kind-conflict: rejects both evidence/source contradictions', () => {
    expectError(withReference({ status: 'observed', sourceId: range.sourceId }),
      'reference.status-source-kind-conflict', 'references[0]', [reference.id, range.sourceId]);
    expectError(withReference({ status: 'manufacturer' }),
      'reference.status-source-kind-conflict', 'references[0]', [reference.id, reference.sourceId]);
  });

  const cases: { code: string; patch: Partial<MeasurementReference>; relatedIds?: string[] }[] = [
    { code: 'id-empty', patch: { id: '  ' }, relatedIds: ['  '] },
    { code: 'unknown-product', patch: { productId: 'absent' }, relatedIds: [reference.id, 'absent'] },
    { code: 'unknown-source', patch: { sourceId: 'absent' }, relatedIds: [reference.id, 'absent'] },
    { code: 'metric-category-mismatch', patch: { metric: 'sensitivity' }, relatedIds: [reference.id, base.productId] },
    { code: 'quantities-empty', patch: { quantities: [] } },
    { code: 'quantities-contain-digits', patch: { quantities: ['3.7 ohms'] } },
    { code: 'accessed-at-invalid', patch: { accessedAt: '2026-02-29' } },
  ];
  it.each(cases)('reference.$code', ({ code, patch, relatedIds }) => {
    expectError(withReference(patch), `reference.${code}`, 'references[0]', relatedIds ?? [reference.id]);
    if (code === 'quantities-empty') {
      expectError(withReference({ quantities: ['power', '  '] }), 'reference.quantities-empty', 'references[0]', [reference.id]);
    }
  });

  it('reference.duplicate-id: rejects duplicate references and collisions with measurements', () => {
    expectError({ ...DEMO_DATASET, references: [reference, { ...reference }] },
      'reference.duplicate-id', 'references[1]', [reference.id]);
    expectError(withReference({ id: base.id }), 'reference.duplicate-id', 'references[0]', [base.id]);
  });

  it('accepts a valid reference without issues and ignores it in projection', () => {
    expect(validateDataset(withReference())).toEqual(validateDataset(DEMO_DATASET));
    for (const productId of ['a', 'e']) {
      // a has a numeric THD+N record, e explicitly declares it missing.
      const dataset = withReference({ productId, metric: 'thdn', quantities: ['distortion and noise'] });
      expect(projectMetric(dataset, productId, 'thdn')).toEqual(projectMetric(DEMO_DATASET, productId, 'thdn'));
      const absent = { ...dataset, measurements: dataset.measurements.filter((m) => m.productId !== productId || m.metric !== 'thdn') };
      expect(projectMetric(absent, productId, 'thdn')).toMatchObject({ status: 'missing', measurementId: null, derived: { value: null } });
    }
  });
});

describe('frequency ranges', () => {
  const cases: { code: string; patch: Partial<RangeMeasurement>; relatedIds?: string[] }[] = [
    { code: 'id-empty', patch: { id: '  ' }, relatedIds: ['  '] },
    { code: 'unknown-product', patch: { productId: 'absent' }, relatedIds: [range.id, 'absent'] },
    { code: 'product-not-speaker', patch: { productId: base.productId }, relatedIds: [range.id, base.productId] },
    { code: 'unknown-source', patch: { sourceId: 'absent' }, relatedIds: [range.id, 'absent'] },
    { code: 'status-source-kind-conflict', patch: { status: 'observed' }, relatedIds: [range.id, range.sourceId] },
    { code: 'captured-at-invalid', patch: { capturedAt: '2026-02-29' } },
  ];
  it.each(cases)('range.$code', ({ code, patch, relatedIds }) => {
    expectError(withRange(patch), `range.${code}`, 'ranges[0]', relatedIds ?? [range.id]);
    if (code === 'status-source-kind-conflict') {
      expectError(withRange({ sourceId: base.sourceId! }), 'range.status-source-kind-conflict', 'ranges[0]', [range.id, base.sourceId!]);
    }
  });

  it('range.duplicate-id: rejects duplicate ranges and collisions with measurements', () => {
    expectError({ ...speakerDataset, ranges: [range, { ...range }] }, 'range.duplicate-id', 'ranges[1]', [range.id]);
    expectError(withRange({ id: base.id }), 'range.duplicate-id', 'ranges[0]', [base.id]);
    expectError({ ...withRange({ id: reference.id }), references: [reference] },
      'range.duplicate-id', 'ranges[0]', [reference.id]);
  });

  it('range.bounds-invalid: requires finite, positive, increasing bounds', () => {
    const patches: Partial<RangeMeasurement>[] = [
      { lowHz: 0 }, { lowHz: -1 }, { lowHz: range.highHz }, { lowHz: range.highHz + 1 },
      { lowHz: NaN }, { highHz: NaN }, { lowHz: Infinity }, { highHz: Infinity }, { highHz: 0 },
    ];
    for (const patch of patches) expectError(withRange(patch), 'range.bounds-invalid', 'ranges[0]', [range.id]);
  });

  it('range.tolerance-invalid: enforces the tolerance sign and finiteness', () => {
    const patches: Partial<RangeMeasurement>[] = [
      { toleranceKind: 'minus', toleranceDb: 3 },
      { toleranceKind: 'plus-minus', toleranceDb: 0 }, { toleranceKind: 'plus-minus', toleranceDb: -3 },
      ...(['minus', 'plus-minus'] as const).flatMap((toleranceKind) =>
        [NaN, Infinity, -Infinity].map((toleranceDb) => ({ toleranceKind, toleranceDb }))),
    ];
    for (const patch of patches) expectError(withRange(patch), 'range.tolerance-invalid', 'ranges[0]', [range.id]);
  });

  it('range.version-invalid: requires a positive integer', () => {
    for (const version of [0, -1, 1.5, NaN, Infinity]) {
      expectError(withRange({ version }), 'range.version-invalid', 'ranges[0]', [range.id]);
    }
  });

  it('accepts 47–45000 Hz at -6 dB minus and 79–28000 Hz at 3 dB plus-minus', () => {
    const dataset: Dataset = { ...speakerDataset, ranges: [range, {
      ...range, id: 'range-plus-minus', lowHz: 79, highHz: 28000, toleranceDb: 3, toleranceKind: 'plus-minus',
    }] };
    expect(validateDataset(dataset)).toEqual(validateDataset(speakerDataset));
    expect(projectProduct(dataset, speaker.id)).toEqual(projectProduct(speakerDataset, speaker.id));
  });
});

describe('structured conditions and comparison-only instrument requirement', () => {
  const full: MeasurementConditions = {
    loadOhms: 8, channelsDriven: 2, bandwidthHz: [20, 20000], distortionCriterion: 'THD+N 1 %',
    outputLevel: '1 W', weighting: 'A', ...speakerConditions,
  };
  const comparedMetrics = ['power', 'thdn', 'snr', 'sensitivity', 'minimumImpedance'] as const;
  it.each(comparedMetrics)('%s needs a matching instrument on both sides', (metric) => {
    const a: Measurement = { ...base, metric, unit: METRIC_UNITS[metric].canonical, conditions: full, uncertainty: { type: 'relative', plusMinusPercent: 1 } };
    const b = { ...a, id: 'other' };
    expect(COMPARISON_REQUIRED_CONDITIONS[metric]).toContain('instrument');
    expect(explainComparability(a, b)).toEqual({ level: 'comparable', reasons: [] });
    const withoutInstrument = { ...full };
    delete withoutInstrument.instrument;
    const missing = { ...b, conditions: withoutInstrument };
    for (const [left, right] of [[a, missing], [missing, a], [missing, missing]] as const) {
      const result = explainComparability(left, right);
      expect(result.level).toBe('not-comparable');
      expect(result.reasons).toContainEqual({ code: 'conditions.unrecorded', details: ['instrument'], message: expect.stringContaining('測定機器') });
    }
    const result = explainComparability(a, { ...b, conditions: { ...full, instrument: 'Fictional analyzer B' } });
    expect(result).toEqual({ level: 'not-comparable', reasons: [{
      code: 'conditions.mismatch', details: ['instrument'], message: expect.stringContaining('測定機器'),
    }] });
    for (const instrument of ['Fictional analyzer A', 'Fictional analyzer B']) expect(result.reasons[0]!.message).toContain(instrument);
  });

  it.each(comparedMetrics)('%s treats blank instruments on either or both sides as unrecorded', (metric) => {
    const a: Measurement = {
      ...base, metric, unit: METRIC_UNITS[metric].canonical, conditions: full,
      uncertainty: { type: 'relative', plusMinusPercent: 1 },
    };
    for (const instrument of ['', '   ', '\t\n']) {
      const blank = { ...a, id: 'blank-instrument', conditions: { ...full, instrument } };
      for (const [left, right] of [[a, blank], [blank, a], [blank, blank]] as const) {
        const result = explainComparability(left, right);
        expect(result.level).toBe('not-comparable');
        expect(result.reasons).toContainEqual({
          code: 'conditions.unrecorded', details: ['instrument'], message: expect.stringContaining('測定機器'),
        });
      }
    }
    expect(explainComparability(a, { ...a, id: 'matching-instrument' })).toEqual({ level: 'comparable', reasons: [] });
  });

  it('instrument is never required for eligibility and does not create a power projection warning', () => {
    for (const metric of METRIC_IDS) expect(REQUIRED_CONDITIONS[metric]).not.toContain('instrument');
    const conditions: MeasurementConditions = { loadOhms: 8, channelsDriven: 2, bandwidthHz: [20, 20000], distortionCriterion: 'THD+N 1 %' };
    expect(REQUIRED_CONDITIONS.power).toEqual(['loadOhms', 'channelsDriven', 'bandwidthHz', 'distortionCriterion']);
    const dataset = withMeasurement({ conditions });
    expect(projectMetric(dataset, base.productId, 'power')).toMatchObject({ status: 'observed', derived: { value: base.value }, issues: [] });
    expect(toMetricValues(projectProduct(dataset, base.productId)).power).toBe(base.value);
  });

  it('price comparisons are unaffected by missing or different instruments', () => {
    const price: Measurement = { ...base, metric: 'price', unit: 'JPY', conditions: {}, uncertainty: { type: 'relative', plusMinusPercent: 1 } };
    for (const conditions of [{}, { instrument: '' }, { instrument: '   ' }, { instrument: 'Fictional analyzer A' }, { instrument: 'Fictional analyzer B' }]) {
      expect(explainComparability(price, { ...price, conditions })).toEqual({ level: 'comparable', reasons: [] });
      expect(explainComparability({ ...price, conditions: { instrument: 'Fictional analyzer A' } }, { ...price, conditions }))
        .toEqual({ level: 'comparable', reasons: [] });
      expect(explainComparability({ ...price, conditions }, { ...price, conditions })).toEqual({ level: 'comparable', reasons: [] });
    }
  });

  it('formats new condition values with explicit units and labels every known key exactly once', () => {
    expect(formatConditionValue('averagingBandHz', { averagingBandHz: [300, 3000] })).toBe('300–3000 Hz');
    expect(formatConditionValue('averagingBandHz', { averagingBandHz: [1000, 1000] })).toBe('1000 Hz');
    expect(formatConditionValue('distanceM', { distanceM: 1 })).toBe('1 m');
    expect(formatConditionValue('sensitivityReference', { sensitivityReference: '2.83V/1m' })).toBe('2.83V/1m');
    expect(Object.keys(CONDITION_LABELS).sort()).toEqual([...CONDITION_KEYS].sort());
    for (const key of CONDITION_KEYS) expect(CONDITION_LABELS[key].trim()).not.toBe('');
  });
});

describe('recorded condition value validation', () => {
  const invalid: { name: string; key: keyof MeasurementConditions; conditions: MeasurementConditions }[] = [
    ...(['instrument', 'testSignal', 'averaging', 'distortionCriterion', 'inputSignal', 'outputLevel', 'method'] as const)
      .flatMap((key) => ['', '   ', '\t\n'].map((value) => ({ name: `${key} ${JSON.stringify(value)}`, key, conditions: { [key]: value } }))),
    ...(['distanceM', 'frequencyHz', 'loadOhms'] as const)
      .flatMap((key) => [0, -1, NaN, Infinity].map((value) => ({ name: `${key} ${value}`, key, conditions: { [key]: value } }))),
    ...[0, -1, 1.5, NaN, Infinity].map((channelsDriven) => ({
      name: `channelsDriven ${channelsDriven}`, key: 'channelsDriven' as const, conditions: { channelsDriven },
    })),
    { name: 'descending averaging band', key: 'averagingBandHz', conditions: { averagingBandHz: [3000, 300] } },
    { name: 'zero averaging band start', key: 'averagingBandHz', conditions: { averagingBandHz: [0, 100] } },
    { name: 'nonfinite averaging band end', key: 'averagingBandHz', conditions: { averagingBandHz: [100, NaN] } },
    { name: 'equal bandwidth bounds', key: 'bandwidthHz', conditions: { bandwidthHz: [20, 20] } },
    { name: 'descending bandwidth', key: 'bandwidthHz', conditions: { bandwidthHz: [20000, 20] } },
    { name: 'zero bandwidth start', key: 'bandwidthHz', conditions: { bandwidthHz: [0, 20000] } },
    { name: 'nonfinite bandwidth end', key: 'bandwidthHz', conditions: { bandwidthHz: [20, Infinity] } },
  ];

  it.each(invalid)('$name is rejected by conditionProblems and all three record validators', ({ key, conditions }) => {
    expect(conditionProblems(conditions)).toEqual([expect.stringContaining(key)]);
    expectError(withMeasurement({ conditions }), 'measurement.condition-value-invalid', 'measurements[0]', [base.id]);
    expectError(withReference({ conditions }), 'reference.condition-value-invalid', 'references[0]', [reference.id]);
    expectError(withRange({ conditions }), 'range.condition-value-invalid', 'ranges[0]', [range.id]);
  });

  it('accepts absent conditions, demo conditions, full speaker sensitivity conditions and spot averaging', () => {
    const fullSensitivity: MeasurementConditions = {
      ...speakerConditions, testSignal: 'Fictional pink noise', inputSignal: '2.83 V',
      outputLevel: 'Fictional reference SPL', method: 'Fictional sensitivity procedure',
    };
    for (const conditions of [{}, DEMO_CONDITIONS, fullSensitivity, { ...fullSensitivity, averagingBandHz: [1000, 1000] as const }]) {
      expect(conditionProblems(conditions)).toEqual([]);
      expect(errors(withMeasurement({ conditions }))).toEqual([]);
      expect(errors(withReference({ conditions }))).toEqual([]);
      expect(errors(withRange({ conditions }))).toEqual([]);
    }
  });
});

describe('runtime shape guards (final audit: status vocabulary, condition types, export gate)', () => {
  const hostile = 'observed" onmouseover="alert(1)';

  it('rejects an evidence status outside the vocabulary on measurements, references and ranges', () => {
    const status = hostile as unknown as Measurement['status'];
    expectError(withMeasurement({ status }), 'measurement.status-invalid', 'measurements[0]', [base.id]);
    expectError(withReference({ status: status as MeasurementReference['status'] }), 'reference.status-invalid', 'references[0]', [reference.id]);
    expectError(withRange({ status: status as RangeMeasurement['status'] }), 'range.status-invalid', 'ranges[0]', [range.id]);
    // `missing` is a measurement status but never a reference or range status: the record exists.
    const missing = 'missing' as unknown as MeasurementReference['status'];
    expectError(withReference({ status: missing }), 'reference.status-invalid', 'references[0]', [reference.id]);
    expectError(withRange({ status: missing }), 'range.status-invalid', 'ranges[0]', [range.id]);
    for (const ok of ['observed', 'manufacturer', 'estimated'] as const) {
      expect(errors(withReference({ status: ok, sourceId: 'DEMO-LAB-001' })).map((e) => e.code)).not.toContain('reference.status-invalid');
    }
  });

  const malformed: { name: string; key: string; conditions: Record<string, unknown> }[] = [
    { name: 'null instrument', key: 'instrument', conditions: { instrument: null } },
    { name: 'numeric instrument', key: 'instrument', conditions: { instrument: 42 } },
    { name: 'boolean instrument', key: 'instrument', conditions: { instrument: true } },
    { name: 'null sensitivity reference', key: 'sensitivityReference', conditions: { sensitivityReference: null } },
    { name: 'blank sensitivity reference', key: 'sensitivityReference', conditions: { sensitivityReference: '' } },
    { name: 'numeric sensitivity reference', key: 'sensitivityReference', conditions: { sensitivityReference: 42 } },
    { name: 'free-text sensitivity reference', key: 'sensitivityReference', conditions: { sensitivityReference: '2.83 V at 1 m' } },
    { name: 'unknown weighting', key: 'weighting', conditions: { weighting: 'B' } },
    { name: 'unknown environment', key: 'environment', conditions: { environment: 'outdoor' } },
    { name: 'unknown load type', key: 'loadType', conditions: { loadType: 'inductive' } },
    { name: 'string distance', key: 'distanceM', conditions: { distanceM: '1' } },
    { name: 'null load', key: 'loadOhms', conditions: { loadOhms: null } },
    { name: 'string channel count', key: 'channelsDriven', conditions: { channelsDriven: '2' } },
    { name: 'string band', key: 'bandwidthHz', conditions: { bandwidthHz: '20-20000' } },
    { name: 'one-element band', key: 'averagingBandHz', conditions: { averagingBandHz: [300] } },
    { name: 'three-element band', key: 'bandwidthHz', conditions: { bandwidthHz: [20, 200, 20000] } },
    { name: 'string band bounds', key: 'averagingBandHz', conditions: { averagingBandHz: ['300', '3000'] } },
    { name: 'unknown key', key: 'temperatureC', conditions: { temperatureC: 20 } },
  ];
  it.each(malformed)('$name is a condition problem for every record type and never throws', ({ key, conditions }) => {
    const c = conditions as MeasurementConditions;
    expect(conditionProblems(c)).toEqual([expect.stringContaining(key)]);
    for (const [ds, code, path, id] of [
      [withMeasurement({ conditions: c }), 'measurement.condition-value-invalid', 'measurements[0]', base.id],
      [withReference({ conditions: c }), 'reference.condition-value-invalid', 'references[0]', reference.id],
      [withRange({ conditions: c }), 'range.condition-value-invalid', 'ranges[0]', range.id],
    ] as const) {
      expect(() => validateDataset(ds)).not.toThrow();
      expect(errors(ds)).toContainEqual(expect.objectContaining({ code, path, relatedIds: [id] }));
    }
  });

  it('treats null, blank and malformed values as unrecorded for required and comparison-only conditions alike', () => {
    const sensitivity = (patch: Record<string, unknown>, id = base.id): Measurement => ({
      ...base, id, productId: speaker.id, metric: 'sensitivity', unit: 'dB', value: 86,
      conditions: { ...speakerConditions, ...patch } as MeasurementConditions, uncertainty: { type: 'relative', plusMinusPercent: 1 },
    });
    const good = sensitivity({});
    expect(explainComparability(good, sensitivity({}, 'other'))).toEqual({ level: 'comparable', reasons: [] });
    for (const sensitivityReference of [null, '', '  ', 42, '2.83 V at 1 m']) {
      const bad = sensitivity({ sensitivityReference }, 'bad');
      expect(unrecordedRequiredConditions('sensitivity', bad.conditions)).toEqual(['sensitivityReference']);
      for (const [left, right] of [[good, bad], [bad, good], [bad, bad]] as const) {
        const result = explainComparability(left, right);
        expect(result.level).toBe('not-comparable');
        expect(result.reasons).toContainEqual({ code: 'conditions.unrecorded', details: ['sensitivityReference'], message: expect.stringContaining('感度基準') });
      }
    }
    for (const instrument of [null, 42, true]) {
      const bad = sensitivity({ instrument }, 'bad');
      expect(unrecordedRequiredConditions('sensitivity', bad.conditions)).toEqual([]);
      const result = explainComparability(good, bad);
      expect(result.level).toBe('not-comparable');
      expect(result.reasons).toContainEqual({ code: 'conditions.unrecorded', details: ['instrument'], message: expect.stringContaining('測定機器') });
      const ds: Dataset = { ...speakerDataset, measurements: [...speakerDataset.measurements, bad] };
      expect(() => validateDataset(ds)).not.toThrow();
      expect(errors(ds)).toContainEqual(expect.objectContaining({ code: 'measurement.condition-value-invalid', relatedIds: ['bad'] }));
    }
  });

  it('the JSON export refuses an unusable dataset instead of exporting anything from it', () => {
    const weights = WEIGHT_PRESETS.balanced;
    expect(JSON.parse(buildCatalogJson([], weights, { date: '2026-11-08', dataset: DEMO_DATASET })).datasetSchemaVersion).toBe('1.1');
    const wrongVersion = { ...DEMO_DATASET, schemaVersion: '0.9' } as unknown as Dataset;
    expect(() => buildCatalogJson([], weights, { date: '2026-11-08', dataset: wrongVersion })).toThrow(/dataset\.schema-version/);
    const first = DEMO_DATASET.sources[0]!;
    const sourceOnly: Dataset = {
      ...DEMO_DATASET, products: [], measurements: [], references: [], ranges: [],
      sources: [{ ...first, reuse: { ...first.reuse, quoteFacts: hostile as unknown as ReusePermission } }],
    };
    expect(() => buildCatalogJson([], weights, { date: '2026-11-08', dataset: sourceOnly })).toThrow(/source\.reuse-value-invalid/);
  });
});
