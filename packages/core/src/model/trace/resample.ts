/**
 * Interpolation of a trace onto requested frequencies, as a tracked transform.
 * Linear interpolation on a log-frequency axis for both |Z| and phase, between
 * adjacent measured points only. Extrapolation is refused (null). Results are
 * `interpolated` points with `derivedFrom`, never mixed into the original.
 */
import type { DerivedValue } from '../types.ts';
import type { SpeakerElectricalTrace, TracePoint } from './types.ts';

export const RESAMPLE_METHOD = 'log-frequency linear interpolation between adjacent measured points' as const;

function lerp(x0: number, y0: number, x1: number, y1: number, x: number): number {
  const t = (Math.log10(x) - Math.log10(x0)) / (Math.log10(x1) - Math.log10(x0));
  return y0 + t * (y1 - y0);
}

/** Interpolate one frequency; `null` outside the measured range or when neighbours lack the quantity. */
export function interpolatePoint(trace: SpeakerElectricalTrace, frequencyHz: number): TracePoint | null {
  const measured = trace.points.filter((p) => p.kind === 'measured');
  if (!Number.isFinite(frequencyHz) || frequencyHz <= 0 || measured.length < 2) return null;
  const exact = measured.find((p) => p.frequencyHz === frequencyHz);
  if (exact) return { ...exact, kind: 'interpolated', derivedFrom: [exact.frequencyHz] };
  const upperIndex = measured.findIndex((p) => p.frequencyHz > frequencyHz);
  if (upperIndex <= 0) return null; // below the first or above the last measured point → no extrapolation
  const lo = measured[upperIndex - 1]!;
  const hi = measured[upperIndex]!;
  const impedanceOhms = lo.impedanceOhms !== null && hi.impedanceOhms !== null ? lerp(lo.frequencyHz, lo.impedanceOhms, hi.frequencyHz, hi.impedanceOhms, frequencyHz) : null;
  const phaseDeg = lo.phaseDeg !== null && hi.phaseDeg !== null ? lerp(lo.frequencyHz, lo.phaseDeg, hi.frequencyHz, hi.phaseDeg, frequencyHz) : null;
  if (impedanceOhms === null && phaseDeg === null) return null;
  return { frequencyHz, impedanceOhms, phaseDeg, kind: 'interpolated', derivedFrom: [lo.frequencyHz, hi.frequencyHz] };
}

/** Resample onto `frequencies` (any order); the result lists only frequencies that could be interpolated. */
export function resampleTrace(trace: SpeakerElectricalTrace, frequencies: readonly number[]): DerivedValue<readonly TracePoint[]> {
  const sorted = [...new Set(frequencies)].sort((a, b) => a - b);
  const points: TracePoint[] = [];
  const skipped: number[] = [];
  for (const f of sorted) {
    const p = interpolatePoint(trace, f);
    if (p) points.push(p);
    else skipped.push(f);
  }
  return {
    value: points,
    steps: [
      {
        op: 'select-measurement',
        input: trace.id,
        output: trace.points.filter((p) => p.kind === 'measured').map((p) => p.frequencyHz),
        note: `${trace.id} の測定点のみを補間の入力に使用`,
      },
      {
        op: 'unit-convert',
        input: sorted,
        output: points.map((p) => p.frequencyHz),
        note: `${RESAMPLE_METHOD}; 測定範囲外は外挿せず除外: ${skipped.length ? skipped.join(', ') + ' Hz' : 'なし'}`,
      },
    ],
  };
}
