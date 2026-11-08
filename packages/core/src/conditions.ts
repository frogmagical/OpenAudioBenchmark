/** Measurement-condition compatibility (Phase 1 minimal version). */
import type { ConditionComparison, MeasurementConditions } from './types.ts';

export const CONDITION_KEYS: readonly (keyof MeasurementConditions)[] = [
  'bandwidthHz',
  'channelsDriven',
  'environment',
  'frequencyHz',
  'inputSignal',
  'loadOhms',
  'loadType',
  'method',
  'outputLevel',
  'weighting',
  'instrument',
  'testSignal',
  'averaging',
  'averagingBandHz',
  'distortionCriterion',
  'sensitivityReference',
  'distanceM',
];

function equalValues(left: unknown, right: unknown): boolean {
  if (Array.isArray(left) && Array.isArray(right)) {
    return left.length === right.length && left.every((value, index) => value === right[index]);
  }
  return left === right;
}

/**
 * Two figures are comparable only when every condition recorded on either
 * side is recorded on both and equal (tuples compared element-wise).
 * A key that is unrecorded on one side counts as a mismatch. When nothing is
 * recorded on either side the result is `undetermined`, not compatible:
 * unknown conditions must never be silently assumed identical.
 * Keys are reported in alphabetical order for stable output. `keys` restricts
 * the comparison to the conditions relevant for a metric (default: all keys).
 */
export function compareConditions(
  a: MeasurementConditions,
  b: MeasurementConditions,
  keys: readonly (keyof MeasurementConditions)[] = CONDITION_KEYS,
): ConditionComparison {
  const mismatches: (keyof MeasurementConditions)[] = [];
  const shared: (keyof MeasurementConditions)[] = [];
  for (const key of [...keys].sort()) {
    const left = a[key];
    const right = b[key];
    if (left === undefined && right === undefined) continue;
    if (equalValues(left, right)) shared.push(key);
    else mismatches.push(key);
  }
  const status = mismatches.length > 0 ? 'incompatible' : shared.length > 0 ? 'compatible' : 'undetermined';
  return { status, compatible: status === 'compatible', mismatches, shared };
}
