/**
 * Projection: from immutable measurements to the `MetricValues` the scorer
 * consumes, with full lineage. This is the only bridge between the data
 * model and the evaluation; `scoring.ts` never sees a `Measurement`.
 */
import { METRIC_KEYS } from '../types.ts';
import type { MetricValues } from '../types.ts';
import { assertUsable } from './prepare.ts';
import type { PreparedDataset } from './prepare.ts';
import { statusRank, unrecordedConditionsMessage, unrecordedRequiredConditions } from './rules.ts';
import type {
  Dataset,
  DerivedValue,
  Measurement,
  MetricId,
  MetricProjection,
  ProductProjection,
  QualityIssue,
  TransformStep,
} from './types.ts';
import { toCanonicalUnit } from './units.ts';

/**
 * Usable = has a finite value, is not `missing`, and carries no validation
 * error. Projection requires a dataset that passed the gate (`assertUsable`),
 * so the error check only matters for callers that bypass it deliberately.
 */
function isUsable(m: Measurement, prepared: PreparedDataset): boolean {
  if (m.status === 'missing' || m.value === null || !Number.isFinite(m.value)) return false;
  return !(prepared.issuesById.get(m.id) ?? []).some((i) => i.severity === 'error');
}

/**
 * Pick the measurement to use for one metric: best evidence status first
 * (observed > manufacturer > estimated), then the highest `version`, then the
 * most recent `capturedAt`, then id for determinism. `null` when none is usable.
 */
export function selectMeasurement(candidates: readonly Measurement[], prepared?: PreparedDataset): Measurement | null {
  const usable = prepared ? candidates.filter((m) => isUsable(m, prepared)) : candidates.filter((m) => m.status !== 'missing' && m.value !== null && Number.isFinite(m.value));
  if (usable.length === 0) return null;
  return [...usable].sort(
    (a, b) =>
      statusRank(a.status) - statusRank(b.status) ||
      b.version - a.version ||
      (b.capturedAt ?? '').localeCompare(a.capturedAt ?? '') ||
      a.id.localeCompare(b.id),
  )[0]!;
}

/**
 * Project one metric. The dataset must pass the quality gate; validation
 * warnings attached to the selected measurement are carried into `issues`
 * so that every view shows them ("warnings must be displayed").
 */
export function projectMetric(input: Dataset | PreparedDataset, productId: string, metric: MetricId): MetricProjection {
  const prepared = assertUsable(input);
  const dataset = prepared.dataset;
  const candidates = dataset.measurements.filter((m) => m.productId === productId && m.metric === metric);
  const selected = selectMeasurement(candidates, prepared);
  const steps: TransformStep[] = [];
  const issues: QualityIssue[] = [];

  if (!selected) {
    const declaredMissing = candidates.find((m) => m.status === 'missing');
    steps.push({
      op: 'select-measurement',
      input: candidates.map((m) => m.id),
      output: null,
      note: declaredMissing ? `${metric}: 未測定として記録（${declaredMissing.id}）` : `${metric}: 測定レコードなし`,
    });
    return {
      metric,
      measurementId: declaredMissing?.id ?? null,
      status: 'missing',
      sourceId: null,
      derived: { value: null, steps },
      issues,
    };
  }

  steps.push({
    op: 'select-measurement',
    input: candidates.map((m) => `${m.id}:${m.status}`),
    output: selected.id,
    note: `${metric}: 証拠種別の優先順位（第三者測定 > メーカー公称 > 推定）で ${selected.id} を採用`,
  });

  // Validation warnings about the selected record (e.g. required conditions unrecorded,
  // ambiguous selection) travel with the projection. Fall back to the local check when
  // the caller bypassed validation.
  const related = (prepared.issuesById.get(selected.id) ?? []).filter((i) => i.severity === 'warning');
  if (related.length > 0) {
    issues.push(...related);
  } else {
    const unrecorded = unrecordedRequiredConditions(selected.metric, selected.conditions);
    if (unrecorded.length > 0) {
      issues.push({
        code: 'measurement.required-condition-unrecorded',
        severity: 'warning',
        path: `measurements/${selected.id}`,
        message: unrecordedConditionsMessage(metric, unrecorded),
        relatedIds: [selected.id],
      });
    }
  }

  const conversion = toCanonicalUnit(metric, selected.value as number, selected.unit);
  if (!conversion) {
    steps.push({
      op: 'withhold',
      input: { value: selected.value, unit: selected.unit },
      output: null,
      note: `${metric}: 単位 ${selected.unit} から正規単位へ変換できないため評価から除外`,
    });
    issues.push({
      code: 'measurement.unit-not-convertible',
      severity: 'error',
      path: `measurements/${selected.id}`,
      message: `${metric} の単位 ${selected.unit} は正規単位へ変換できません`,
      relatedIds: [selected.id],
    });
    return { metric, measurementId: selected.id, status: selected.status, sourceId: selected.sourceId, derived: { value: null, steps }, issues };
  }
  steps.push(conversion.step);

  const derived: DerivedValue<number | null> = { value: conversion.value, steps };
  return { metric, measurementId: selected.id, status: selected.status, sourceId: selected.sourceId, derived, issues };
}

export function projectProduct(input: Dataset | PreparedDataset, productId: string): ProductProjection {
  const prepared = assertUsable(input);
  const metrics = Object.fromEntries(METRIC_KEYS.map((k) => [k, projectMetric(prepared, productId, k)])) as Record<
    MetricId,
    MetricProjection
  >;
  const productIssues = (prepared.issuesById.get(productId) ?? []).filter((i) => i.severity === 'warning');
  return { productId, metrics, issues: [...productIssues, ...METRIC_KEYS.flatMap((k) => metrics[k].issues)] };
}

/** The scorer's input, straight from a projection. */
export function toMetricValues(projection: ProductProjection): MetricValues {
  return Object.fromEntries(METRIC_KEYS.map((k) => [k, projection.metrics[k].derived.value])) as Record<MetricId, number | null>;
}
