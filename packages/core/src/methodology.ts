import type { MetricKey, NormalizationBounds } from './types.ts';

/**
 * Methodology version attached to every computed result so that outputs stay
 * traceable to the formula set that produced them.
 *
 * History (details in docs/METHODOLOGY.md):
 * - `0.4.0-demo`: formulas, bounds and thresholds of the approved v0.4
 *   prototype (`prototype/index.html`), ported without behavioural change.
 * - `0.5.0-demo` (2026-11-08, product-owner decision, ADR-0003): a reference
 *   price of 0 is invalid data and excluded from the price score; products
 *   below the coverage gate publish `score: null` in exports.
 * Bump this (and document the change in docs/METHODOLOGY.md) whenever a
 * formula, bound or threshold changes.
 */
export const METHODOLOGY_VERSION = '0.5.0-demo' as const;

/**
 * Prototype UX assumption: a utility score is only shown when at least this
 * share of the total metric weight is backed by available data.
 * This is NOT a calibrated scientific confidence level.
 */
export const COVERAGE_THRESHOLD = 0.7;

/** Headroom (dB) at or above which the output verdict is "positive". UI hypothesis, not a safety rule. */
export const HEADROOM_POSITIVE_DB = 3;
/** Headroom (dB) at or above which (but below HEADROOM_POSITIVE_DB) the verdict is "neutral". Below → "negative". */
export const HEADROOM_NEUTRAL_DB = 0;

/** Accepted listening-distance range in metres (matches the prototype input constraints). */
export const DISTANCE_RANGE_M = { min: 0.5, max: 8 } as const;
/** Accepted target peak SPL range in dB SPL (matches the prototype input constraints). */
export const PEAK_SPL_RANGE_DB = { min: 60, max: 115 } as const;

/**
 * Fixed reference ranges of the v0.4 demo (amplifiers only). These are
 * temporary illustrative bounds, not a standard.
 */
export const METRIC_BOUNDS: Readonly<Record<MetricKey, NormalizationBounds>> = {
  price: { min: 20000, max: 100000, invert: true, scale: 'linear', requirePositive: true, unit: 'JPY' },
  power: { min: 20, max: 160, invert: false, scale: 'linear', requirePositive: false, unit: 'W' },
  thdn: { min: -4, max: -1, invert: true, scale: 'log10', requirePositive: true, unit: '%' },
  snr: { min: 70, max: 120, invert: false, scale: 'linear', requirePositive: false, unit: 'dB' },
};
