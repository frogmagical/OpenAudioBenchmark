/** Declarative data-quality rules shared by validation, projection and comparability. */
import type { MeasurementConditions } from '../types.ts';
import type { MeasurementStatus, MetricId, ProductCategory, Unit } from './types.ts';

/** Canonical unit per metric and the units a measurement may be published in. */
export const METRIC_UNITS: Readonly<Record<MetricId, { readonly canonical: Unit; readonly accepted: readonly Unit[] }>> = {
  price: { canonical: 'JPY', accepted: ['JPY'] },
  power: { canonical: 'W', accepted: ['W'] },
  thdn: { canonical: '%', accepted: ['%', 'dB'] },
  snr: { canonical: 'dB', accepted: ['dB'] },
  sensitivity: { canonical: 'dB', accepted: ['dB'] },
  nominalImpedance: { canonical: 'Ω', accepted: ['Ω'] },
  minimumImpedance: { canonical: 'Ω', accepted: ['Ω'] },
  crossoverFrequency: { canonical: 'Hz', accepted: ['Hz'] },
};

/** Which product categories a metric may be recorded for (schema 1.1 validation rule, DATA_GAP). */
export const METRIC_CATEGORIES: Readonly<Record<MetricId, readonly ProductCategory[]>> = {
  price: ['integrated-amplifier', 'power-amplifier', 'speaker', 'other'],
  power: ['integrated-amplifier', 'power-amplifier'],
  thdn: ['integrated-amplifier', 'power-amplifier'],
  snr: ['integrated-amplifier', 'power-amplifier'],
  sensitivity: ['speaker'],
  nominalImpedance: ['speaker'],
  minimumImpedance: ['speaker'],
  crossoverFrequency: ['speaker'],
};

/**
 * Conditions without which a figure cannot be compared with another product's
 * figure of the same metric. Unrecorded required conditions are a warning:
 * the value is still shown, but comparisons are flagged.
 */
export const REQUIRED_CONDITIONS: Readonly<Record<MetricId, readonly (keyof MeasurementConditions)[]>> = {
  price: [],
  power: ['loadOhms', 'channelsDriven', 'bandwidthHz', 'distortionCriterion'],
  thdn: ['loadOhms', 'outputLevel', 'bandwidthHz'],
  snr: ['weighting', 'outputLevel'],
  sensitivity: ['sensitivityReference', 'distanceM', 'averaging', 'averagingBandHz', 'environment'],
  nominalImpedance: [],
  minimumImpedance: ['frequencyHz'],
  crossoverFrequency: [],
};

/**
 * Conditions that must be **recorded on both sides** before two figures are
 * compared, in addition to being equal (D-03: an unknown instrument withholds
 * comparisons whose result it could influence). These are comparison
 * conditions only; they are deliberately absent from `REQUIRED_CONDITIONS`
 * so they never affect scoring eligibility.
 */
export const COMPARISON_REQUIRED_CONDITIONS: Readonly<Record<MetricId, readonly (keyof MeasurementConditions)[]>> = {
  price: [],
  power: ['instrument'],
  thdn: ['instrument'],
  snr: ['instrument'],
  sensitivity: ['instrument'],
  nominalImpedance: [],
  minimumImpedance: ['instrument'],
  crossoverFrequency: [],
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
const ALL_AMP_KEYS: readonly (keyof MeasurementConditions)[] = [
  'averaging', 'averagingBandHz', 'bandwidthHz', 'channelsDriven', 'distortionCriterion', 'environment', 'frequencyHz',
  'inputSignal', 'instrument', 'loadOhms', 'loadType', 'method', 'outputLevel', 'testSignal', 'weighting',
];
const ALL_SPEAKER_KEYS: readonly (keyof MeasurementConditions)[] = [
  'averaging', 'averagingBandHz', 'distanceM', 'environment', 'frequencyHz', 'inputSignal', 'instrument', 'method',
  'sensitivityReference', 'testSignal',
];

export const RELEVANT_CONDITIONS: Readonly<Record<MetricId, readonly (keyof MeasurementConditions)[]>> = {
  price: [],
  power: ALL_AMP_KEYS,
  thdn: ALL_AMP_KEYS,
  snr: ALL_AMP_KEYS,
  sensitivity: ALL_SPEAKER_KEYS,
  nominalImpedance: [],
  minimumImpedance: ['environment', 'frequencyHz', 'instrument', 'method', 'testSignal'],
  crossoverFrequency: [],
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
  sensitivity: {},
  nominalImpedance: { 'Ω': { min: 0, exclusiveMin: true } },
  minimumImpedance: { 'Ω': { min: 0, exclusiveMin: true } },
  crossoverFrequency: { Hz: { min: 0, exclusiveMin: true } },
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
  instrument: '測定機器',
  testSignal: '試験信号',
  averaging: '平均方法',
  averagingBandHz: '平均帯域',
  distortionCriterion: '歪み基準',
  sensitivityReference: '感度基準',
  distanceM: '測定距離',
};

/** Human-readable condition value for explanations (`未記録` when undefined). */
export function formatConditionValue(key: keyof MeasurementConditions, conditions: MeasurementConditions): string {
  const v = conditions[key];
  if (v === undefined) return '未記録';
  if (Array.isArray(v)) return v[0] === v[1] ? `${v[0]} Hz` : `${v[0]}–${v[1]} Hz`;
  if (key === 'loadOhms') return `${v} Ω`;
  if (key === 'frequencyHz') return `${v} Hz`;
  if (key === 'distanceM') return `${v} m`;
  return String(v);
}
