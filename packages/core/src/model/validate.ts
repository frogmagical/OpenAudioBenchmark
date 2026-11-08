/**
 * Dataset validation (ingestion gate). Pure: returns issues, never mutates.
 * Implemented by the core worker against this contract.
 */
import { compareConditions } from '../conditions.ts';
import { METRIC_UNITS, REQUIRED_CONDITIONS } from './rules.ts';
import { DATASET_SCHEMA_VERSION } from './types.ts';
import type { Dataset, Measurement, QualityIssue } from './types.ts';

function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function hasInvalidUncertainty({ uncertainty }: Measurement): boolean {
  if (uncertainty === null) return false;
  switch (uncertainty.type) {
    case 'absolute': return !Number.isFinite(uncertainty.plusMinus) || uncertainty.plusMinus < 0;
    case 'relative': return !Number.isFinite(uncertainty.plusMinusPercent) || uncertainty.plusMinusPercent < 0;
    case 'range': return !Number.isFinite(uncertainty.low) || !Number.isFinite(uncertainty.high) || uncertainty.low > uncertainty.high;
  }
}

function hasZeroUncertainty({ uncertainty }: Measurement): boolean {
  if (uncertainty === null) return false;
  switch (uncertainty.type) {
    case 'absolute': return uncertainty.plusMinus === 0;
    case 'relative': return uncertainty.plusMinusPercent === 0;
    case 'range': return uncertainty.low === uncertainty.high;
  }
}

/**
 * Validate a dataset and return every issue found (empty array = clean).
 * Paths use `products[i]`, `sources[i]`, `measurements[i]`; `relatedIds` lists the ids involved.
 *
 * Errors (`severity: 'error'`):
 * - `dataset.schema-version`: `schemaVersion !== DATASET_SCHEMA_VERSION`.
 * - `dataset.fictional-mismatch`: `dataset.fictional` differs from any `product.fictional`.
 * - `product.duplicate-id`, `source.duplicate-id`, `measurement.duplicate-id`.
 * - `measurement.unknown-product` / `measurement.unknown-source`: dangling reference.
 * - `measurement.value-status-mismatch`: `status === 'missing'` with a non-null value, or a
 *   non-missing status with `value === null`.
 * - `measurement.value-not-finite`: value is NaN or ±Infinity.
 * - `measurement.source-required`: non-missing status with `sourceId === null`.
 * - `measurement.source-forbidden`: `status === 'missing'` with a `sourceId` (nothing was measured, so nothing is cited).
 * - `measurement.unit-not-accepted`: `unit` not in `METRIC_UNITS[metric].accepted`.
 * - `measurement.derivation-required`: `status === 'estimated'` with `derivation` null or blank (whitespace only).
 * - `measurement.derivation-forbidden`: `derivation !== null` on a non-estimated status.
 * - `measurement.uncertainty-zero`: any uncertainty whose magnitude is 0 (or range with low === high)
 *   — unknown uncertainty must be `null`, never 0.
 * - `measurement.uncertainty-invalid`: negative or non-finite magnitude, non-finite range bounds, or `low > high`.
 * - `measurement.version-invalid`: `version` is not a positive integer.
 * - `source.accessed-at-invalid`: `accessedAt` is not `YYYY-MM-DD`.
 * - `measurement.status-source-kind-conflict`: `status === 'observed'` whose source is `kind: 'manufacturer'`,
 *   or `status === 'manufacturer'` whose source is `kind: 'independent-lab'`.
 *
 * Warnings (`severity: 'warning'`):
 * - `measurement.required-condition-unrecorded`: a required condition (`REQUIRED_CONDITIONS[metric]`)
 *   is `undefined` on a non-missing measurement; message lists the keys.
 * - `measurement.conditions-not-identical-within-product`: two non-missing measurements of the
 *   same product and metric have incompatible conditions (`compareConditions`), which makes the
 *   selection order matter.
 * - `source.url-missing`: `url === null` on a source that is referenced by an `observed` or
 *   `manufacturer` measurement.
 * - `product.no-measurements`: a product with no measurement records at all.
 *
 * Issues are returned in dataset order (products, then sources, then measurements), stable.
 */
export function validateDataset(dataset: Dataset): QualityIssue[] {
  const issues: QualityIssue[] = [];
  const add = (code: string, severity: QualityIssue['severity'], path: string, message: string, relatedIds: string[]) => {
    issues.push({ code, severity, path, message, relatedIds });
  };
  const productIds = new Set(dataset.products.map((product) => product.id));
  const sources = new Map(dataset.sources.map((source) => [source.id, source]));
  const measuredProducts = new Set(dataset.measurements.map((measurement) => measurement.productId));
  const citedSources = new Set(dataset.measurements
    .filter((measurement) => measurement.status === 'observed' || measurement.status === 'manufacturer')
    .map((measurement) => measurement.sourceId));

  if (dataset.schemaVersion !== DATASET_SCHEMA_VERSION) {
    add('dataset.schema-version', 'error', 'schemaVersion', 'データセットのスキーマ版が対応する版と一致しません', []);
  }

  const seenProducts = new Set<string>();
  dataset.products.forEach((product, index) => {
    const path = `products[${index}]`;
    if (product.fictional !== dataset.fictional) {
      add('dataset.fictional-mismatch', 'error', path, '製品とデータセットの架空データ指定が一致しません', [product.id]);
    }
    if (seenProducts.has(product.id)) {
      add('product.duplicate-id', 'error', path, '製品の識別子が重複しています', [product.id]);
    }
    seenProducts.add(product.id);
    if (!measuredProducts.has(product.id)) {
      add('product.no-measurements', 'warning', path, 'この製品には測定レコードがありません', [product.id]);
    }
  });

  const seenSources = new Set<string>();
  dataset.sources.forEach((source, index) => {
    const path = `sources[${index}]`;
    if (seenSources.has(source.id)) {
      add('source.duplicate-id', 'error', path, '出典の識別子が重複しています', [source.id]);
    }
    seenSources.add(source.id);
    if (!isCalendarDate(source.accessedAt)) {
      add('source.accessed-at-invalid', 'error', path, '出典の取得日は実在する日付を YYYY-MM-DD 形式で記録してください', [source.id]);
    }
    if (source.url === null && citedSources.has(source.id)) {
      add('source.url-missing', 'warning', path, '第三者測定またはメーカー公称値が参照する出典の URL が未記録です', [source.id]);
    }
  });

  const seenMeasurements = new Set<string>();
  // Compare each pair once, attaching its warning to the later record.
  const previousByProduct = new Map<string, Map<Measurement['metric'], Measurement[]>>();
  dataset.measurements.forEach((measurement, index) => {
    const path = `measurements[${index}]`;
    const { id, productId, sourceId, status, value, metric, unit, derivation, version } = measurement;
    const error = (code: string, message: string, relatedIds = [id]) => add(code, 'error', path, message, relatedIds);
    if (seenMeasurements.has(id)) error('measurement.duplicate-id', '測定の識別子が重複しています');
    seenMeasurements.add(id);
    if (!productIds.has(productId)) error('measurement.unknown-product', '参照先の製品が見つかりません', [id, productId]);
    if (sourceId !== null && !sources.has(sourceId)) {
      error('measurement.unknown-source', '参照先の出典が見つかりません', [id, sourceId]);
    }
    if ((status === 'missing') !== (value === null)) {
      error('measurement.value-status-mismatch', '未測定の値は null とし、それ以外の証拠種別には値を記録してください');
    }
    if (value !== null && !Number.isFinite(value)) error('measurement.value-not-finite', '測定値は有限の数値でなければなりません');
    if (status !== 'missing' && sourceId === null) error('measurement.source-required', '未測定以外の測定には出典が必要です');
    if (status === 'missing' && sourceId !== null) error('measurement.source-forbidden', '未測定のレコードに出典は設定できません');
    if (!METRIC_UNITS[metric].accepted.includes(unit)) error('measurement.unit-not-accepted', `${metric} の単位 ${unit} は対応していません`);
    if (status === 'estimated' && (derivation === null || derivation.trim() === '')) {
      error('measurement.derivation-required', '推定値には導出方法の記録が必要です');
    }
    if (status !== 'estimated' && derivation !== null) error('measurement.derivation-forbidden', '推定値以外には導出方法を設定できません');
    if (hasZeroUncertainty(measurement)) error('measurement.uncertainty-zero', '不確かさをゼロで記録できません。不明な場合は null にしてください');
    else if (hasInvalidUncertainty(measurement)) error('measurement.uncertainty-invalid', '不確かさは有限の非負値（範囲は low ≤ high）で記録してください');
    if (!Number.isInteger(version) || version <= 0) error('measurement.version-invalid', '測定レコードの版は正の整数でなければなりません');
    const source = sourceId === null ? undefined : sources.get(sourceId);
    if (source && ((status === 'observed' && source.kind === 'manufacturer') ||
      (status === 'manufacturer' && source.kind === 'independent-lab'))) {
      error('measurement.status-source-kind-conflict', '測定の証拠種別と出典の種別が矛盾しています', [id, source.id]);
    }

    if (status !== 'missing') {
      const unrecorded = REQUIRED_CONDITIONS[metric].filter((key) => measurement.conditions[key] === undefined);
      if (unrecorded.length > 0) {
        add('measurement.required-condition-unrecorded', 'warning', path,
          `${metric} の比較に必要な測定条件が未記録です: ${unrecorded.join(', ')}`, [id]);
      }
      const byMetric = previousByProduct.get(productId) ?? new Map<Measurement['metric'], Measurement[]>();
      const previous = byMetric.get(metric) ?? [];
      for (const other of previous) {
        const comparison = compareConditions(other.conditions, measurement.conditions);
        if (comparison.status === 'incompatible') {
          add('measurement.conditions-not-identical-within-product', 'warning', path,
            `同じ製品・指標の測定条件が一致せず、採用する測定によって結果が異なります: ${comparison.mismatches.join(', ')}`,
            [other.id, id]);
        }
      }
      previous.push(measurement);
      byMetric.set(metric, previous);
      previousByProduct.set(productId, byMetric);
    }
  });
  return issues;
}

/** Convenience: true when `validateDataset` reports no `error`. Warnings are allowed. */
export function isDatasetUsable(dataset: Dataset): boolean {
  return !validateDataset(dataset).some((issue) => issue.severity === 'error');
}
