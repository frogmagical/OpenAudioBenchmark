/** Declarative data-quality rules shared by validation, projection and comparability. */
import type { MeasurementConditions } from '../types.ts';
import type { MeasurementStatus, MetricId, Unit } from './types.ts';

/** Canonical unit per metric and the units a measurement may be published in. */
export const METRIC_UNITS: Readonly<Record<MetricId, { readonly canonical: Unit; readonly accepted: readonly Unit[] }>> = {
  price: { canonical: 'JPY', accepted: ['JPY'] },
  power: { canonical: 'W', accepted: ['W'] },
  thdn: { canonical: '%', accepted: ['%', 'dB'] },
  snr: { canonical: 'dB', accepted: ['dB'] },
};

/**
 * Conditions without which a figure cannot be compared with another product's
 * figure of the same metric. Unrecorded required conditions are a warning:
 * the value is still shown, but comparisons are flagged.
 */
export const REQUIRED_CONDITIONS: Readonly<Record<MetricId, readonly (keyof MeasurementConditions)[]>> = {
  price: [],
  power: ['loadOhms', 'channelsDriven', 'bandwidthHz'],
  thdn: ['loadOhms', 'outputLevel', 'bandwidthHz'],
  snr: ['weighting', 'outputLevel'],
};

/**
 * Preference order when several usable measurements exist for one metric.
 * Independent measurement beats manufacturer specification beats estimate.
 * `missing` is never selected over a real value.
 */
export const STATUS_PRIORITY: readonly MeasurementStatus[] = ['observed', 'manufacturer', 'estimated', 'missing'];

export const STATUS_LABELS: Readonly<Record<MeasurementStatus, string>> = {
  observed: '第三者測定',
  manufacturer: 'メーカー公称',
  estimated: '推定値',
  missing: '未測定',
};

export function statusRank(status: MeasurementStatus): number {
  return STATUS_PRIORITY.indexOf(status);
}
