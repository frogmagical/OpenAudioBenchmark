/**
 * Weighted utility score and data coverage of the v0.4 demo.
 *
 *   Score    = Σ(weight_i × normalized_i, available i) / Σ(weight_i, available i)
 *   Coverage = Σ(weight_i, available i) / Σ(weight_i, all i)
 *
 * Missing metrics are excluded from the denominator and surfaced through
 * `coverage`; they are never scored as 0 or 100. The result is a
 * user-weighted decision aid, not an objective audio-quality metric.
 */
import { COVERAGE_THRESHOLD, METHODOLOGY_VERSION, METRIC_BOUNDS } from './methodology.ts';
import { METRIC_KEYS } from './types.ts';
import type { MetricKey, MetricValues, NormalizationBounds, UtilityResult, Weights } from './types.ts';

/**
 * Map `value` onto 0–100 using fixed reference bounds.
 *
 * - `null`, non-finite or negative values → `null` (treated as missing; never 0/100 by default).
 * - `scale: 'log10'` applies `Math.log10` first; a value ≤ 0 is invalid for a log scale → `null`.
 * - `requirePositive: true` also maps 0 to `null` (methodology 0.5.0-demo: price 0 is not a price).
 * - The position inside the range is clamped to [0, 1], so out-of-range values
 *   saturate at 0 or 100 instead of producing values beyond the scale.
 * - `invert: true` makes the lower bound score 100 (lower is better).
 * - Never returns NaN or ±Infinity.
 */
export function normalize(value: number | null, bounds: NormalizationBounds): number | null {
  if (value === null || !Number.isFinite(value) || value < 0) return null;
  if (!Number.isFinite(bounds.min) || !Number.isFinite(bounds.max) || bounds.max <= bounds.min) return null;
  if ((bounds.scale === 'log10' || bounds.requirePositive) && value <= 0) return null;
  const scaled = bounds.scale === 'log10' ? Math.log10(value) : value;
  const position = Math.max(0, Math.min(1, (scaled - bounds.min) / (bounds.max - bounds.min)));
  const score = 100 * (bounds.invert ? 1 - position : position);
  return Number.isFinite(score) ? score : null;
}

/** Normalised 0–100 score of one metric, or `null` when missing. Uses `METRIC_BOUNDS`. */
export function metricScore(values: MetricValues, key: MetricKey): number | null {
  return normalize(values[key], METRIC_BOUNDS[key]);
}

/**
 * Weighted utility and coverage for one set of metric values (a product's
 * projected measurements). The calculation knows nothing about provenance;
 * selection, unit conversion and lineage happen in `model/project.ts`.
 *
 * - Weights that are non-finite or negative count as 0.
 * - `totalWeight` is the sum over all `METRIC_KEYS`; `usedWeight` only over metrics with a non-null score.
 * - `coverage = totalWeight > 0 ? usedWeight / totalWeight : 0`.
 * - `score = usedWeight > 0 ? Σ(weight × metricScore) / usedWeight : null`.
 * - `status = score !== null && coverage >= COVERAGE_THRESHOLD ? 'scored' : 'pending'`
 *   (exactly 70 % coverage is `scored`; anything below is `pending`).
 */
export function calculateUtility(values: MetricValues, weights: Weights): UtilityResult {
  const metricScores: Record<MetricKey, number | null> = { price: null, power: null, thdn: null, snr: null };
  let totalWeight = 0;
  let usedWeight = 0;
  let weightedSum = 0;
  for (const key of METRIC_KEYS) {
    const weight = validWeight(weights[key]);
    const normalized = metricScore(values, key);
    metricScores[key] = normalized;
    totalWeight += weight;
    if (normalized !== null) {
      usedWeight += weight;
      weightedSum += weight * normalized;
    }
  }
  const coverage = totalWeight > 0 ? usedWeight / totalWeight : 0;
  const score = usedWeight > 0 ? weightedSum / usedWeight : null;
  return {
    score, coverage, metricScores, usedWeight, totalWeight,
    status: score !== null && coverage >= COVERAGE_THRESHOLD ? 'scored' : 'pending',
    methodologyVersion: METHODOLOGY_VERSION,
  };
}

/**
 * Display percentages for the weight sliders: `Math.round(w / total × 100)` per
 * metric, or 0 for every metric when the total is 0. Negative/non-finite
 * weights count as 0, consistent with `calculateUtility`.
 */
export function weightPercentages(weights: Weights): Record<MetricKey, number> {
  const total = METRIC_KEYS.reduce((sum, key) => sum + validWeight(weights[key]), 0);
  const percentages: Record<MetricKey, number> = { price: 0, power: 0, thdn: 0, snr: 0 };
  for (const key of METRIC_KEYS) {
    percentages[key] = total > 0 ? Math.round(validWeight(weights[key]) / total * 100) : 0;
  }
  return percentages;
}

function validWeight(weight: number): number {
  return Number.isFinite(weight) && weight >= 0 ? weight : 0;
}
