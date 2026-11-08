/** Speaker electrical load traces: validation boundaries, descriptive summary, resampling lineage. */
import { describe, expect, it } from 'vitest';
import {
  DEMO_DATASET,
  MIN_MEASURED_POINTS,
  PHASE_RANGE_DEG,
  areTracesUsable,
  interpolatePoint,
  resampleTrace,
  summarizeTrace,
  validateTraces,
} from '../../../src/index.ts';
import type { Product, Source, SpeakerElectricalTrace, TracePoint } from '../../../src/index.ts';

const speaker: Product = {
  id: 'spk-demo',
  maker: 'Demo Audio（架空）',
  model: 'Demo Speaker',
  revision: 'rev-A',
  category: 'speaker',
  name: 'Demo Speaker（架空）',
  subtitle: '架空',
  features: [],
  fictional: true,
};
const lab: Source = { ...DEMO_DATASET.sources[0]!, id: 'LAB-T', kind: 'independent-lab' };
const mfg: Source = { ...DEMO_DATASET.sources[1]!, id: 'MFG-T', kind: 'manufacturer' };

const pt = (frequencyHz: number, impedanceOhms: number | null, phaseDeg: number | null, kind: TracePoint['kind'] = 'measured', derivedFrom: number[] | null = null): TracePoint => ({
  frequencyHz,
  impedanceOhms,
  phaseDeg,
  kind,
  derivedFrom,
});

/** Fictional, physically plausible shape: bass resonance peak, minimum in the midrange, inductive rise. */
const base: SpeakerElectricalTrace = {
  id: 't1',
  productId: 'spk-demo',
  revision: 'rev-A',
  sourceId: 'LAB-T',
  status: 'observed',
  method: { technique: 'constant-current sweep', driveLevel: '0.5 V', senseResistorOhms: 100, sweep: 'log, 1/24 oct' },
  conditions: { environment: 'bench', method: 'ports open, 23 °C' },
  points: [pt(20, 6.5, 20), pt(50, 24, 0), pt(100, 9, -30), pt(200, 4.2, -15), pt(1000, 5.1, 10), pt(10000, 12, 45), pt(20000, 20, 60)],
  impedanceUncertainty: { type: 'relative', plusMinusPercent: 2 },
  phaseUncertaintyDeg: 2,
  capturedAt: '2026-11-01',
  derivation: null,
  version: 1,
  notes: '架空データ',
};

const input = (traces: SpeakerElectricalTrace[], products: Product[] = [speaker], sources: Source[] = [lab, mfg]) => ({ traces, products, sources });
const errors = (t: SpeakerElectricalTrace) => validateTraces(input([t])).filter((i) => i.severity === 'error').map((i) => i.code);
const warnings = (t: SpeakerElectricalTrace) => validateTraces(input([t])).filter((i) => i.severity === 'warning').map((i) => i.code);

describe('validateTraces', () => {
  it('accepts the fictional reference trace without errors or warnings', () => {
    expect(validateTraces(input([base]))).toEqual([]);
    expect(areTracesUsable(input([base]))).toBe(true);
  });

  it.each([
    [-90, true], [90, true], [-90.01, false], [90.01, false], [NaN, false], [Infinity, false],
  ])('phase %s° within the passive range is %s', (phase, ok) => {
    const t = { ...base, points: base.points.map((p, i) => (i === 2 ? { ...p, phaseDeg: phase } : p)) };
    expect(errors(t).includes('trace.phase-out-of-range')).toBe(!ok);
    expect(PHASE_RANGE_DEG).toEqual({ min: -90, max: 90 });
  });

  it('rejects non-positive or non-finite frequencies and non-increasing order', () => {
    expect(errors({ ...base, points: [pt(0, 8, 0), ...base.points.slice(1)] })).toContain('trace.frequency-invalid');
    expect(errors({ ...base, points: [pt(-20, 8, 0), ...base.points.slice(1)] })).toContain('trace.frequency-invalid');
    expect(errors({ ...base, points: [pt(NaN, 8, 0), ...base.points.slice(1)] })).toContain('trace.frequency-invalid');
    const swapped = [...base.points];
    [swapped[1], swapped[2]] = [swapped[2]!, swapped[1]!];
    expect(errors({ ...base, points: swapped })).toEqual(['trace.frequency-not-increasing']);
    expect(errors({ ...base, points: [base.points[0]!, base.points[0]!, ...base.points.slice(1)] })).toEqual(['trace.frequency-not-increasing']);
  });

  it('rejects impossible impedance values but allows null (not measured at that frequency)', () => {
    expect(errors({ ...base, points: base.points.map((p, i) => (i === 3 ? { ...p, impedanceOhms: 0 } : p)) })).toEqual(['trace.impedance-invalid']);
    expect(errors({ ...base, points: base.points.map((p, i) => (i === 3 ? { ...p, impedanceOhms: -4 } : p)) })).toEqual(['trace.impedance-invalid']);
    expect(errors({ ...base, points: base.points.map((p, i) => (i === 3 ? { ...p, impedanceOhms: null } : p)) })).toEqual([]);
    expect(errors({ ...base, points: base.points.map((p, i) => (i === 3 ? { ...p, impedanceOhms: null, phaseDeg: null } : p)) })).toEqual(['trace.point-empty']);
  });

  it('requires at least two measured points', () => {
    expect(MIN_MEASURED_POINTS).toBe(2);
    expect(errors({ ...base, points: [pt(1000, 8, 0)] })).toEqual(['trace.too-few-points']);
    expect(errors({ ...base, points: [pt(100, 8, 0), pt(1000, 8, 0)] })).toEqual([]);
    expect(errors({ ...base, points: [pt(100, 8, 0), pt(1000, 8, 0, 'interpolated', [100])] })).toEqual(['trace.too-few-points']);
  });

  it('checks derived points reference measured frequencies and measured points carry none', () => {
    const withInterp = { ...base, points: [...base.points.slice(0, 2), pt(70, 15, -10, 'interpolated', [50, 100]), ...base.points.slice(2)] };
    expect(errors(withInterp)).toEqual([]);
    expect(errors({ ...withInterp, points: withInterp.points.map((p) => (p.kind === 'interpolated' ? { ...p, derivedFrom: [50, 75] } : p)) })).toEqual(['trace.derived-from-unknown']);
    expect(errors({ ...withInterp, points: withInterp.points.map((p) => (p.kind === 'interpolated' ? { ...p, derivedFrom: null } : p)) })).toEqual(['trace.derived-from-required']);
    expect(errors({ ...base, points: base.points.map((p, i) => (i === 0 ? { ...p, derivedFrom: [20] } : p)) })).toEqual(['trace.derived-from-forbidden']);
  });

  it('enforces provenance and uncertainty rules', () => {
    expect(errors({ ...base, productId: 'zzz' })).toEqual(['trace.unknown-product']);
    expect(validateTraces(input([{ ...base, productId: 'a' }], [...DEMO_DATASET.products, speaker])).map((i) => i.code)).toEqual(['trace.product-not-speaker']);
    expect(errors({ ...base, sourceId: 'nope' })).toEqual(['trace.unknown-source']);
    expect(errors({ ...base, sourceId: 'MFG-T' })).toEqual(['trace.status-source-kind-conflict']);
    expect(errors({ ...base, status: 'manufacturer', sourceId: 'MFG-T' })).toEqual([]);
    expect(errors({ ...base, status: 'estimated' })).toEqual(['trace.derivation-required']);
    expect(errors({ ...base, status: 'estimated', derivation: '  ' })).toEqual(['trace.derivation-required']);
    expect(errors({ ...base, derivation: 'x' })).toEqual(['trace.derivation-forbidden']);
    expect(errors({ ...base, impedanceUncertainty: { type: 'relative', plusMinusPercent: 0 } })).toEqual(['trace.uncertainty-zero']);
    expect(errors({ ...base, impedanceUncertainty: { type: 'absolute', plusMinus: -1, unit: 'W' } })).toEqual(['trace.uncertainty-invalid']);
    expect(errors({ ...base, phaseUncertaintyDeg: 0 })).toEqual(['trace.phase-uncertainty-invalid']);
    expect(errors({ ...base, version: 0 })).toEqual(['trace.version-invalid']);
    expect(errors({ ...base, capturedAt: '2026-02-30' })).toEqual(['trace.captured-at-invalid']);
    expect(errors({ ...base, method: { ...base.method, technique: ' ' } })).toEqual(['trace.technique-empty']);
    expect(errors({ ...base, id: '' })).toEqual(['trace.id-empty']);
    expect(validateTraces(input([base, base])).map((i) => i.code)).toEqual(['trace.duplicate-id']);
  });

  it('warns about unknown revision, unstated drive level, missing phase, unstated uncertainty, unrecorded conditions', () => {
    expect(warnings({ ...base, revision: null })).toEqual(['trace.revision-unknown']);
    expect(warnings({ ...base, method: { ...base.method, driveLevel: null } })).toEqual(['trace.drive-level-unstated']);
    expect(warnings({ ...base, points: base.points.map((p) => ({ ...p, phaseDeg: null })) })).toEqual(['trace.phase-missing']);
    expect(warnings({ ...base, impedanceUncertainty: null })).toEqual(['trace.uncertainty-unstated']);
    expect(warnings({ ...base, conditions: {} })).toEqual(['trace.conditions-unrecorded']);
  });

  it('does not mutate its input and is deterministic', () => {
    const frozen = Object.freeze({ ...base, points: Object.freeze(base.points.map((p) => Object.freeze({ ...p }))) }) as SpeakerElectricalTrace;
    const a = JSON.stringify(validateTraces(input([frozen, { ...frozen, id: 't2', revision: null }])));
    const b = JSON.stringify(validateTraces(input([frozen, { ...frozen, id: 't2', revision: null }])));
    expect(a).toBe(b);
  });
});

describe('summarizeTrace', () => {
  it('reports range, counts, extremes and never a verdict', () => {
    const s = summarizeTrace(base);
    expect(s.frequencyRangeHz).toEqual([20, 20000]);
    expect(s.pointCount).toBe(7);
    expect(s.measuredPointCount).toBe(7);
    expect(s.minimumImpedance).toEqual({ ohms: 4.2, frequencyHz: 200 });
    expect(s.maximumImpedance).toEqual({ ohms: 24, frequencyHz: 50 });
    expect(s.phaseExtremesDeg).toEqual({ min: -30, max: 60 });
    expect(s.note).toContain('判定保留');
    expect(JSON.stringify(s)).not.toMatch(/safe|安全です|良好/);
  });

  it('ignores interpolated points for extremes and handles missing quantities', () => {
    const t = { ...base, points: [...base.points.slice(0, 3), pt(150, 1, -80, 'interpolated', [100, 200]), ...base.points.slice(3)] };
    const s = summarizeTrace(t);
    expect(s.measuredPointCount).toBe(7);
    expect(s.minimumImpedance).toEqual({ ohms: 4.2, frequencyHz: 200 });
    const noPhase = summarizeTrace({ ...base, points: base.points.map((p) => ({ ...p, phaseDeg: null })) });
    expect(noPhase.phaseExtremesDeg).toBeNull();
    expect(summarizeTrace({ ...base, points: [pt(100, null, 10), pt(200, null, 20)] }).minimumImpedance).toBeNull();
  });
});

describe('resampleTrace', () => {
  it('interpolates linearly on a log-frequency axis between adjacent measured points', () => {
    // Between 100 Hz (9 Ω, −30°) and 200 Hz (4.2 Ω, −15°): at 141.42 Hz (log midpoint) → 6.6 Ω, −22.5°.
    const p = interpolatePoint(base, Math.sqrt(100 * 200))!;
    expect(p.kind).toBe('interpolated');
    expect(p.derivedFrom).toEqual([100, 200]);
    expect(p.impedanceOhms).toBeCloseTo(6.6, 10);
    expect(p.phaseDeg).toBeCloseTo(-22.5, 10);
  });

  it('refuses extrapolation and returns a tracked transform', () => {
    const r = resampleTrace(base, [10, 1000, 30000, 141.4213562373095]);
    expect(r.value.map((p) => p.frequencyHz)).toEqual([141.4213562373095, 1000]);
    expect(r.value[1]).toMatchObject({ impedanceOhms: 5.1, phaseDeg: 10, kind: 'interpolated', derivedFrom: [1000] });
    expect(r.steps.map((s) => s.op)).toEqual(['select-measurement', 'unit-convert']);
    expect(r.steps[1]!.note).toContain('10, 30000 Hz');
    expect(base.points.every((p) => p.kind === 'measured')).toBe(true);
  });

  it('skips quantities missing on a neighbour instead of guessing', () => {
    const t = { ...base, points: base.points.map((p, i) => (i === 3 ? { ...p, impedanceOhms: null } : p)) };
    const p = interpolatePoint(t, 150)!;
    expect(p.impedanceOhms).toBeNull();
    expect(p.phaseDeg).not.toBeNull();
    expect(interpolatePoint({ ...base, points: base.points.slice(0, 1) }, 30)).toBeNull();
  });
});
