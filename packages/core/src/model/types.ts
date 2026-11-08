/**
 * Provenance data model (Phase 2, P2-1). See docs/DATA_MODEL.md.
 *
 * Principles encoded here:
 * - every figure is a `Measurement` with its own source, evidence status,
 *   unit and conditions; products never carry bare numbers;
 * - `value: null` means unknown; `status` says why; uncertainty `null` means
 *   "not stated" and is never written as 0;
 * - records are immutable inputs — derived values carry their lineage
 *   (`DerivedValue.steps`) instead of overwriting the original.
 */
import type { EvidenceStatus, FeatureKey, MeasurementConditions, MetricKey } from '../types.ts';

/**
 * Speaker metrics (schema 1.1, G1). Recorded with full provenance like any
 * measurement but **never fed to the utility score**: `MetricKey` (the four
 * scoring metrics) stays separate and `METRIC_KEYS` keeps four entries.
 */
export type SpeakerMetricId = 'sensitivity' | 'nominalImpedance' | 'minimumImpedance' | 'crossoverFrequency';
export const SPEAKER_METRIC_IDS: readonly SpeakerMetricId[] = ['sensitivity', 'nominalImpedance', 'minimumImpedance', 'crossoverFrequency'];

/** Every metric the data model can hold. Scoring uses the `MetricKey` subset only. */
export type MetricId = MetricKey | SpeakerMetricId;
export const METRIC_IDS: readonly MetricId[] = ['price', 'power', 'thdn', 'snr', ...SPEAKER_METRIC_IDS];

/** Runtime guard for a metric id read from data (own list lookup; `constructor` and friends are not metrics). */
export function isMetricId(value: unknown): value is MetricId {
  return typeof value === 'string' && METRIC_IDS.includes(value as MetricId);
}

export function isScoringMetric(metric: MetricId): metric is MetricKey {
  return metric === 'price' || metric === 'power' || metric === 'thdn' || metric === 'snr';
}

export type Unit = 'JPY' | 'W' | '%' | 'dB' | 'Ω' | 'deg' | 'Hz';

/** 1.1 (ADR-0004 rev., Phase 3): speaker metrics, Source.tier/reuse, MeasurementReference, RangeMeasurement, product attributes, structured conditions. */
export const DATASET_SCHEMA_VERSION = '1.1' as const;

/** Whether numbers from a source may be quoted / stored / redistributed. Never defaults to permitted. */
export type ReusePermission = 'allowed' | 'allowed-with-attribution' | 'permitted-by-law-or-terms' | 'unknown' | 'prohibited';

/**
 * Rights metadata of a source (G3). `quoteFacts` governs whether a numeric
 * `Measurement` may cite the source at all in a non-fictional dataset;
 * figures, raw data and redistribution are tracked separately (D-15).
 */
export interface SourceReuse {
  readonly quoteFacts: ReusePermission;
  readonly reproduceFigures: ReusePermission;
  readonly storeRawData: ReusePermission;
  readonly redistribute: ReusePermission;
  /** Terms URL, correspondence reference or legal basis; null when unchecked. */
  readonly basis: string | null;
  /** Date the permissions were checked (YYYY-MM-DD); null when unchecked. */
  readonly checkedAt: string | null;
}

export const REUSE_UNCHECKED: SourceReuse = {
  quoteFacts: 'unknown',
  reproduceFigures: 'unknown',
  storeRawData: 'unknown',
  redistribute: 'unknown',
  basis: null,
  checkedAt: null,
};

/** Permissions under which a numeric Measurement may cite a source in a non-fictional dataset. */
export const NUMBER_STORAGE_PERMITTED: readonly ReusePermission[] = ['allowed', 'allowed-with-attribution', 'permitted-by-law-or-terms'];

export type SourceKind = 'independent-lab' | 'manufacturer' | 'retailer' | 'editorial' | 'other';

export interface Source {
  readonly id: string;
  readonly publisher: string;
  readonly kind: SourceKind;
  /** Original URL; `null` when the source is offline or not yet linked. */
  readonly url: string | null;
  /** ISO date (YYYY-MM-DD) when the source published the figure, if known. */
  readonly publishedAt: string | null;
  /** ISO date when we captured it. Required: provenance without a capture date is not reproducible. */
  readonly accessedAt: string;
  readonly license: string | null;
  readonly notes: string | null;
  /** Archive or reference identifier (e.g. Wayback snapshot), if any. */
  readonly archiveRef: string | null;
  /** Primary (manufacturer, the measuring lab itself) or secondary (re-publication, summary). */
  readonly tier: 'primary' | 'secondary';
  readonly reuse: SourceReuse;
}

export type MeasurementStatus = EvidenceStatus;

/** Stated uncertainty. Absent uncertainty is represented by `null` on the measurement, never by 0. */
export type Uncertainty =
  | { readonly type: 'absolute'; readonly plusMinus: number; readonly unit: Unit }
  | { readonly type: 'relative'; readonly plusMinusPercent: number }
  | { readonly type: 'range'; readonly low: number; readonly high: number; readonly unit: Unit };

export interface Measurement {
  readonly id: string;
  readonly productId: string;
  readonly metric: MetricId;
  /** `null` when unknown; must be `null` iff `status === 'missing'`. */
  readonly value: number | null;
  /** Unit of `value` as published. Conversion to the canonical unit is a tracked transform. */
  readonly unit: Unit;
  readonly status: MeasurementStatus;
  /** Required unless `status === 'missing'`. */
  readonly sourceId: string | null;
  readonly conditions: MeasurementConditions;
  readonly uncertainty: Uncertainty | null;
  /** How an `estimated` value was derived. Required for `estimated`, forbidden otherwise. */
  readonly derivation: string | null;
  /** ISO date the figure was taken or published, if known. */
  readonly capturedAt: string | null;
  /** Record revision; bump when a figure is corrected. */
  readonly version: number;
  readonly notes: string | null;
}

export type ProductCategory = 'integrated-amplifier' | 'power-amplifier' | 'speaker' | 'other';

export interface Product {
  readonly id: string;
  readonly maker: string;
  readonly model: string;
  /** Hardware/firmware revision the measurements apply to; `null` when not applicable or unknown. */
  readonly revision: string | null;
  readonly category: ProductCategory;
  /** Display name and one-line description (UI). */
  readonly name: string;
  readonly subtitle: string;
  readonly features: readonly FeatureKey[];
  /** Market / regional variant the record describes (e.g. "JP", "EU"); null when not region-specific or unknown (G7). */
  readonly region: string | null;
  /** Manufacturer-stated dimensions in mm (W × H × D) and mass in kg; null when unknown (G7). */
  readonly dimensionsMm: { readonly w: number; readonly h: number; readonly d: number } | null;
  readonly massKg: number | null;
  readonly fictional: boolean;
}

/**
 * A figure that exists at a source but whose value is deliberately **not**
 * stored (rights unconfirmed, third-party measurement kept as location only —
 * D-16, P7, G5). Distinct from `missing`: something was measured, we point to
 * it. Never projected, never scored.
 */
export interface MeasurementReference {
  readonly id: string;
  readonly productId: string;
  readonly metric: MetricId;
  readonly sourceId: string;
  /** What the source reports, as words (e.g. "sensitivity, impedance magnitude and phase"). No numbers. */
  readonly quantities: readonly string[];
  readonly conditions: MeasurementConditions;
  readonly status: Exclude<MeasurementStatus, 'missing'>;
  readonly accessedAt: string;
  readonly notes: string | null;
}

/**
 * A manufacturer-style range specification such as "47 Hz – 45 kHz (−6 dB)",
 * kept as one record with its tolerance and conditions (D-07). Display only.
 */
export interface RangeMeasurement {
  readonly id: string;
  readonly productId: string;
  readonly metric: 'frequencyRange';
  readonly lowHz: number;
  readonly highHz: number;
  /** Tolerance the range is stated at, in dB (e.g. -6, or ±3 recorded as 3 with `toleranceKind: 'plus-minus'`). */
  readonly toleranceDb: number;
  readonly toleranceKind: 'plus-minus' | 'minus';
  readonly status: Exclude<MeasurementStatus, 'missing'>;
  readonly sourceId: string;
  readonly conditions: MeasurementConditions;
  readonly capturedAt: string | null;
  readonly version: number;
  readonly notes: string | null;
}

export interface Dataset {
  readonly schemaVersion: typeof DATASET_SCHEMA_VERSION;
  /** True when every record is demonstration data. A mixed dataset is not allowed. */
  readonly fictional: boolean;
  readonly products: readonly Product[];
  readonly sources: readonly Source[];
  readonly measurements: readonly Measurement[];
  /** Value-less pointers to figures held elsewhere (G5). Optional for backward compatibility of in-memory construction. */
  readonly references?: readonly MeasurementReference[];
  /** Range specifications (D-07). */
  readonly ranges?: readonly RangeMeasurement[];
}

/** Data-quality finding produced by `validateDataset` or a projection. */
export interface QualityIssue {
  /** Stable machine code, e.g. `measurement.value-status-mismatch`. */
  readonly code: string;
  /** `error`: the record cannot be used; `warning`: usable, but the limitation must be shown. */
  readonly severity: 'error' | 'warning';
  /** Where in the dataset, e.g. `measurements[3]` or `measurements/m-a-power`. */
  readonly path: string;
  /** Japanese explanation for the UI / report. */
  readonly message: string;
  readonly relatedIds: readonly string[];
}

/** One tracked step from an original record to a derived value. */
export interface TransformStep {
  readonly op: 'select-measurement' | 'unit-convert' | 'interpolate' | 'aggregate' | 'withhold' | 'normalize';
  readonly input: unknown;
  readonly output: unknown;
  readonly note: string;
}

/** A value together with the steps that produced it; the inputs are never modified. */
export interface DerivedValue<T> {
  readonly value: T;
  readonly steps: readonly TransformStep[];
}

/** Per-metric result of projecting a product's measurements for the scorer. */
export interface MetricProjection {
  readonly metric: MetricId;
  /** Measurement the value was taken from, or `null` when none was usable. */
  readonly measurementId: string | null;
  readonly status: MeasurementStatus;
  readonly sourceId: string | null;
  /** Canonical-unit value for the scorer; `null` = unknown. */
  readonly derived: DerivedValue<number | null>;
  readonly issues: readonly QualityIssue[];
}

export interface ProductProjection {
  readonly productId: string;
  readonly metrics: Readonly<Record<MetricId, MetricProjection>>;
  readonly issues: readonly QualityIssue[];
}
