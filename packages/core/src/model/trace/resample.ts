/**
 * Interpolation of a trace onto requested frequencies, as a tracked transform.
 * Linear interpolation on a log-frequency axis for both |Z| and phase, between
 * adjacent primary points (measured or converted) only. Extrapolation is
 * refused. Results are `interpolated` points with `derivedFrom`; the original
 * trace is never modified. Display approximation only (ADR-0006).
 */
import type { DerivedValue } from '../types.ts';
import type { SpeakerElectricalTrace, TracePoint } from './types.ts';

export const RESAMPLE_METHOD = 'log-frequency linear interpolation between adjacent primary points' as const;
export const RESAMPLE_METHOD_VERSION = '1' as const;

export type SkipReason = 'outside-range' | 'invalid-frequency' | 'missing-neighbour-values' | 'too-few-points';

export interface ResampleResult extends DerivedValue<readonly TracePoint[]> {
  readonly skipped: readonly { readonly frequencyHz: number; readonly reason: SkipReason }[];
}

function lerp(x0: number, y0: number, x1: number, y1: number, x: number): number {
  const t = (Math.log10(x) - Math.log10(x0)) / (Math.log10(x1) - Math.log10(x0));
  return y0 + t * (y1 - y0);
}

const primaryPoints = (trace: SpeakerElectricalTrace): TracePoint[] => trace.points.filter((p) => p.kind === 'measured' || p.kind === 'converted');

/** Interpolate one frequency, or explain why not. */
export function interpolatePointDetailed(trace: SpeakerElectricalTrace, frequencyHz: number): { point: TracePoint } | { reason: SkipReason } {
  const primary = primaryPoints(trace);
  if (!Number.isFinite(frequencyHz) || frequencyHz <= 0) return { reason: 'invalid-frequency' };
  if (primary.length < 2) return { reason: 'too-few-points' };
  const exact = primary.find((p) => p.frequencyHz === frequencyHz);
  if (exact) return { point: { ...exact, kind: 'interpolated', derivedFrom: [exact.frequencyHz], conversion: null } };
  const upperIndex = primary.findIndex((p) => p.frequencyHz > frequencyHz);
  if (upperIndex <= 0) return { reason: 'outside-range' };
  const lo = primary[upperIndex - 1]!;
  const hi = primary[upperIndex]!;
  const impedanceOhms = lo.impedanceOhms !== null && hi.impedanceOhms !== null ? lerp(lo.frequencyHz, lo.impedanceOhms, hi.frequencyHz, hi.impedanceOhms, frequencyHz) : null;
  const phaseDeg = lo.phaseDeg !== null && hi.phaseDeg !== null ? lerp(lo.frequencyHz, lo.phaseDeg, hi.frequencyHz, hi.phaseDeg, frequencyHz) : null;
  if (impedanceOhms === null && phaseDeg === null) return { reason: 'missing-neighbour-values' };
  return { point: { frequencyHz, impedanceOhms, phaseDeg, kind: 'interpolated', derivedFrom: [lo.frequencyHz, hi.frequencyHz], conversion: null } };
}

/** Convenience: the point or `null`. */
export function interpolatePoint(trace: SpeakerElectricalTrace, frequencyHz: number): TracePoint | null {
  const r = interpolatePointDetailed(trace, frequencyHz);
  return 'point' in r ? r.point : null;
}

/** Resample onto `frequencies` (any order, duplicates collapsed); skipped requests are listed with a reason. */
export function resampleTrace(trace: SpeakerElectricalTrace, frequencies: readonly number[]): ResampleResult {
  const sorted = [...new Set(frequencies)].sort((a, b) => a - b);
  const points: TracePoint[] = [];
  const skipped: { frequencyHz: number; reason: SkipReason }[] = [];
  for (const f of sorted) {
    const r = interpolatePointDetailed(trace, f);
    if ('point' in r) points.push(r.point);
    else skipped.push({ frequencyHz: f, reason: r.reason });
  }
  return {
    value: points,
    skipped,
    steps: [
      {
        op: 'select-measurement',
        input: { traceId: trace.id, version: trace.version },
        output: primaryPoints(trace).map((p) => p.frequencyHz),
        note: `${trace.id}（版 ${trace.version}）の測定点・換算点のみを補間の入力に使用`,
      },
      {
        op: 'interpolate',
        input: sorted,
        output: points.map((p) => p.frequencyHz),
        note: `${RESAMPLE_METHOD} (method v${RESAMPLE_METHOD_VERSION})。表示用の近似であり判定には使わない。除外: ${
          skipped.length ? skipped.map((s) => `${s.frequencyHz} Hz (${s.reason})`).join(', ') : 'なし'
        }`,
      },
    ],
  };
}
