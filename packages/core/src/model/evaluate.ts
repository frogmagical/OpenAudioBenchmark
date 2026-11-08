/**
 * Evaluation entry points that keep the whole chain traceable:
 * measurement → selection → unit conversion → normalisation → utility.
 * `scoring.ts` stays independent; this module only feeds it and records the
 * `normalize` step next to the projection lineage.
 */
import { METRIC_BOUNDS } from '../methodology.ts';
import { calculateUtility, metricScore } from '../scoring.ts';
import { METRIC_KEYS } from '../types.ts';
import type { MetricKey, MetricValues, UtilityResult, Weights } from '../types.ts';
import { explainComparability } from './comparability.ts';
import type { Comparability } from './comparability.ts';
import { ensurePrepared } from './prepare.ts';
import type { PreparedDataset } from './prepare.ts';
import { projectProduct, toMetricValues } from './project.ts';
import type { Dataset, DerivedValue, MetricId, ProductProjection } from './types.ts';

export interface ProductEvaluation {
  readonly productId: string;
  readonly projection: ProductProjection;
  readonly values: MetricValues;
  readonly utility: UtilityResult;
  /** Per metric: projection steps followed by the `normalize` step (input canonical value → 0–100 score or null). */
  readonly lineage: Readonly<Record<MetricKey, DerivedValue<number | null>>>;
}

export function evaluateProduct(input: Dataset | PreparedDataset, productId: string, weights: Weights): ProductEvaluation {
  const prepared = ensurePrepared(input);
  const projection = projectProduct(prepared, productId);
  const values = toMetricValues(projection);
  const utility = calculateUtility(values, weights);
  const lineage = Object.fromEntries(
    METRIC_KEYS.map((k) => {
      const bounds = METRIC_BOUNDS[k];
      const score = metricScore(values, k);
      const derived: DerivedValue<number | null> = {
        value: score,
        steps: [
          ...projection.metrics[k].derived.steps,
          {
            op: 'normalize',
            input: { value: values[k], unit: bounds.unit },
            output: score,
            note:
              score === null
                ? `${k}: 値が未知または無効のため正規化せず（欠測として扱う）`
                : `${k}: 固定基準範囲 ${bounds.min}〜${bounds.max}${bounds.scale === 'log10' ? '（log10）' : ''}${bounds.invert ? '・低いほど高評価' : ''} で 0〜100 に正規化`,
          },
        ],
      };
      return [k, derived];
    }),
  ) as Record<MetricKey, DerivedValue<number | null>>;
  return { productId, projection, values, utility, lineage };
}

/**
 * Comparability of the measurements two products use for `metric`. A product
 * without any usable record for the metric is `not-comparable` with
 * `value.missing`, exactly like an explicit `missing` record — absence must
 * never read as "nothing to object to".
 */
export function explainMetricComparability(
  input: Dataset | PreparedDataset,
  productAId: string,
  productBId: string,
  metric: MetricId,
): Comparability {
  const prepared = ensurePrepared(input);
  const a = projectProduct(prepared, productAId).metrics[metric];
  const b = projectProduct(prepared, productBId).metrics[metric];
  const find = (id: string | null) => (id === null ? undefined : prepared.dataset.measurements.find((m) => m.id === id));
  const ma = a.status === 'missing' ? undefined : find(a.measurementId);
  const mb = b.status === 'missing' ? undefined : find(b.measurementId);
  if (!ma || !mb) {
    const absent = [!ma ? productAId : null, !mb ? productBId : null].filter((x): x is string => x !== null);
    return {
      level: 'not-comparable',
      reasons: [
        {
          code: 'value.missing',
          message: '未測定または測定レコードがないため、比較する数値がありません',
          details: absent,
        },
      ],
    };
  }
  return explainComparability(ma, mb);
}
