/**
 * Explain whether two measurements of the same metric may be compared.
 * Pure explanation using metric-relevant conditions and recorded finite values.
 */
import { compareConditions } from '../conditions.ts';
import { CONDITION_LABELS, formatConditionValue, RELEVANT_CONDITIONS, STATUS_LABELS, unrecordedRequiredConditions } from './rules.ts';
import type { Measurement } from './types.ts';
import { toCanonicalUnit } from './units.ts';

export type ComparabilityLevel = 'comparable' | 'comparable-with-caveats' | 'not-comparable';

export interface ComparabilityReason {
  /** Stable code, e.g. `conditions.mismatch`, `conditions.unrecorded`, `evidence.tier-differs`. */
  readonly code: string;
  /** Japanese explanation suitable for the UI. */
  readonly message: string;
  /** Condition keys or other identifiers the reason refers to. */
  readonly details: readonly string[];
}

export interface Comparability {
  readonly level: ComparabilityLevel;
  readonly reasons: readonly ComparabilityReason[];
}

/**
 * Rules, evaluated in this order; the strongest applicable level wins:
 *
 * not-comparable
 * - `metric.differs`: `a.metric !== b.metric`.
 * - `value.missing`: either side is `missing`, null or non-finite (nothing to compare).
 * - `unit.not-convertible`: a recorded finite value cannot convert to its metric's canonical unit.
 *   Missing/non-finite values are never probed with a substitute value.
 * - `conditions.mismatch`: relevant conditions differ; details = mismatched keys, message =
 *   Japanese labels and both recorded values (or 未記録).
 * - `conditions.unrecorded`: a required relevant condition is undefined on either side;
 *   details = keys, message = Japanese labels. Both condition rules are skipped for different
 *   metrics. Price has no relevant conditions and is never blocked by condition rules.
 *
 * comparable-with-caveats
 * - `evidence.tier-differs`: statuses differ; details = statuses, message = both Japanese labels.
 * - `evidence.estimated`: either side is `estimated`.
 * - `unit.converted`: units differ and both non-null finite values convert (details = both units).
 * - `uncertainty.unstated`: either side has `uncertainty === null`.
 *
 * comparable
 * - none of the above.
 *
 * All applicable reasons are reported, not only the first. Messages are Japanese and must say
 * *why* the pair cannot (or can only partly) be compared.
 */
export function explainComparability(a: Measurement, b: Measurement): Comparability {
  const reasons: ComparabilityReason[] = [];
  const add = (code: string, message: string, details: readonly string[]) => reasons.push({ code, message, details });

  if (a.metric !== b.metric) add('metric.differs', '指標が異なるため、測定値を直接比較できません', [a.metric, b.metric]);
  const aHasValue = a.value !== null && Number.isFinite(a.value);
  const bHasValue = b.value !== null && Number.isFinite(b.value);
  if (a.status === 'missing' || b.status === 'missing' || !aHasValue || !bHasValue) {
    add('value.missing', '未測定または値が未記録のため、比較する数値がありません', [a.id, b.id]);
  }
  const aConversion = aHasValue ? toCanonicalUnit(a.metric, a.value, a.unit) : null;
  const bConversion = bHasValue ? toCanonicalUnit(b.metric, b.value, b.unit) : null;
  const failedUnits = [
    ...(aHasValue && aConversion === null ? [a.unit] : []),
    ...(bHasValue && bConversion === null ? [b.unit] : []),
  ];
  if (failedUnits.length > 0) {
    add('unit.not-convertible', `単位 ${[...new Set(failedUnits)].join('、')} の測定値を正規単位へ変換できないため、数値を比較できません`, [a.unit, b.unit]);
  }
  if (a.metric === b.metric) {
    const relevant = RELEVANT_CONDITIONS[a.metric];
    const conditions = compareConditions(a.conditions, b.conditions, relevant);
    if (conditions.status === 'incompatible') {
      const differences = conditions.mismatches.map((key) =>
        `${CONDITION_LABELS[key]}が ${formatConditionValue(key, a.conditions)} と ${formatConditionValue(key, b.conditions)} で異なる`);
      add('conditions.mismatch', `${differences.join('、')}ため直接比較できません`, conditions.mismatches);
    }
    const unrecorded = [...new Set([
      ...unrecordedRequiredConditions(a.metric, a.conditions),
      ...unrecordedRequiredConditions(b.metric, b.conditions),
    ])].filter((key) => relevant.includes(key));
    if (unrecorded.length > 0) {
      add('conditions.unrecorded', `比較に必要な測定条件が未記録です: ${unrecorded.map((key) => CONDITION_LABELS[key]).join('、')}`, unrecorded);
    }
  }
  const cannotCompare = reasons.length > 0;

  if (a.status !== b.status) add('evidence.tier-differs', `証拠種別が ${STATUS_LABELS[a.status]} と ${STATUS_LABELS[b.status]} で異なるため、出典と取得方法の違いに留意してください`, [a.status, b.status]);
  if (a.status === 'estimated' || b.status === 'estimated') {
    add('evidence.estimated', '推定値を含むため、導出方法と仮定の確認が必要です', [a, b].filter((m) => m.status === 'estimated').map((m) => m.id));
  }
  if (a.unit !== b.unit && aConversion !== null && bConversion !== null) {
    add('unit.converted', '記録された単位が異なるため、正規単位への変換を伴います', [a.unit, b.unit]);
  }
  if (a.uncertainty === null || b.uncertainty === null) {
    add('uncertainty.unstated', '測定の不確かさが未記録のため、差の有意性を判断できません', [a, b].filter((m) => m.uncertainty === null).map((m) => m.id));
  }
  return { level: cannotCompare ? 'not-comparable' : reasons.length > 0 ? 'comparable-with-caveats' : 'comparable', reasons };
}
