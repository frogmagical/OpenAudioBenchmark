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

/** Metrics the model knows. Reuses the Phase 1 keys so the scorer needs no mapping. */
export type MetricId = MetricKey;

export type Unit = 'JPY' | 'W' | '%' | 'dB' | 'Ω' | 'deg';

export const DATASET_SCHEMA_VERSION = '1.0' as const;

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
  readonly fictional: boolean;
}

export interface Dataset {
  readonly schemaVersion: typeof DATASET_SCHEMA_VERSION;
  /** True when every record is demonstration data. A mixed dataset is not allowed. */
  readonly fictional: boolean;
  readonly products: readonly Product[];
  readonly sources: readonly Source[];
  readonly measurements: readonly Measurement[];
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
