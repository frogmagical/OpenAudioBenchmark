/**
 * Explain whether two measurements of the same metric may be compared.
 * Implemented by the core worker against this contract.
 */
import { compareConditions } from '../conditions.ts';
import { REQUIRED_CONDITIONS } from './rules.ts';
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
 * - `value.missing`: either side is `missing` or has `value === null` (nothing to compare).
 * - `unit.not-convertible`: either unit cannot be converted to the metric's canonical unit
 *   (`toCanonicalUnit` returns null).
 * - `conditions.mismatch`: `compareConditions(a.conditions, b.conditions).status === 'incompatible'`;
 *   details = mismatched keys.
 * - `conditions.unrecorded`: any `REQUIRED_CONDITIONS[metric]` key is undefined on either side
 *   (details = the keys), or `compareConditions(...).status === 'undetermined'` for a metric that
 *   has required conditions. A metric with no required conditions (price) is never blocked by
 *   unrecorded conditions.
 *
 * comparable-with-caveats
 * - `evidence.tier-differs`: statuses differ (e.g. observed vs manufacturer); details = both statuses.
 * - `evidence.estimated`: either side is `estimated`.
 * - `unit.converted`: units differ but both convert (details = both units).
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
  if (a.status === 'missing' || b.status === 'missing' || a.value === null || b.value === null) {
    add('value.missing', '未測定または値が未記録のため、比較する数値がありません', [a.id, b.id]);
  }
  // A missing value is diagnosed above; probe its unit separately without imputing a measurement.
  const aConversion = toCanonicalUnit(a.metric, a.value ?? 1, a.unit);
  const bConversion = toCanonicalUnit(b.metric, b.value ?? 1, b.unit);
  if (aConversion === null || bConversion === null) {
    add('unit.not-convertible', '正規単位へ変換できない測定があるため、数値を比較できません', [a.unit, b.unit]);
  }
  const conditions = compareConditions(a.conditions, b.conditions);
  if (conditions.status === 'incompatible') {
    add('conditions.mismatch', '測定条件が一致しないため、直接比較できません', conditions.mismatches);
  }
  const unrecorded = [...new Set([
    ...REQUIRED_CONDITIONS[a.metric].filter((key) => a.conditions[key] === undefined),
    ...REQUIRED_CONDITIONS[b.metric].filter((key) => b.conditions[key] === undefined),
  ])];
  const conditionsMatter = REQUIRED_CONDITIONS[a.metric].length > 0 || REQUIRED_CONDITIONS[b.metric].length > 0;
  if ((conditions.status === 'undetermined' && conditionsMatter) || unrecorded.length > 0) {
    add('conditions.unrecorded', unrecorded.length > 0
      ? `比較に必要な測定条件が未記録です: ${unrecorded.join(', ')}`
      : '両方の測定条件が未記録のため、条件の一致を判断できません', unrecorded);
  }
  const cannotCompare = reasons.length > 0;

  if (a.status !== b.status) add('evidence.tier-differs', '証拠種別が異なるため、出典と取得方法の違いに留意してください', [a.status, b.status]);
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
