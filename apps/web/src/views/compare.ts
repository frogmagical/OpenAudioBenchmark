/**
 * Comparison view (02): up to two products side by side. Every number, label
 * and comparability reason comes from the same prepared dataset projection,
 * so displayed values and their provenance cannot diverge.
 */
import {
  FEATURE_LABELS,
  METRIC_LABELS,
  PREPARED_DEMO_DATASET,
  STATUS_LABELS,
  calculateUtility,
  explainMetricComparability,
  toDemoProduct,
} from '@openaudiobenchmark/core';
import type { Comparability, DemoProduct, MetricKey, PreparedDataset, Weights } from '@openaudiobenchmark/core';
import { escapeHtml, qs } from '../dom.ts';
import { fmt } from '../format.ts';

export const NO_SELECTION_TEXT = 'まだ製品が選択されていません。';
export const WITHHELD_TEXT = '条件不一致（比較保留）';

const CONDITION_DEPENDENT: readonly MetricKey[] = ['power', 'thdn', 'snr'];

const EVIDENCE_ROW_LABELS: Readonly<Record<DemoProduct['evidence'], string>> = {
  observed: '第三者測定（架空）',
  manufacturer: 'メーカー値のみ（架空）',
  estimated: '推定値のみ（架空）',
  missing: '測定なし',
};

export function renderCompare(
  productIds: readonly string[],
  weights: Weights,
  prepared: PreparedDataset = PREPARED_DEMO_DATASET,
): void {
  const target = qs('#comparison');
  const ids = productIds.filter((id) => prepared.dataset.products.some((p) => p.id === id)).slice(0, 2);
  if (ids.length === 0) {
    target.textContent = NO_SELECTION_TEXT;
    return;
  }
  const ps = ids.map((id) => toDemoProduct(prepared, id));
  const cols: readonly (DemoProduct | undefined)[] = [ps[0], ps[1]];

  // Measurement-level comparability per metric (P2-1). A metric is withheld iff its own
  // pair is not comparable; the utility score is withheld iff any condition-dependent metric is.
  const perMetric: Partial<Record<MetricKey, Comparability>> = {};
  if (ids.length === 2) {
    for (const k of CONDITION_DEPENDENT) perMetric[k] = explainMetricComparability(prepared, ids[0]!, ids[1]!, k);
  }
  const metricBlocked = (k: MetricKey): boolean => perMetric[k]?.level === 'not-comparable';
  const anyBlocked = CONDITION_DEPENDENT.some(metricBlocked);

  const row = (name: string, fn: (p: DemoProduct) => string, metric?: MetricKey, scoreRow = false): string =>
    `<div class="cell muted">${name}</div>` +
    cols
      .map((p) => {
        if (!p) return '<div class="cell">—</div>';
        const withheld = scoreRow ? anyBlocked : metric !== undefined && metricBlocked(metric);
        if (withheld) return `<div class="cell" data-withheld>${WITHHELD_TEXT}</div>`;
        return `<div class="cell">${escapeHtml(fn(p))}</div>`;
      })
      .join('');

  const utility = (p: DemoProduct): string => {
    const u = calculateUtility(p, weights);
    return u.status === 'scored' && u.score !== null ? `${u.score.toFixed(1)}/100` : '比較保留';
  };

  let reasonsHtml = '';
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

  target.innerHTML =
    reasonsHtml +
    `<div class="comparegrid"><div class="cell head">比較指標</div>` +
    cols.map((p) => `<div class="cell head">${p ? escapeHtml(p.name) : '未選択'}</div>`).join('') +
    row('価格', (p) => `${fmt(p.price)}円`) +
    row('8Ω 出力/ch', (p) => `${fmt(p.power)}W`, 'power') +
    row('THD+N', (p) => (p.thdn === null ? '未測定' : `${p.thdn}%`), 'thdn') +
    row('S/N', (p) => (p.snr === null ? '未測定' : `${p.snr}dB`), 'snr') +
    row('参考適合度', utility, undefined, true) +
    row('データ充足度', (p) => `${Math.round(calculateUtility(p, weights).coverage * 100)}%`) +
    row('証拠の種類', (p) => `${EVIDENCE_ROW_LABELS[p.evidence]}（${STATUS_LABELS[p.evidence]}）`) +
    row('必須機能以外の装備', (p) => p.features.map((f) => FEATURE_LABELS[f]).join('、')) +
    `</div>`;
}
