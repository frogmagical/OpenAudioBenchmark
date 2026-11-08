/** Projection, lineage and the adapter that reproduces the Phase 1 fixture from the provenance dataset. */
import { describe, expect, it } from 'vitest';
import {
  DEMO_DATASET,
  DEMO_PRODUCTS,
  METRIC_KEYS,
  calculateUtility,
  prepareDataset,
  projectMetric,
  projectProduct,
  selectMeasurement,
  sourcesForProduct,
  toCanonicalUnit,
  toDemoProduct,
  toMetricValues,
  thdnPercentToDb,
} from '../../src/index.ts';
import type { Dataset, Measurement } from '../../src/index.ts';
import { LEGACY_DEMO_PRODUCTS } from './legacy-products.ts';

const base: Measurement = DEMO_DATASET.measurements.find((m) => m.id === 'm-a-power')!;

describe('adapter reproduces the v0.4 fixture', () => {
  it('projects the six demo products to exactly the Phase 1 literal values', () => {
    expect(DEMO_PRODUCTS).toEqual(LEGACY_DEMO_PRODUCTS);
  });

  it('lists sources in first-appearance order with the legacy label format', () => {
    expect(sourcesForProduct(DEMO_DATASET, 'a').map((s) => s.id)).toEqual(['DEMO-LAB-001', 'DEMO-MFG-001']);
    expect(toDemoProduct(DEMO_DATASET, 'e').sources).toEqual(['DEMO-MFG-005: THD+N未公表（架空）']);
  });

  it('refuses to render a non-fictional dataset as demo products', () => {
    expect(() => toDemoProduct({ ...DEMO_DATASET, fictional: false }, 'a')).toThrow(/fictional/);
    expect(() => toDemoProduct(DEMO_DATASET, 'zzz')).toThrow(/Unknown product/);
  });
});

describe('measurement selection', () => {
  const mk = (over: Partial<Measurement>): Measurement => ({ ...base, ...over });

  it('prefers independent over manufacturer over estimated, never missing', () => {
    const est = mk({ id: 'est', status: 'estimated', value: 90, derivation: 'x' });
    const mfg = mk({ id: 'mfg', status: 'manufacturer', value: 88 });
    const obs = mk({ id: 'obs', status: 'observed', value: 85 });
    const miss = mk({ id: 'miss', status: 'missing', value: null, sourceId: null });
    expect(selectMeasurement([est, mfg, obs, miss])?.id).toBe('obs');
    expect(selectMeasurement([est, mfg, miss])?.id).toBe('mfg');
    expect(selectMeasurement([miss, est])?.id).toBe('est');
    expect(selectMeasurement([miss])).toBeNull();
    expect(selectMeasurement([])).toBeNull();
  });

  it('breaks ties by version, then capturedAt, then id — deterministically', () => {
    const v1 = mk({ id: 'v1', version: 1, capturedAt: '2026-01-01' });
    const v2 = mk({ id: 'v2', version: 2, capturedAt: '2025-01-01' });
    expect(selectMeasurement([v1, v2])?.id).toBe('v2');
    const older = mk({ id: 'older', capturedAt: '2025-01-01' });
    const newer = mk({ id: 'newer', capturedAt: '2026-01-01' });
    expect(selectMeasurement([older, newer])?.id).toBe('newer');
    expect(selectMeasurement([mk({ id: 'b' }), mk({ id: 'a' })])?.id).toBe('a');
  });

  it('skips a record whose value is not finite even if its status claims a value', () => {
    expect(selectMeasurement([mk({ id: 'nan', value: NaN }), mk({ id: 'ok', value: 1 })])?.id).toBe('ok');
  });
});

describe('unit conversion is a tracked step', () => {
  it('converts THD+N from dB to percent and records the formula', () => {
    const c = toCanonicalUnit('thdn', -60, 'dB')!;
    expect(c.value).toBeCloseTo(0.1, 12);
    expect(c.step).toMatchObject({ op: 'unit-convert', input: { value: -60, unit: 'dB' }, output: { unit: '%' } });
    expect(thdnPercentToDb(0.1)).toBeCloseTo(-60, 12);
    expect(thdnPercentToDb(0)).toBeNull();
  });

  it('is the identity for canonical units and null for unsupported pairs', () => {
    expect(toCanonicalUnit('power', 85, 'W')?.value).toBe(85);
    expect(toCanonicalUnit('power', 85, 'dB')).toBeNull();
    expect(toCanonicalUnit('price', 1, '%')).toBeNull();
  });
});

describe('projection lineage and issues', () => {
  it('records selection and conversion steps without touching the original measurement', () => {
    const frozen = Object.freeze({ ...base });
    const ds: Dataset = { ...DEMO_DATASET, measurements: [frozen] };
    const p = projectMetric(ds, 'a', 'power');
    expect(p.measurementId).toBe('m-a-power');
    expect(p.derived.value).toBe(85);
    expect(p.derived.steps.map((s) => s.op)).toEqual(['select-measurement', 'unit-convert']);
    expect(frozen.value).toBe(85);
  });

  it('uses a dB THD+N record and converts it for the scorer', () => {
    const db: Measurement = { ...base, id: 'm-x-thdn', metric: 'thdn', value: -80, unit: 'dB', conditions: { ...base.conditions, outputLevel: '1 W' } };
    const ds: Dataset = { ...DEMO_DATASET, measurements: [db] };
    const p = projectMetric(ds, 'a', 'thdn');
    expect(p.derived.value).toBeCloseTo(0.01, 12);
    expect(p.issues).toEqual([]);
  });

  it('reports missing as missing with a lineage note, never as 0', () => {
    const p = projectMetric(DEMO_DATASET, 'e', 'thdn');
    expect(p.status).toBe('missing');
    expect(p.derived.value).toBeNull();
    expect(p.measurementId).toBe('m-e-thdn');
    expect(p.derived.steps[0]!.note).toContain('未測定');
  });

  it('warns when required conditions are unrecorded (demo: THD+N output level, S/N weighting and level)', () => {
    const a = projectProduct(DEMO_DATASET, 'a');
    expect(a.metrics.power.issues).toEqual([]);
    expect(a.metrics.price.issues).toEqual([]);
    expect(a.metrics.thdn.issues.map((i) => i.code)).toEqual(['measurement.required-condition-unrecorded']);
    expect(a.metrics.thdn.issues[0]!.message).toContain('outputLevel');
    expect(a.metrics.snr.issues[0]!.message).toContain('weighting');
    expect(a.issues.every((i) => i.severity === 'warning')).toBe(true);
  });

  it('a record in a unit the metric does not accept is stopped by the gate before projection', () => {
    const bad: Measurement = { ...base, id: 'bad', unit: 'dB' };
    const prepared = prepareDataset({ ...DEMO_DATASET, measurements: [bad] });
    expect(prepared.errors.map((i) => i.code)).toContain('measurement.unit-not-accepted');
    expect(() => projectMetric(prepared, 'a', 'power')).toThrow(/validation error/);
  });

  it('feeds the scorer the same numbers the Phase 1 fixture carried', () => {
    for (const legacy of LEGACY_DEMO_PRODUCTS) {
      const values = toMetricValues(projectProduct(DEMO_DATASET, legacy.id));
      for (const k of METRIC_KEYS) expect(values[k]).toBe(legacy[k]);
      expect(calculateUtility(values, { price: 25, power: 25, thdn: 30, snr: 20 })).toEqual(
        calculateUtility(legacy, { price: 25, power: 25, thdn: 30, snr: 20 }),
      );
    }
  });
});
