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

/**
 * Condition keys that matter for comparing two figures of a metric. A mismatch
 * on any other key is ignored for that metric. Price has no measurement
 * conditions at all; the amplifier metrics are sensitive to every recorded key.
 */
export const RELEVANT_CONDITIONS: Readonly<Record<MetricId, readonly (keyof MeasurementConditions)[]>> = {
  price: [],
  power: ['bandwidthHz', 'channelsDriven', 'environment', 'frequencyHz', 'inputSignal', 'loadOhms', 'loadType', 'method', 'outputLevel', 'weighting'],
  thdn: ['bandwidthHz', 'channelsDriven', 'environment', 'frequencyHz', 'inputSignal', 'loadOhms', 'loadType', 'method', 'outputLevel', 'weighting'],
  snr: ['bandwidthHz', 'channelsDriven', 'environment', 'frequencyHz', 'inputSignal', 'loadOhms', 'loadType', 'method', 'outputLevel', 'weighting'],
};

/** Required condition keys that are unrecorded on a measurement-like record. */
export function unrecordedRequiredConditions(
  metric: MetricId,
  conditions: MeasurementConditions,
): (keyof MeasurementConditions)[] {
  return REQUIRED_CONDITIONS[metric].filter((key) => conditions[key] === undefined);
}

/** Shared Japanese message for unrecorded required conditions (validation, projection, comparability). */
export function unrecordedConditionsMessage(metric: MetricId, keys: readonly (keyof MeasurementConditions)[]): string {
  return `${metric} の比較に必要な測定条件が未記録です: ${keys.map((k) => `${CONDITION_LABELS[k]} (${k})`).join(', ')}`;
}

/**
 * Physical domain of a published value, per metric and unit. `null` → no
 * constraint beyond finiteness. Price 0 is invalid (methodology 0.5.0-demo).
 */
export const VALUE_DOMAIN: Readonly<Record<MetricId, Partial<Record<Unit, { readonly min: number; readonly exclusiveMin: boolean }>>>> = {
  price: { JPY: { min: 0, exclusiveMin: true } },
  power: { W: { min: 0, exclusiveMin: true } },
  thdn: { '%': { min: 0, exclusiveMin: true } },
  snr: {},
};

/** True when `value` is finite and inside the domain for `metric`/`unit`. */
export function isValueInDomain(metric: MetricId, unit: Unit, value: number): boolean {
  if (!Number.isFinite(value)) return false;
  const domain = VALUE_DOMAIN[metric][unit];
  if (!domain) return true;
  return domain.exclusiveMin ? value > domain.min : value >= domain.min;
}

/** Japanese label for a condition key, used in explanations. */
export const CONDITION_LABELS: Readonly<Record<keyof MeasurementConditions, string>> = {
  frequencyHz: '測定周波数',
  bandwidthHz: '測定帯域',
  loadOhms: '負荷インピーダンス',
  loadType: '負荷の種類',
  channelsDriven: '駆動チャンネル数',
  inputSignal: '入力信号',
  outputLevel: '出力レベル',
  weighting: '重み付け',
  environment: '測定環境',
  method: '測定方法',
};

/** Human-readable condition value for explanations (`未記録` when undefined). */
export function formatConditionValue(key: keyof MeasurementConditions, conditions: MeasurementConditions): string {
  const v = conditions[key];
  if (v === undefined) return '未記録';
  if (Array.isArray(v)) return `${v[0]}–${v[1]} Hz`;
  if (key === 'loadOhms') return `${v} Ω`;
  if (key === 'frequencyHz') return `${v} Hz`;
  return String(v);
}
