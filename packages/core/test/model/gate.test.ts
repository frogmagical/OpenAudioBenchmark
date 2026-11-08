/** Quality gate, honest evidence summary, absent-vs-missing comparability, lineage through normalisation, unit boundaries. */
import { describe, expect, it } from 'vitest';
import {
  DEMO_DATASET,
  PREPARED_DEMO_DATASET,
  WEIGHT_PRESETS,
  assertUsable,
  buildCatalogJson,
  evaluateProduct,
  explainMetricComparability,
  prepareDataset,
  projectProduct,
  summarizeEvidence,
  thdnPercentToDb,
  toCanonicalUnit,
  toDemoProduct,
} from '../../src/index.ts';
import type { Dataset, Measurement } from '../../src/index.ts';

const edit = (fn: (m: Measurement) => Measurement): Dataset => ({ ...DEMO_DATASET, measurements: DEMO_DATASET.measurements.map(fn) });

describe('prepareDataset / assertUsable', () => {
  it('passes the demo dataset with warnings only and indexes issues by id', () => {
    expect(PREPARED_DEMO_DATASET.usable).toBe(true);
    expect(PREPARED_DEMO_DATASET.errors).toEqual([]);
    expect(PREPARED_DEMO_DATASET.warnings.length).toBeGreaterThan(0);
    expect(PREPARED_DEMO_DATASET.issuesById.get('m-a-thdn')?.map((i) => i.code)).toEqual(['measurement.required-condition-unrecorded']);
  });

  it('blocks projection, adapter and evaluation when the dataset has an error', () => {
    const broken = edit((m) => (m.id === 'm-a-power' ? { ...m, sourceId: null } : m));
    const prepared = prepareDataset(broken);
    expect(prepared.usable).toBe(false);
    expect(prepared.errors.map((e) => e.code)).toEqual(['measurement.source-required']);
    expect(() => assertUsable(broken)).toThrow(/measurement.source-required/);
    expect(() => projectProduct(broken, 'a')).toThrow(/validation error/);
    expect(() => toDemoProduct(broken, 'a')).toThrow(/validation error/);
    expect(() => evaluateProduct(broken, 'a', WEIGHT_PRESETS.balanced)).toThrow(/validation error/);
  });

  it('carries validation warnings about the selected record into the projection', () => {
    const p = projectProduct(PREPARED_DEMO_DATASET, 'a');
    expect(p.metrics.snr.issues.map((i) => i.code)).toEqual(['measurement.required-condition-unrecorded']);
    expect(p.metrics.snr.issues[0]!.message).toContain('weighting');
  });
});

describe('summarizeEvidence', () => {
  it('never invents manufacturer evidence', () => {
    const estimated = edit((m) => (m.productId === 'c' ? { ...m, status: 'estimated', derivation: 'demo', sourceId: 'DEMO-MFG-003' } : m));
    expect(summarizeEvidence(projectProduct(estimated, 'c'))).toBe('estimated');
    expect(toDemoProduct(estimated, 'c').verified).toBe(false);
    const none = edit((m) => (m.productId === 'c' ? { ...m, status: 'missing', value: null, sourceId: null } : m));
    expect(summarizeEvidence(projectProduct(none, 'c'))).toBe('missing');
    expect(summarizeEvidence(projectProduct(PREPARED_DEMO_DATASET, 'a'))).toBe('observed');
    expect(summarizeEvidence(projectProduct(PREPARED_DEMO_DATASET, 'c'))).toBe('manufacturer');
  });
});

describe('explainMetricComparability', () => {
  const full = { ...DEMO_DATASET.measurements[0]!.conditions, outputLevel: '1 W', weighting: 'A' as const };
  const conditioned = (fn: (m: Measurement) => Measurement = (m) => m) =>
    edit((m) => fn({ ...m, conditions: full, uncertainty: m.value === null ? null : { type: 'relative', plusMinusPercent: 1 } }));

  it('is comparable for fully conditioned demo power figures', () => {
    expect(explainMetricComparability(conditioned(), 'a', 'b', 'power')).toEqual({ level: 'comparable', reasons: [] });
  });

  it('treats an absent record like an explicit missing one', () => {
    const base = conditioned();
    const absent: Dataset = { ...base, measurements: base.measurements.filter((m) => m.id !== 'm-b-thdn') };
    const missing = conditioned((m) => (m.id === 'm-b-thdn' ? { ...m, value: null, status: 'missing', sourceId: null, uncertainty: null } : m));
    const a = explainMetricComparability(absent, 'a', 'b', 'thdn');
    const b = explainMetricComparability(missing, 'a', 'b', 'thdn');
    expect(a.level).toBe('not-comparable');
    expect(a.reasons.map((r) => r.code)).toEqual(['value.missing']);
    expect(b.level).toBe('not-comparable');
    expect(b.reasons.map((r) => r.code)).toContain('value.missing');
    expect(a.reasons[0]!.details).toEqual(['b']);
  });
});

describe('evaluateProduct lineage', () => {
  it('appends a normalize step after selection and conversion, with the bounds in the note', () => {
    const ev = evaluateProduct(PREPARED_DEMO_DATASET, 'a', WEIGHT_PRESETS.balanced);
    expect(ev.lineage.power.steps.map((s) => s.op)).toEqual(['select-measurement', 'unit-convert', 'normalize']);
    const norm = ev.lineage.power.steps.at(-1)!;
    expect(norm.input).toEqual({ value: 85, unit: 'W' });
    expect(norm.output).toBeCloseTo((65 / 140) * 100, 10);
    expect(norm.note).toContain('20〜160');
    expect(ev.lineage.thdn.steps.at(-1)!.note).toContain('log10');
    expect(ev.utility.methodologyVersion).toBe('0.5.0-demo');
  });

  it('records a null normalisation for missing metrics', () => {
    const ev = evaluateProduct(PREPARED_DEMO_DATASET, 'e', WEIGHT_PRESETS.balanced);
    expect(ev.lineage.thdn.value).toBeNull();
    expect(ev.lineage.thdn.steps.map((s) => s.op)).toEqual(['select-measurement', 'normalize']);
    expect(ev.lineage.thdn.steps.at(-1)!.output).toBeNull();
  });

  it('publishes the chain in the JSON export when a dataset is supplied', () => {
    const product = toDemoProduct(PREPARED_DEMO_DATASET, 'a');
    const parsed = JSON.parse(buildCatalogJson([product], WEIGHT_PRESETS.balanced, { date: '2026-11-08', dataset: PREPARED_DEMO_DATASET }));
    expect(parsed.version).toBe('0.4.0');
    expect(parsed.datasetSchemaVersion).toBe('1.0');
    const power = parsed.products[0].provenance.power;
    expect(power.measurementId).toBe('m-a-power');
    expect(power.original).toMatchObject({ value: 85, unit: 'W' });
    expect(power.steps.map((s: { op: string }) => s.op)).toEqual(['select-measurement', 'unit-convert', 'normalize']);
    const snr = parsed.products[0].provenance.snr;
    expect(snr.issues.map((i: { code: string }) => i.code)).toEqual(['measurement.required-condition-unrecorded']);
    const without = JSON.parse(buildCatalogJson([product], WEIGHT_PRESETS.balanced, { date: '2026-11-08' }));
    expect(without.products[0].provenance).toBeUndefined();
    expect(without.datasetSchemaVersion).toBeNull();
  });
});

describe('unit conversion boundaries', () => {
  it('returns null instead of NaN, Infinity or an underflowed zero', () => {
    expect(toCanonicalUnit('power', NaN, 'W')).toBeNull();
    expect(toCanonicalUnit('power', Infinity, 'W')).toBeNull();
    expect(toCanonicalUnit('thdn', -10000, 'dB')).toBeNull();
    expect(toCanonicalUnit('thdn', 10000, 'dB')).toBeNull();
    expect(thdnPercentToDb(Number.MIN_VALUE)).not.toBe(-Infinity);
    expect(thdnPercentToDb(5e-324)).toBeNull();
    expect(thdnPercentToDb(1)).toBeCloseTo(-40, 10);
  });
});
