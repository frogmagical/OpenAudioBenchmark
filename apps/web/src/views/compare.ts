/** Comparison view (02): up to two products side by side, same metrics, same conditions. */
import { FEATURE_LABELS, calculateUtility, compareConditions } from '@openaudiobenchmark/core';
import type { DemoProduct, Weights } from '@openaudiobenchmark/core';
import { escapeHtml, qs } from '../dom.ts';
import { fmt } from '../format.ts';

export const NO_SELECTION_TEXT = 'まだ製品が選択されていません。';

export function renderCompare(ps: readonly DemoProduct[], weights: Weights): void {
  const target = qs('#comparison');
  if (ps.length === 0) {
    target.textContent = NO_SELECTION_TEXT;
    return;
  }
  const cols: readonly (DemoProduct | undefined)[] = [ps[0], ps[1]];
  const row = (name: string, fn: (p: DemoProduct) => string): string =>
    `<div class="cell muted">${name}</div>` +
    cols.map((p) => `<div class="cell">${p ? escapeHtml(fn(p)) : '—'}</div>`).join('');

  const utility = (p: DemoProduct): string => {
    const u = calculateUtility(p, weights);
    return u.status === 'scored' && u.score !== null ? `${u.score.toFixed(1)}/100` : '比較保留';
  };

  let conditionNotice = '';
  if (ps[0] && ps[1]) {
    const cmp = compareConditions(ps[0].conditions, ps[1].conditions);
    if (!cmp.compatible) {
      conditionNotice =
        `<div class="notice" data-condition-mismatch>測定条件が一致しないため、数値の直接比較はできません（不一致: ${cmp.mismatches
          .map(escapeHtml)
          .join('、')}）。</div>`;
    }
  }

  target.innerHTML =
    conditionNotice +
    `<div class="comparegrid"><div class="cell head">比較指標</div>` +
    cols.map((p) => `<div class="cell head">${p ? escapeHtml(p.name) : '未選択'}</div>`).join('') +
    row('価格', (p) => `${fmt(p.price)}円`) +
    row('8Ω 出力/ch', (p) => `${fmt(p.power)}W`) +
    row('THD+N', (p) => (p.thdn === null ? '未測定' : `${p.thdn}%`)) +
    row('S/N', (p) => (p.snr === null ? '未測定' : `${p.snr}dB`)) +
    row('参考適合度', utility) +
    row('データ充足度', (p) => `${Math.round(calculateUtility(p, weights).coverage * 100)}%`) +
    row('証拠の種類', (p) => (p.verified ? '第三者測定（架空）' : 'メーカー値のみ（架空）')) +
    row('必須機能以外の装備', (p) => p.features.map((f) => FEATURE_LABELS[f]).join('、')) +
    `</div>`;
}
