/** Comparison view (02): up to two products side by side, same metrics, same conditions. */
import {
  DEMO_DATASET,
  FEATURE_LABELS,
  METRIC_LABELS,
  calculateUtility,
  compareConditions,
  explainComparability,
  projectProduct,
} from '@openaudiobenchmark/core';
import type { Comparability, Dataset, DemoProduct, MetricKey, Weights } from '@openaudiobenchmark/core';
import { escapeHtml, qs } from '../dom.ts';
import { fmt } from '../format.ts';

export const NO_SELECTION_TEXT = 'まだ製品が選択されていません。';
export const WITHHELD_TEXT = '条件不一致（比較保留）';

const CONDITION_DEPENDENT: readonly MetricKey[] = ['power', 'thdn', 'snr'];

/**
 * Measurement-level comparability per metric, when both products are in the
 * dataset. Returns `null` for products outside the dataset (fallback to the
 * product-level condition check).
 */
function metricComparability(dataset: Dataset, a: DemoProduct, b: DemoProduct): Partial<Record<MetricKey, Comparability>> | null {
  if (!dataset.products.some((p) => p.id === a.id) || !dataset.products.some((p) => p.id === b.id)) return null;
  const pa = projectProduct(dataset, a.id);
  const pb = projectProduct(dataset, b.id);
  const out: Partial<Record<MetricKey, Comparability>> = {};
  for (const k of CONDITION_DEPENDENT) {
    const ma = dataset.measurements.find((m) => m.id === pa.metrics[k].measurementId);
    const mb = dataset.measurements.find((m) => m.id === pb.metrics[k].measurementId);
    if (ma && mb) out[k] = explainComparability(ma, mb);
  }
  return out;
}

export function renderCompare(ps: readonly DemoProduct[], weights: Weights, dataset: Dataset = DEMO_DATASET): void {
  const target = qs('#comparison');
  if (ps.length === 0) {
    target.textContent = NO_SELECTION_TEXT;
    return;
  }
  const cols: readonly (DemoProduct | undefined)[] = [ps[0], ps[1]];

  // Figures measured under different conditions are withheld, not shown side by side (AGENTS.md §4).
  const conditions = ps[0] && ps[1] ? compareConditions(ps[0].conditions, ps[1].conditions) : null;
  const incompatible = conditions !== null && conditions.status !== 'compatible';

  // Measurement-level reasons (P2-1). A metric is withheld when its own pair is not comparable;
  // the utility score is withheld when any condition-dependent metric is.
  const perMetric = ps[0] && ps[1] ? metricComparability(dataset, ps[0], ps[1]) : null;
  const metricBlocked = (k: MetricKey): boolean => perMetric?.[k]?.level === 'not-comparable';
  const anyBlocked = incompatible || CONDITION_DEPENDENT.some(metricBlocked);

  const row = (name: string, fn: (p: DemoProduct) => string, metric?: MetricKey, scoreRow = false): string =>
    `<div class="cell muted">${name}</div>` +
    cols
      .map((p) => {
        if (!p) return '<div class="cell">—</div>';
        const withheld = scoreRow ? anyBlocked : metric !== undefined && (incompatible || metricBlocked(metric));
        if (withheld) return `<div class="cell" data-withheld>${WITHHELD_TEXT}</div>`;
        return `<div class="cell">${escapeHtml(fn(p))}</div>`;
      })
      .join('');

  const utility = (p: DemoProduct): string => {
    const u = calculateUtility(p, weights);
    return u.status === 'scored' && u.score !== null ? `${u.score.toFixed(1)}/100` : '比較保留';
  };

  let conditionNotice = '';
  if (incompatible) {
    const reason =
      conditions.status === 'undetermined'
        ? '測定条件が両製品とも記録されていないため'
        : `測定条件が一致しないため（不一致: ${conditions.mismatches.map(escapeHtml).join('、')}）`;
    conditionNotice = `<div class="notice" data-condition-mismatch="${conditions.status}">${reason}、測定値と参考適合度の直接比較を保留しました。条件が揃うか正規化方法が定義されるまで横並び表示しません。</div>`;
  }

  // Explain, per metric, why a pair is withheld or only comparable with caveats.
  let reasonsHtml = '';
  if (perMetric) {
    const items = CONDITION_DEPENDENT.flatMap((k) => {
      const c = perMetric[k];
      if (!c || c.level === 'comparable') return [];
      const label = c.level === 'not-comparable' ? '比較保留' : '注意';
      return [
        `<li data-metric="${k}" data-level="${c.level}"><b>${METRIC_LABELS[k]}：${label}</b> — ${c.reasons
          .map((r) => escapeHtml(r.message))
          .join('；')}</li>`,
      ];
    });
    if (items.length > 0) {
      reasonsHtml = `<div class="notice" data-comparability><p style="margin:0 0 6px">比較可能性の判定（測定ごと）</p><ul style="margin:0;padding-left:18px">${items.join('')}</ul></div>`;
    }
  }

  target.innerHTML =
    conditionNotice +
    reasonsHtml +
    `<div class="comparegrid"><div class="cell head">比較指標</div>` +
    cols.map((p) => `<div class="cell head">${p ? escapeHtml(p.name) : '未選択'}</div>`).join('') +
    row('価格', (p) => `${fmt(p.price)}円`) +
    row('8Ω 出力/ch', (p) => `${fmt(p.power)}W`, 'power') +
    row('THD+N', (p) => (p.thdn === null ? '未測定' : `${p.thdn}%`), 'thdn') +
    row('S/N', (p) => (p.snr === null ? '未測定' : `${p.snr}dB`), 'snr') +
    row('参考適合度', utility, undefined, true) +
    row('データ充足度', (p) => `${Math.round(calculateUtility(p, weights).coverage * 100)}%`) +
    row('証拠の種類', (p) => (p.verified ? '第三者測定（架空）' : 'メーカー値のみ（架空）')) +
    row('必須機能以外の装備', (p) => p.features.map((f) => FEATURE_LABELS[f]).join('、')) +
    `</div>`;
}
