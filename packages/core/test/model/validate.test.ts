import { describe, expect, it } from 'vitest';
import { DEMO_DATASET } from '../../src/model/demo-dataset.ts';
import type { Dataset, Measurement, QualityIssue, Source, Uncertainty } from '../../src/model/types.ts';
import { isDatasetUsable, validateDataset } from '../../src/model/validate.ts';

const japanese = /[\u3040-\u30ff\u3400-\u9fff]/u;
const base = DEMO_DATASET.measurements[0]!;

function withMeasurement(patch: Partial<Measurement>, index = 0): Dataset {
  return { ...DEMO_DATASET, measurements: DEMO_DATASET.measurements.map((m, i) => i === index ? { ...m, ...patch } : m) };
}

function withSource(patch: Partial<Source>): Dataset {
  return { ...DEMO_DATASET, sources: DEMO_DATASET.sources.map((s, i) => i === 0 ? { ...s, ...patch } : s) };
}

function identity(issue: QualityIssue) {
  return { code: issue.code, severity: issue.severity, path: issue.path, relatedIds: issue.relatedIds };
}

// Schema 1.1 intentionally leaves these demo conditions unknown: 6 power,
// 5 non-missing THD+N and 5 non-missing S/N records (16), plus 7 source URLs.
// Derive record ids, positions and counts from the fixture, not validator output.
const missingConditions = DEMO_DATASET.measurements.flatMap((measurement, index) => {
  if (measurement.status === 'missing') return [];
  const keys = measurement.metric === 'power' ? ['distortionCriterion']
    : measurement.metric === 'thdn' ? ['outputLevel']
      : measurement.metric === 'snr' ? ['weighting', 'outputLevel'] : [];
  return keys.length > 0 ? [{ index, id: measurement.id, keys }] : [];
});
const missingSourceUrls = DEMO_DATASET.sources.flatMap((source, index) =>
  source.url === null && DEMO_DATASET.measurements.some((m) =>
    m.sourceId === source.id && (m.status === 'observed' || m.status === 'manufacturer'))
    ? [{ code: 'source.url-missing', severity: 'warning', path: `sources[${index}]`, relatedIds: [source.id] }] : []);
const demoWarningIdentities = [
  ...missingSourceUrls,
  ...missingConditions.map(({ index, id }) => ({
    code: 'measurement.required-condition-unrecorded', severity: 'warning', path: `measurements[${index}]`, relatedIds: [id],
  })),
];

describe('demo dataset validation', () => {
  it('has exactly seven source and sixteen condition warnings, no errors, and is usable', () => {
    const issues = validateDataset(DEMO_DATASET);
    expect(issues).toHaveLength(missingSourceUrls.length + missingConditions.length);
    expect(issues.filter((issue) => issue.severity === 'error')).toEqual([]);
    expect(issues.map(identity)).toEqual(demoWarningIdentities);
    for (const { id, keys } of missingConditions) {
      const issue = issues.find((item) => item.relatedIds[0] === id)!;
      for (const key of keys) expect(issue.message).toContain(key);
    }
    for (const issue of issues) expect(issue.message).toMatch(japanese);
    expect(isDatasetUsable(DEMO_DATASET)).toBe(true);
  });

  it('returns no issues for an empty dataset', () => {
    expect(validateDataset({ ...DEMO_DATASET, products: [], sources: [], measurements: [] })).toEqual([]);
  });
});

interface ErrorCase {
  code: string;
  dataset: Dataset;
  path: string;
  relatedIds: string[];
}

const errorCases: ErrorCase[] = [
  { code: 'dataset.schema-version', dataset: { ...DEMO_DATASET, schemaVersion: '2.0' } as unknown as Dataset, path: 'schemaVersion', relatedIds: [] },
  { code: 'dataset.fictional-mismatch', dataset: { ...DEMO_DATASET, products: DEMO_DATASET.products.map((p, i) => i === 0 ? { ...p, fictional: false } : p) }, path: 'products[0]', relatedIds: ['a'] },
  { code: 'product.duplicate-id', dataset: { ...DEMO_DATASET, products: [...DEMO_DATASET.products, { ...DEMO_DATASET.products[0]! }] }, path: 'products[6]', relatedIds: ['a'] },
  { code: 'source.duplicate-id', dataset: { ...DEMO_DATASET, sources: [...DEMO_DATASET.sources, { ...DEMO_DATASET.sources[0]! }] }, path: 'sources[7]', relatedIds: ['DEMO-LAB-001'] },
  { code: 'measurement.duplicate-id', dataset: { ...DEMO_DATASET, measurements: [...DEMO_DATASET.measurements, { ...base }] }, path: 'measurements[24]', relatedIds: ['m-a-power'] },
  { code: 'measurement.unknown-product', dataset: withMeasurement({ productId: 'absent-product' }), path: 'measurements[0]', relatedIds: ['m-a-power', 'absent-product'] },
  { code: 'measurement.unknown-source', dataset: withMeasurement({ sourceId: 'absent-source' }), path: 'measurements[0]', relatedIds: ['m-a-power', 'absent-source'] },
  { code: 'measurement.value-status-mismatch', dataset: withMeasurement({ value: null }), path: 'measurements[0]', relatedIds: ['m-a-power'] },
  { code: 'measurement.value-not-finite', dataset: withMeasurement({ value: NaN }), path: 'measurements[0]', relatedIds: ['m-a-power'] },
  { code: 'measurement.source-required', dataset: withMeasurement({ sourceId: null }), path: 'measurements[0]', relatedIds: ['m-a-power'] },
  { code: 'measurement.unit-not-accepted', dataset: withMeasurement({ unit: 'dB' }), path: 'measurements[0]', relatedIds: ['m-a-power'] },
  { code: 'measurement.derivation-required', dataset: withMeasurement({ status: 'estimated' }), path: 'measurements[0]', relatedIds: ['m-a-power'] },
  { code: 'measurement.derivation-forbidden', dataset: withMeasurement({ derivation: '計算式' }), path: 'measurements[0]', relatedIds: ['m-a-power'] },
  { code: 'measurement.uncertainty-zero', dataset: withMeasurement({ uncertainty: { type: 'absolute', plusMinus: 0, unit: 'W' } }), path: 'measurements[0]', relatedIds: ['m-a-power'] },
  { code: 'measurement.version-invalid', dataset: withMeasurement({ version: 0 }), path: 'measurements[0]', relatedIds: ['m-a-power'] },
  { code: 'source.accessed-at-invalid', dataset: withSource({ accessedAt: '2026/11/08' }), path: 'sources[0]', relatedIds: ['DEMO-LAB-001'] },
  { code: 'measurement.status-source-kind-conflict', dataset: withMeasurement({ sourceId: 'DEMO-MFG-001' }), path: 'measurements[0]', relatedIds: ['m-a-power', 'DEMO-MFG-001'] },
];

describe('each contracted error', () => {
  it.each(errorCases)('$code has error severity, a record path and the involved ids', ({ code, dataset, path, relatedIds }) => {
    const issues = validateDataset(dataset);
    expect(issues.filter((issue) => issue.severity === 'error').map(identity)).toEqual([{ code, severity: 'error', path, relatedIds }]);
    expect(isDatasetUsable(dataset)).toBe(false);
    for (const issue of issues) expect(issue.message).toMatch(japanese);
  });
});

describe('value, provenance and revision boundaries', () => {
  it('rejects a missing-status measurement with a value', () => {
    const issues = validateDataset(withMeasurement({ value: 0.01 }, 18));
    expect(issues.filter((i) => i.severity === 'error').map(identity)).toEqual([{
      code: 'measurement.value-status-mismatch', severity: 'error', path: 'measurements[18]', relatedIds: ['m-e-thdn'],
    }]);
  });

  it.each([NaN, Infinity, -Infinity])('rejects non-finite value %s', (value) => {
    expect(validateDataset(withMeasurement({ value })).filter((i) => i.severity === 'error').map((i) => i.code)).toEqual(['measurement.value-not-finite']);
  });

  it('also rejects manufacturer status with an independent lab source', () => {
    expect(validateDataset(withMeasurement({ status: 'manufacturer' })).filter((i) => i.severity === 'error').map(identity)).toEqual([{
      code: 'measurement.status-source-kind-conflict', severity: 'error', path: 'measurements[0]', relatedIds: ['m-a-power', 'DEMO-LAB-001'],
    }]);
  });

  it('accepts an estimate with a derivation and THD+N in dB', () => {
    expect(isDatasetUsable(withMeasurement({ status: 'estimated', derivation: '計算式' }))).toBe(true);
    expect(isDatasetUsable(withMeasurement({ unit: 'dB', value: -80 }, 1))).toBe(true);
  });

  it.each([0, -1, 1.5, NaN, Infinity])('rejects invalid version %s', (version) => {
    expect(validateDataset(withMeasurement({ version })).filter((i) => i.severity === 'error').map((i) => i.code)).toEqual(['measurement.version-invalid']);
  });

  it('accepts version 1', () => {
    expect(isDatasetUsable(withMeasurement({ version: 1 }))).toBe(true);
  });

  it.each(['2026/11/08', '2026-13-01', '2026-02-30', '', '2026-02-29', '2026-04-31', '2026-00-01', '2026-11-00', '2026-1-08', '2026-11-08T00:00:00Z'])('rejects invalid source access date %j', (accessedAt) => {
    expect(validateDataset(withSource({ accessedAt })).filter((i) => i.severity === 'error').map((i) => i.code)).toEqual(['source.accessed-at-invalid']);
  });

  it.each(['2026-11-08', '2024-02-29', '2000-02-29'])('accepts real ISO date %s', (accessedAt) => {
    expect(isDatasetUsable(withSource({ accessedAt }))).toBe(true);
  });

  const uncertainties: { uncertainty: Uncertainty | null; error: boolean }[] = [
    { uncertainty: { type: 'absolute', plusMinus: 0, unit: 'W' }, error: true },
    { uncertainty: { type: 'absolute', plusMinus: 0.1, unit: 'W' }, error: false },
    { uncertainty: { type: 'relative', plusMinusPercent: 0 }, error: true },
    { uncertainty: { type: 'relative', plusMinusPercent: 0.1 }, error: false },
    { uncertainty: { type: 'range', low: 85, high: 85, unit: 'W' }, error: true },
    { uncertainty: { type: 'range', low: 84, high: 86, unit: 'W' }, error: false },
    { uncertainty: null, error: false },
  ];
  it.each(uncertainties)('checks uncertainty $uncertainty', ({ uncertainty, error }) => {
    expect(validateDataset(withMeasurement({ uncertainty })).filter((i) => i.severity === 'error').map((i) => i.code))
      .toEqual(error ? ['measurement.uncertainty-zero'] : []);
  });
});

describe('warning scope and deterministic order', () => {
  it('warns for each incompatible pair in the same product and metric, naming both measurements', () => {
    const extra: Measurement = { ...base, id: 'm-a-power-4ohm', conditions: { ...base.conditions, loadOhms: 4 } };
    const issues = validateDataset({ ...DEMO_DATASET, measurements: [...DEMO_DATASET.measurements, extra] });
    expect(issues.filter((i) => i.code === 'measurement.conditions-not-identical-within-product').map(identity)).toEqual([{
      code: 'measurement.conditions-not-identical-within-product', severity: 'warning', path: 'measurements[24]', relatedIds: ['m-a-power', 'm-a-power-4ohm'],
    }]);
    expect(issues.at(-1)!.message).toMatch(japanese);
    expect(issues.at(-1)!.message).toContain('loadOhms');
  });

  it('compares all preceding pairs once in dataset order', () => {
    const measurements = [base, ...[4, 6].map((loadOhms) => ({ ...base, id: `power-${loadOhms}`, conditions: { ...base.conditions, loadOhms } }))];
    expect(validateDataset({ ...DEMO_DATASET, measurements }).filter((i) => i.code === 'measurement.conditions-not-identical-within-product')
      .map((i) => [i.path, i.relatedIds])).toEqual([
      ['measurements[1]', ['m-a-power', 'power-4']],
      ['measurements[2]', ['m-a-power', 'power-6']],
      ['measurements[2]', ['power-4', 'power-6']],
    ]);
  });

  it.each([
    { id: 'same-conditions', conditions: { ...base.conditions, bandwidthHz: [20, 20000] as const } },
    { id: 'different-product', productId: 'b', conditions: { ...base.conditions, loadOhms: 4 } },
    { id: 'different-metric', metric: 'thdn' as const, unit: '%' as const, conditions: { ...base.conditions, loadOhms: 4 } },
    { id: 'missing-record', status: 'missing' as const, value: null, sourceId: null, conditions: { ...base.conditions, loadOhms: 4 } },
  ])('does not warn about within-product conditions for $id', (patch) => {
    const issues = validateDataset({ ...DEMO_DATASET, measurements: [base, { ...base, ...patch }] });
    expect(issues.some((i) => i.code === 'measurement.conditions-not-identical-within-product')).toBe(false);
  });

  it('does not invent a condition mismatch when both condition sets are empty', () => {
    const measurements = [{ ...base, conditions: {} }, { ...base, id: 'empty-2', conditions: {} }];
    const issues = validateDataset({ ...DEMO_DATASET, measurements });
    expect(issues.filter((i) => i.code === 'measurement.required-condition-unrecorded')).toHaveLength(2);
    expect(issues.some((i) => i.code === 'measurement.conditions-not-identical-within-product')).toBe(false);
  });

  it('warns only for null URLs cited by observed or manufacturer records', () => {
    const dataset: Dataset = {
      ...DEMO_DATASET,
      measurements: [{ ...base, status: 'estimated', derivation: '計算式' }],
    };
    expect(validateDataset(dataset).some((i) => i.code === 'source.url-missing')).toBe(false);
    expect(validateDataset(withSource({ url: 'https://example.invalid/fictional' })).filter((i) => i.code === 'source.url-missing')).toHaveLength(6);
  });

  it('reports a product without any records, but a missing measurement still counts as a record', () => {
    const dataset = { ...DEMO_DATASET, products: [...DEMO_DATASET.products, { ...DEMO_DATASET.products[0]!, id: 'empty' }] };
    expect(validateDataset(dataset).filter((i) => i.code === 'product.no-measurements').map(identity)).toEqual([{
      code: 'product.no-measurements', severity: 'warning', path: 'products[6]', relatedIds: ['empty'],
    }]);
    expect(validateDataset({ ...dataset, measurements: [...dataset.measurements, { ...base, id: 'unknown', productId: 'empty', status: 'missing', value: null, sourceId: null }] })
      .some((i) => i.code === 'product.no-measurements')).toBe(false);
  });

  it('keeps products, sources and measurements in input order without mutating recursively frozen input', () => {
    const copy = JSON.parse(JSON.stringify(DEMO_DATASET)) as Dataset;
    const dataset: Dataset = {
      ...copy,
      products: [{ ...copy.products[0]!, fictional: false }, ...copy.products.slice(1), { ...copy.products[0]!, id: 'empty' }],
      sources: copy.sources.map((s, i) => i === 1 ? { ...s, accessedAt: '' } : s),
      measurements: copy.measurements.map((m, i) => i === 0 ? { ...m, version: 0 } : m),
    };
    function deepFreeze(value: unknown): void {
      if (value !== null && typeof value === 'object') {
        for (const child of Object.values(value)) deepFreeze(child);
        Object.freeze(value);
      }
    }
    const before = JSON.stringify(dataset);
    deepFreeze(dataset);
    const expected = [
      { code: 'dataset.fictional-mismatch', severity: 'error', path: 'products[0]', relatedIds: ['a'] },
      { code: 'product.no-measurements', severity: 'warning', path: 'products[6]', relatedIds: ['empty'] },
      demoWarningIdentities[0],
      { code: 'source.accessed-at-invalid', severity: 'error', path: 'sources[1]', relatedIds: ['DEMO-MFG-001'] },
      ...demoWarningIdentities.slice(1, missingSourceUrls.length),
      { code: 'measurement.version-invalid', severity: 'error', path: 'measurements[0]', relatedIds: ['m-a-power'] },
      ...demoWarningIdentities.slice(missingSourceUrls.length),
    ];
    const issues = validateDataset(dataset);
    expect(issues.map(identity)).toEqual(expected);
    expect(validateDataset(dataset)).toEqual(issues);
    expect(JSON.stringify(dataset)).toBe(before);
    for (const issue of issues) expect(issue.message).toMatch(japanese);
  });
});

describe('rules added after the worker report', () => {
  const base = DEMO_DATASET.measurements.find((m) => m.id === 'm-a-power')!;
  const withMeasurement = (over: Partial<typeof base>) => ({
    ...DEMO_DATASET,
    measurements: [{ ...base, id: 'probe', ...over }],
  });
  const codesOf = (ds: Dataset) => validateDataset(ds).filter((i) => i.severity === 'error').map((i) => i.code);

  it('forbids a source on a missing record', () => {
    expect(codesOf(withMeasurement({ status: 'missing', value: null, sourceId: 'DEMO-LAB-001' }))).toEqual(['measurement.source-forbidden']);
    expect(codesOf(withMeasurement({ status: 'missing', value: null, sourceId: null }))).toEqual([]);
  });

  it('treats a blank derivation as missing for estimated values', () => {
    expect(codesOf(withMeasurement({ status: 'estimated', derivation: '   ' }))).toEqual(['measurement.derivation-required']);
    expect(codesOf(withMeasurement({ status: 'estimated', derivation: 'from rated power' }))).toEqual([]);
  });

  it.each([
    { type: 'absolute' as const, plusMinus: -1, unit: 'W' as const },
    { type: 'absolute' as const, plusMinus: NaN, unit: 'W' as const },
    { type: 'relative' as const, plusMinusPercent: -5 },
    { type: 'range' as const, low: 90, high: 80, unit: 'W' as const },
    { type: 'range' as const, low: 80, high: Infinity, unit: 'W' as const },
  ])('rejects invalid uncertainty %j', (uncertainty) => {
    expect(codesOf(withMeasurement({ uncertainty }))).toEqual(['measurement.uncertainty-invalid']);
  });

  it('accepts well-formed uncertainty', () => {
    expect(codesOf(withMeasurement({ uncertainty: { type: 'absolute', plusMinus: 0.5, unit: 'W' } }))).toEqual([]);
    expect(codesOf(withMeasurement({ uncertainty: { type: 'range', low: 80, high: 90, unit: 'W' } }))).toEqual([]);
  });
});

describe('review regression: value domains and dates', () => {
  const domainCases: { metric: Measurement['metric']; unit: Measurement['unit']; value: number; expectedCodes: string[] }[] =
    [
      { metric: 'price' as const, unit: 'JPY' as const, positiveOnly: true },
      { metric: 'power' as const, unit: 'W' as const, positiveOnly: true },
      { metric: 'thdn' as const, unit: '%' as const, positiveOnly: true },
      { metric: 'thdn' as const, unit: 'dB' as const, positiveOnly: false },
      { metric: 'snr' as const, unit: 'dB' as const, positiveOnly: false },
    ].flatMap(({ metric, unit, positiveOnly }) => [-80, -1, 0, Number.MIN_VALUE, 1e-12, 85, NaN, Infinity, -Infinity].map((value) => ({
      metric, unit, value,
      expectedCodes: !Number.isFinite(value) ? ['measurement.value-not-finite']
        : positiveOnly && value <= 0 ? ['measurement.value-out-of-domain'] : [],
    })));

  it.each(domainCases)('$metric $value $unit has errors $expectedCodes', ({ metric, unit, value, expectedCodes }) => {
    const issues = validateDataset(withMeasurement({ metric, unit, value }));
    expect(issues.filter((i) => i.severity === 'error').map((i) => i.code)).toEqual(expectedCodes);
  });

  const dates = [
    { date: '2026-11-08', valid: true }, { date: '2024-02-29', valid: true }, { date: '2000-02-29', valid: true },
    ...['2026/11/08', '2026-13-01', '2026-02-30', '', '2026-02-29', '2026-04-31', '2026-00-01', '2026-11-00', '2026-1-08', '2026-11-08T00:00:00Z']
      .map((date) => ({ date, valid: false })),
  ];
  it.each(dates)('checks all date fields against the same calendar rules: $date', ({ date, valid }) => {
    const probes = [
      { dataset: withSource({ accessedAt: date }), code: 'source.accessed-at-invalid', path: 'sources[0]' },
      { dataset: withSource({ publishedAt: date }), code: 'source.published-at-invalid', path: 'sources[0]' },
      { dataset: withMeasurement({ capturedAt: date }), code: 'measurement.captured-at-invalid', path: 'measurements[0]' },
    ];
    for (const { dataset, code, path } of probes) {
      expect(validateDataset(dataset).filter((i) => i.severity === 'error').map((i) => ({ code: i.code, path: i.path })))
        .toEqual(valid ? [] : [{ code, path }]);
    }
  });

  it('accepts unknown publication and measurement dates', () => {
    expect(isDatasetUsable(withSource({ publishedAt: null }))).toBe(true);
    expect(isDatasetUsable(withMeasurement({ capturedAt: null }))).toBe(true);
  });
});

describe('review regression: sources and ids', () => {
  it.each([null, '', ' \t '])('treats URL %j as missing with dataset-specific severity', (url) => {
    for (const fictional of [true, false]) {
      const dataset = withSource({ url });
      const issues = validateDataset({ ...dataset, fictional, products: dataset.products.map((p) => ({ ...p, fictional })) });
      expect(issues.filter((i) => i.code === 'source.url-missing' && i.path === 'sources[0]').map(identity)).toEqual([{
        code: 'source.url-missing', severity: fictional ? 'warning' : 'error', path: 'sources[0]', relatedIds: [DEMO_DATASET.sources[0]!.id],
      }]);
    }
  });

  it.each([false, true])('does not infer source-kind conflicts from duplicate ids (reversed: %s)', (reversed) => {
    const original = DEMO_DATASET.sources[0]!;
    const duplicate: Source = { ...original, kind: 'manufacturer' };
    const sources = reversed ? [duplicate, original] : [original, duplicate];
    const issues = validateDataset({ ...DEMO_DATASET, sources: [...sources, ...DEMO_DATASET.sources.slice(1)] });
    expect(issues.filter((i) => i.severity === 'error').map(identity)).toEqual([{
      code: 'source.duplicate-id', severity: 'error', path: 'sources[1]', relatedIds: [original.id],
    }]);
  });

  it.each(['', ' \t '])('rejects blank ids %j on all record types', (id) => {
    const dataset: Dataset = {
      ...DEMO_DATASET,
      products: [{ ...DEMO_DATASET.products[0]!, id }],
      sources: [{ ...DEMO_DATASET.sources[0]!, id }],
      measurements: [{ ...base, id, productId: id, sourceId: id }],
    };
    expect(validateDataset(dataset).filter((i) => i.severity === 'error').map(identity)).toEqual([
      { code: 'product.id-empty', severity: 'error', path: 'products[0]', relatedIds: [id] },
      { code: 'source.id-empty', severity: 'error', path: 'sources[0]', relatedIds: [id] },
      { code: 'measurement.id-empty', severity: 'error', path: 'measurements[0]', relatedIds: [id] },
    ]);
  });

  it('warns for an unreferenced source and counts estimated citations as references', () => {
    const unused = { ...DEMO_DATASET.sources[0]!, id: 'unused' };
    const dataset = { ...DEMO_DATASET, sources: [...DEMO_DATASET.sources, unused] };
    expect(validateDataset(dataset).filter((i) => i.code === 'source.unreferenced').map(identity)).toEqual([{
      code: 'source.unreferenced', severity: 'warning', path: 'sources[7]', relatedIds: ['unused'],
    }]);
    expect(validateDataset({ ...dataset, measurements: [...dataset.measurements, { ...base, id: 'estimate', sourceId: 'unused', status: 'estimated', derivation: '計算式' }] })
      .some((i) => i.code === 'source.unreferenced')).toBe(false);
  });
});

describe('review regression: uncertainty', () => {
  it('forbids uncertainty on a missing measurement', () => {
    const dataset = withMeasurement({ status: 'missing', value: null, sourceId: null, uncertainty: { type: 'relative', plusMinusPercent: 1 } });
    expect(validateDataset(dataset).filter((i) => i.severity === 'error').map((i) => i.code)).toEqual(['measurement.uncertainty-forbidden']);
  });

  it.each<Uncertainty>([
    { type: 'absolute', plusMinus: 1, unit: 'dB' },
    { type: 'range', low: 80, high: 90, unit: 'dB' },
  ])('requires matching published uncertainty units: %j', (uncertainty) => {
    expect(validateDataset(withMeasurement({ uncertainty })).filter((i) => i.severity === 'error').map((i) => i.code))
      .toEqual(['measurement.uncertainty-unit-mismatch']);
  });
});

describe('review regression: ambiguous selection and relevant conditions', () => {
  function pair(patch: Partial<Measurement>, first: Measurement = base) {
    return validateDataset({ ...DEMO_DATASET, measurements: [first, { ...first, id: 'later', ...patch }] });
  }
  const ambiguous = (issues: QualityIssue[]) => issues.filter((i) => i.code === 'measurement.ambiguous-selection');

  it.each(['2026-11-08', null])('warns once for different values with the same capture date %s', (capturedAt) => {
    expect(ambiguous(pair({ value: 60 }, { ...base, value: 85, capturedAt })).map(identity)).toEqual([{
      code: 'measurement.ambiguous-selection', severity: 'warning', path: 'measurements[1]', relatedIds: [base.id, 'later'],
    }]);
  });

  it.each<Partial<Measurement>>([
    { value: 85 },
    { value: 60, status: 'manufacturer', sourceId: 'DEMO-MFG-001' },
    { value: 60, version: 2 },
    { value: 60, capturedAt: '2025-01-01' },
    { value: 60, conditions: { ...base.conditions, loadOhms: 4 } },
    { value: null }, { value: NaN }, { value: Infinity }, { value: 0 },
    { value: 60, sourceId: null },
    { value: null, status: 'missing', sourceId: null },
  ])('does not warn for equal values, distinct priorities, incompatible or unusable records: %j', (patch) => {
    const first = { ...base, value: 85 };
    expect(ambiguous(pair(patch, first))).toEqual([]);
    // An unusable earlier record must not trigger an ambiguity warning either.
    expect(ambiguous(pair(first, { ...first, ...patch }))).toEqual([]);
  });

  it('does not assume two unknown condition sets are compatible', () => {
    expect(ambiguous(pair({ value: 60 }, { ...base, conditions: {} }))).toEqual([]);
  });

  it('compares raw value and unit without converting', () => {
    const first: Measurement = { ...base, metric: 'thdn', unit: '%', value: 0.01 };
    expect(ambiguous(pair({ unit: 'dB', value: -80 }, first))).toHaveLength(1);
    expect(ambiguous(pair({ unit: 'dB', value: 0.01 }, first))).toHaveLength(1);
  });

  it('ignores method differences for price while detecting tied different prices', () => {
    const first: Measurement = { ...base, metric: 'price', unit: 'JPY', conditions: { method: '方法A' } };
    const issues = pair({ value: 60, conditions: { method: '方法B' } }, first);
    expect(issues.some((i) => i.code === 'measurement.conditions-not-identical-within-product')).toBe(false);
    expect(ambiguous(issues)).toHaveLength(1);
  });

  it('still reports method differences for power', () => {
    const issues = pair({ conditions: { ...base.conditions, method: '方法B' } }, { ...base, conditions: { ...base.conditions, method: '方法A' } });
    expect(issues.filter((i) => i.code === 'measurement.conditions-not-identical-within-product')).toHaveLength(1);
  });
});
