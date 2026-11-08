/**
 * Dataset validation (ingestion gate). Pure: returns issues, never mutates.
 * Shared value domains and relevant condition rules govern the checks below.
 */
import { compareConditions } from '../conditions.ts';
import { isCalendarDate, isInvalidUncertainty, isZeroUncertainty } from './common.ts';
import { isValueInDomain, METRIC_UNITS, RELEVANT_CONDITIONS, unrecordedConditionsMessage, unrecordedRequiredConditions, VALUE_DOMAIN } from './rules.ts';
import { DATASET_SCHEMA_VERSION } from './types.ts';
import type { Dataset, Measurement, QualityIssue, Source } from './types.ts';


/**
 * Validate a dataset and return every issue found (empty array = clean).
 * Paths use `products[i]`, `sources[i]`, `measurements[i]`; `relatedIds` lists the ids involved.
 *
 * Errors (`severity: 'error'`):
 * - `dataset.schema-version`: `schemaVersion !== DATASET_SCHEMA_VERSION`.
 * - `dataset.fictional-mismatch`: `dataset.fictional` differs from any `product.fictional`.
 * - `product.duplicate-id`, `source.duplicate-id`, `measurement.duplicate-id`.
 * - `product.id-empty`, `source.id-empty`, `measurement.id-empty`: empty or whitespace-only id.
 * - `measurement.unknown-product` / `measurement.unknown-source`: dangling reference.
 * - `measurement.value-status-mismatch`: `status === 'missing'` with a non-null value, or a
 *   non-missing status with `value === null`.
 * - `measurement.value-not-finite`: value is NaN or ±Infinity.
 * - `measurement.value-out-of-domain`: finite non-null value fails `isValueInDomain`;
 *   never emitted alongside `value-not-finite` for the same value.
 * - `measurement.source-required`: non-missing status with `sourceId === null`.
 * - `measurement.source-forbidden`: `status === 'missing'` with a `sourceId` (nothing was measured, so nothing is cited).
 * - `measurement.unit-not-accepted`: `unit` not in `METRIC_UNITS[metric].accepted`.
 * - `measurement.derivation-required`: `status === 'estimated'` with `derivation` null or blank (whitespace only).
 * - `measurement.derivation-forbidden`: `derivation !== null` on a non-estimated status.
 * - `measurement.uncertainty-zero`: any uncertainty whose magnitude is 0 (or range with low === high)
 *   — unknown uncertainty must be `null`, never 0.
 * - `measurement.uncertainty-invalid`: negative or non-finite magnitude, non-finite range bounds, or `low > high`.
 * - `measurement.uncertainty-forbidden`: non-null uncertainty on a missing record.
 * - `measurement.uncertainty-unit-mismatch`: absolute/range uncertainty unit differs from the published value's unit.
 * - `measurement.version-invalid`: `version` is not a positive integer.
 * - `source.accessed-at-invalid`, `source.published-at-invalid`, `measurement.captured-at-invalid`:
 *   not a real calendar date in `YYYY-MM-DD` format; publishedAt/capturedAt may be null.
 * - `measurement.status-source-kind-conflict`: `status === 'observed'` whose source is `kind: 'manufacturer'`,
 *   or `status === 'manufacturer'` whose source is `kind: 'independent-lab'`.
 *   First source wins for duplicate ids; kind checks skip ambiguous source ids.
 * - `source.url-missing`: null/blank URL cited by observed/manufacturer evidence in a real dataset.
 *
 * Warnings (`severity: 'warning'`):
 * - `measurement.required-condition-unrecorded`: a required condition (`REQUIRED_CONDITIONS[metric]`)
 *   is `undefined` on a non-missing measurement; message lists the keys.
 * - `measurement.conditions-not-identical-within-product`: two non-missing measurements of the
 *   same product and metric have incompatible relevant conditions (`RELEVANT_CONDITIONS`), which makes the
 *   selection order matter.
 * - `measurement.ambiguous-selection`: two usable (non-missing, finite, no measurement errors)
 *   records tie on product, metric, status, version and capturedAt, with compatible relevant
 *   conditions but distinct raw value/unit pairs. Null dates tie. Price has no condition constraint;
 *   undetermined conditions on other metrics do not establish compatibility. Attach to the later record.
 * - `source.url-missing`: the same missing-URL rule is a warning for fictional datasets.
 * - `source.unreferenced`: source cited by no measurement, regardless of evidence status.
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
  const sources = new Map<string, Source>();
  const duplicateSourceIds = new Set<string>();
  const measuredProducts = new Set(dataset.measurements.map((measurement) => measurement.productId));
  const citedSources = new Set(dataset.measurements
    .filter((measurement) => measurement.status === 'observed' || measurement.status === 'manufacturer')
    .map((measurement) => measurement.sourceId));
  const referencedSources = new Set(dataset.measurements.map((measurement) => measurement.sourceId));

  if (dataset.schemaVersion !== DATASET_SCHEMA_VERSION) {
    add('dataset.schema-version', 'error', 'schemaVersion', 'データセットのスキーマ版が対応する版と一致しません', []);
  }

  const seenProducts = new Set<string>();
  dataset.products.forEach((product, index) => {
    const path = `products[${index}]`;
    if (product.id.trim() === '') add('product.id-empty', 'error', path, '製品の識別子は空にできません', [product.id]);
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

  dataset.sources.forEach((source, index) => {
    const path = `sources[${index}]`;
    if (source.id.trim() === '') add('source.id-empty', 'error', path, '出典の識別子は空にできません', [source.id]);
    if (sources.has(source.id)) {
      add('source.duplicate-id', 'error', path, '出典の識別子が重複しています', [source.id]);
      duplicateSourceIds.add(source.id);
    } else {
      sources.set(source.id, source);
    }
    if (!isCalendarDate(source.accessedAt)) {
      add('source.accessed-at-invalid', 'error', path, '出典の取得日は実在する日付を YYYY-MM-DD 形式で記録してください', [source.id]);
    }
    if (source.publishedAt !== null && !isCalendarDate(source.publishedAt)) {
      add('source.published-at-invalid', 'error', path, '出典の公開日は実在する日付を YYYY-MM-DD 形式で記録してください', [source.id]);
    }
    if ((source.url === null || source.url.trim() === '') && citedSources.has(source.id)) {
      add('source.url-missing', dataset.fictional ? 'warning' : 'error', path, '第三者測定またはメーカー公称値が参照する出典の URL が未記録です', [source.id]);
    }
    if (!referencedSources.has(source.id)) {
      add('source.unreferenced', 'warning', path, 'この出典を参照する測定レコードがありません', [source.id]);
    }
  });

  const seenMeasurements = new Set<string>();
  const usableMeasurements = new Set<Measurement>();
  // Compare each pair once, attaching its warning to the later record.
  const previousByProduct = new Map<string, Map<Measurement['metric'], Measurement[]>>();
  dataset.measurements.forEach((measurement, index) => {
    const path = `measurements[${index}]`;
    const { id, productId, sourceId, status, value, metric, unit, derivation, version } = measurement;
    let hasError = false;
    const error = (code: string, message: string, relatedIds = [id]) => {
      hasError = true;
      add(code, 'error', path, message, relatedIds);
    };
    if (id.trim() === '') error('measurement.id-empty', '測定の識別子は空にできません');
    if (seenMeasurements.has(id)) error('measurement.duplicate-id', '測定の識別子が重複しています');
    seenMeasurements.add(id);
    if (!productIds.has(productId)) error('measurement.unknown-product', '参照先の製品が見つかりません', [id, productId]);
    if (sourceId !== null && !sources.has(sourceId)) {
      error('measurement.unknown-source', '参照先の出典が見つかりません', [id, sourceId]);
    }
    if ((status === 'missing') !== (value === null)) {
      error('measurement.value-status-mismatch', '未測定の値は null とし、それ以外の証拠種別には値を記録してください');
    }
    if (value !== null) {
      if (!Number.isFinite(value)) error('measurement.value-not-finite', '測定値は有限の数値でなければなりません');
      else if (!isValueInDomain(metric, unit, value)) {
        const domain = VALUE_DOMAIN[metric][unit];
        error('measurement.value-out-of-domain', `${metric} の測定値は ${domain?.min} ${unit} ${domain?.exclusiveMin ? 'より大きい値' : '以上'}でなければなりません`);
      }
    }
    if (status !== 'missing' && sourceId === null) error('measurement.source-required', '未測定以外の測定には出典が必要です');
    if (status === 'missing' && sourceId !== null) error('measurement.source-forbidden', '未測定のレコードに出典は設定できません');
    if (!METRIC_UNITS[metric].accepted.includes(unit)) error('measurement.unit-not-accepted', `${metric} の単位 ${unit} は対応していません`);
    if (status === 'estimated' && (derivation === null || derivation.trim() === '')) {
      error('measurement.derivation-required', '推定値には導出方法の記録が必要です');
    }
    if (status !== 'estimated' && derivation !== null) error('measurement.derivation-forbidden', '推定値以外には導出方法を設定できません');
    if (status === 'missing' && measurement.uncertainty !== null) error('measurement.uncertainty-forbidden', '未測定のレコードに不確かさは設定できません');
    if (measurement.uncertainty !== null && measurement.uncertainty.type !== 'relative' && measurement.uncertainty.unit !== unit) {
      error('measurement.uncertainty-unit-mismatch', '不確かさの単位は測定値の単位と一致させてください');
    }
    if (measurement.uncertainty !== null && isZeroUncertainty(measurement.uncertainty)) error('measurement.uncertainty-zero', '不確かさをゼロで記録できません。不明な場合は null にしてください');
    else if (measurement.uncertainty !== null && isInvalidUncertainty(measurement.uncertainty)) error('measurement.uncertainty-invalid', '不確かさは有限の非負値（範囲は low ≤ high）で記録してください');
    if (!Number.isInteger(version) || version <= 0) error('measurement.version-invalid', '測定レコードの版は正の整数でなければなりません');
    if (measurement.capturedAt !== null && !isCalendarDate(measurement.capturedAt)) {
      error('measurement.captured-at-invalid', '測定日は実在する日付を YYYY-MM-DD 形式で記録してください');
    }
    const source = sourceId === null ? undefined : sources.get(sourceId);
    if (source && !duplicateSourceIds.has(source.id) && ((status === 'observed' && source.kind === 'manufacturer') ||
      (status === 'manufacturer' && source.kind === 'independent-lab'))) {
      error('measurement.status-source-kind-conflict', '測定の証拠種別と出典の種別が矛盾しています', [id, source.id]);
    }

    if (status !== 'missing') {
      if (!hasError && value !== null && Number.isFinite(value)) usableMeasurements.add(measurement);
      const unrecorded = unrecordedRequiredConditions(metric, measurement.conditions);
      if (unrecorded.length > 0) {
        add('measurement.required-condition-unrecorded', 'warning', path,
          unrecordedConditionsMessage(metric, unrecorded), [id]);
      }
      const byMetric = previousByProduct.get(productId) ?? new Map<Measurement['metric'], Measurement[]>();
      const previous = byMetric.get(metric) ?? [];
      for (const other of previous) {
        const relevant = RELEVANT_CONDITIONS[metric];
        const comparison = compareConditions(other.conditions, measurement.conditions, relevant);
        if (comparison.status === 'incompatible') {
          add('measurement.conditions-not-identical-within-product', 'warning', path,
            `同じ製品・指標の測定条件が一致せず、採用する測定によって結果が異なります: ${comparison.mismatches.join(', ')}`,
            [other.id, id]);
        }
        if (usableMeasurements.has(other) && usableMeasurements.has(measurement) &&
          other.status === status && other.version === version && other.capturedAt === measurement.capturedAt &&
          (relevant.length === 0 || comparison.status === 'compatible') &&
          (other.value !== value || other.unit !== unit)) {
          add('measurement.ambiguous-selection', 'warning', path,
            '同じ優先順位と測定条件で異なる値または単位が記録されているため、採用する測定の確認が必要です', [other.id, id]);
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
