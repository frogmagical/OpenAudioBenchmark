/** Comparison view (02): up to two products side by side, same metrics, same conditions. */
import { FEATURE_LABELS, calculateUtility, compareConditions } from '@openaudiobenchmark/core';
import type { DemoProduct, Weights } from '@openaudiobenchmark/core';
import { escapeHtml, qs } from '../dom.ts';
import { fmt } from '../format.ts';

export const NO_SELECTION_TEXT = 'まだ製品が選択されていません。';
export const WITHHELD_TEXT = '条件不一致（比較保留）';

export function renderCompare(ps: readonly DemoProduct[], weights: Weights): void {
  const target = qs('#comparison');
  if (ps.length === 0) {
    target.textContent = NO_SELECTION_TEXT;
    return;
  }
  const cols: readonly (DemoProduct | undefined)[] = [ps[0], ps[1]];

  // Figures measured under different conditions are withheld, not shown side by side (AGENTS.md §4).
  const conditions = ps[0] && ps[1] ? compareConditions(ps[0].conditions, ps[1].conditions) : null;
  const incompatible = conditions !== null && conditions.status !== 'compatible';

  const row = (name: string, fn: (p: DemoProduct) => string, conditionDependent = false): string =>
    `<div class="cell muted">${name}</div>` +
    cols
      .map((p) => {
        if (!p) return '<div class="cell">—</div>';
        if (incompatible && conditionDependent) return `<div class="cell" data-withheld>${WITHHELD_TEXT}</div>`;
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

  target.innerHTML =
    conditionNotice +
    `<div class="comparegrid"><div class="cell head">比較指標</div>` +
    cols.map((p) => `<div class="cell head">${p ? escapeHtml(p.name) : '未選択'}</div>`).join('') +
    row('価格', (p) => `${fmt(p.price)}円`) +
    row('8Ω 出力/ch', (p) => `${fmt(p.power)}W`, true) +
    row('THD+N', (p) => (p.thdn === null ? '未測定' : `${p.thdn}%`), true) +
    row('S/N', (p) => (p.snr === null ? '未測定' : `${p.snr}dB`), true) +
    row('参考適合度', utility, true) +
    row('データ充足度', (p) => `${Math.round(calculateUtility(p, weights).coverage * 100)}%`) +
    row('証拠の種類', (p) => (p.verified ? '第三者測定（架空）' : 'メーカー値のみ（架空）')) +
    row('必須機能以外の装備', (p) => p.features.map((f) => FEATURE_LABELS[f]).join('、')) +
    `</div>`;
}
