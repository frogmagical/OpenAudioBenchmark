/** Measurement-condition compatibility (Phase 1 minimal version). */
import type { ConditionComparison, MeasurementConditions } from './types.ts';

/**
 * Two figures are comparable only when every condition recorded on either
 * side is recorded on both and equal (tuples compared element-wise).
 * A key that is unrecorded on one side counts as a mismatch: unknown
 * conditions must not be silently assumed identical. Keys absent on both
 * sides are ignored. `mismatches` is sorted alphabetically for stable output.
 */
export function compareConditions(a: MeasurementConditions, b: MeasurementConditions): ConditionComparison {
  const keys: readonly (keyof MeasurementConditions)[] = [
    'bandwidthHz', 'channelsDriven', 'loadOhms', 'method', 'outputLevel', 'weighting',
  ];
  const mismatches = keys.filter(key => {
    const left = a[key];
    const right = b[key];
    if (Array.isArray(left) && Array.isArray(right)) {
      return left.length !== right.length || left.some((value, index) => value !== right[index]);
    }
    return left !== right;
  });
  return { compatible: mismatches.length === 0, mismatches };
}
