/** Unit conversions as tracked transform steps. Originals are never modified. */
import { METRIC_UNITS } from './rules.ts';
import { isMetricId } from './types.ts';
import type { MetricId, TransformStep, Unit } from './types.ts';

export interface Conversion {
  readonly value: number;
  readonly step: TransformStep;
}

/**
 * Convert `value` from `from` to the metric's canonical unit.
 * Supported: identity for every metric; THD+N `dB` → `%` via `100 · 10^(dB/20)`
 * (distortion ratios are amplitude ratios). Returns `null` for a non-finite
 * input, an unsupported pair, an unknown metric, or a non-finite / underflowed result instead of guessing.
 */
export function toCanonicalUnit(metric: MetricId, value: number, from: Unit): Conversion | null {
  if (!isMetricId(metric)) return null;
  const { canonical } = METRIC_UNITS[metric];
  if (!Number.isFinite(value)) return null;
  if (from === canonical) {
    return {
      value,
      step: { op: 'unit-convert', input: { value, unit: from }, output: { value, unit: canonical }, note: '単位変換なし（正規単位で記録）' },
    };
  }
  if (metric === 'thdn' && from === 'dB' && canonical === '%') {
    const percent = 100 * 10 ** (value / 20);
    // Underflow to 0 would later read as "invalid THD+N"; report it as unconvertible instead.
    if (!Number.isFinite(percent) || percent <= 0) return null;
    return {
      value: percent,
      step: {
        op: 'unit-convert',
        input: { value, unit: from },
        output: { value: percent, unit: canonical },
        note: 'THD+N: % = 100 · 10^(dB / 20)（振幅比）',
      },
    };
  }
  return null;
}

/** Inverse of the THD+N conversion, for display. `null` for non-positive input. */
export function thdnPercentToDb(percent: number): number | null {
  if (!Number.isFinite(percent) || percent <= 0) return null;
  const db = 20 * Math.log10(percent / 100);
  return Number.isFinite(db) ? db : null;
}
