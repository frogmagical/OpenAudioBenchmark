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
import { METRIC_BOUNDS } from './fixtures.ts';
import { COVERAGE_THRESHOLD, METHODOLOGY_VERSION } from './methodology.ts';
import { METRIC_KEYS } from './types.ts';
import type { DemoProduct, MetricKey, NormalizationBounds, UtilityResult, Weights } from './types.ts';

/**
 * Map `value` onto 0–100 using fixed reference bounds.
 *
 * - `null`, non-finite or negative values → `null` (treated as missing; never 0/100 by default).
 * - `scale: 'log10'` applies `Math.log10` first; a value ≤ 0 is invalid for a log scale → `null`.
 * - The position inside the range is clamped to [0, 1], so out-of-range values
 *   saturate at 0 or 100 instead of producing values beyond the scale.
 * - `invert: true` makes the lower bound score 100 (lower is better).
 * - Never returns NaN or ±Infinity.
 */
export function normalize(value: number | null, bounds: NormalizationBounds): number | null {
  void value;
  void bounds;
  throw new Error('not implemented');
}

/** Normalised 0–100 score of one metric of a product, or `null` when missing. Uses `METRIC_BOUNDS`. */
export function metricScore(product: DemoProduct, key: MetricKey): number | null {
  void product;
  void key;
  void METRIC_BOUNDS;
  throw new Error('not implemented');
}

/**
 * Weighted utility and coverage for a product.
 *
 * - Weights that are non-finite or negative count as 0.
 * - `totalWeight` is the sum over all `METRIC_KEYS`; `usedWeight` only over metrics with a non-null score.
 * - `coverage = totalWeight > 0 ? usedWeight / totalWeight : 0`.
 * - `score = usedWeight > 0 ? Σ(weight × metricScore) / usedWeight : null`.
 * - `status = score !== null && coverage >= COVERAGE_THRESHOLD ? 'scored' : 'pending'`
 *   (exactly 70 % coverage is `scored`; anything below is `pending`).
 */
export function calculateUtility(product: DemoProduct, weights: Weights): UtilityResult {
  void product;
  void weights;
  void COVERAGE_THRESHOLD;
  void METHODOLOGY_VERSION;
  void METRIC_KEYS;
  throw new Error('not implemented');
}

/**
 * Display percentages for the weight sliders: `Math.round(w / total × 100)` per
 * metric, or 0 for every metric when the total is 0. Negative/non-finite
 * weights count as 0, consistent with `calculateUtility`.
 */
export function weightPercentages(weights: Weights): Record<MetricKey, number> {
  void weights;
  throw new Error('not implemented');
}
