/**
 * Sources and evidence view (06, Phase 2 P2-3C). Everything shown here is
 * read from the prepared dataset projection: sources, per-metric evidence
 * status, measurement conditions, uncertainty and the data-quality warnings
 * that the gate attached. No number is typed in twice.
 */
import {
  CONDITION_KEYS,
  CONDITION_LABELS,
  METRIC_KEYS,
  METRIC_LABELS,
  METRIC_UNITS,
  PREPARED_DEMO_DATASET,
  STATUS_LABELS,
  formatConditionValue,
  projectProduct,
} from '@openaudiobenchmark/core';
import type { MeasurementConditions, MeasurementStatus, PreparedDataset, Source, Uncertainty } from '@openaudiobenchmark/core';
import { escapeHtml, qs } from '../dom.ts';

export const SOURCE_KIND_LABELS: Readonly<Record<Source['kind'], string>> = {
  'independent-lab': '第三者測定機関',
  manufacturer: 'メーカー',
  retailer: '販売店',
  editorial: '編集・レビュー媒体',
  other: 'その他',
};

export const STATUS_DESCRIPTIONS: Readonly<Record<MeasurementStatus, string>> = {
  observed: '独立した第三者による測定値',
  manufacturer: 'メーカーが公表した仕様値（測定条件が明示されない場合がある）',
  estimated: '他の値から導出した推定値（導出方法を記録）',
  missing: '値が存在しない。0点でも満点でもなく「不明」',
};

function pill(status: MeasurementStatus): string {
  return `<span class="status-pill" data-status="${status}">${STATUS_LABELS[status]}</span>`;
}

function formatUncertainty(u: Uncertainty | null): string {
  if (u === null) return '未記録';
  switch (u.type) {
    case 'absolute':
      return `±${u.plusMinus} ${u.unit}`;
    case 'relative':
      return `±${u.plusMinusPercent} %`;
    case 'range':
      return `${u.low}〜${u.high} ${u.unit}`;
  }
}

function conditionsList(conditions: MeasurementConditions): string {
  const recorded = CONDITION_KEYS.filter((k) => conditions[k] !== undefined);
  if (recorded.length === 0) return '<span class="small">未記録</span>';
  return `<ul class="conditions-list">${recorded
    .map((k) => `<li>${CONDITION_LABELS[k]}: ${escapeHtml(formatConditionValue(k, conditions))}</li>`)
    .join('')}</ul>`;
}

function link(url: string | null): string {
  if (url === null || url.trim() === '') return '<span class="small">未記録</span>';
  const safe = /^https?:\/\//i.test(url) ? url : null;
  return safe ? `<a href="${escapeHtml(safe)}" rel="noopener noreferrer" target="_blank">${escapeHtml(safe)}</a>` : escapeHtml(url);
}

export function renderSources(prepared: PreparedDataset = PREPARED_DEMO_DATASET): void {
  const target = qs('#sourcesView');
  const { dataset } = prepared;
  const citations = new Map<string, number>();
  for (const m of dataset.measurements) if (m.sourceId) citations.set(m.sourceId, (citations.get(m.sourceId) ?? 0) + 1);

  const legend = `<div class="legend" aria-label="証拠種別の凡例">${(Object.keys(STATUS_DESCRIPTIONS) as MeasurementStatus[])
    .map((s) => `<span>${pill(s)}<small>${STATUS_DESCRIPTIONS[s]}</small></span>`)
    .join('')}</div>`;

  const sourcesTable =
    `<h3 class="sources-heading">出典一覧<small>${dataset.sources.length} 件。URL・ライセンス・取得日を記録します。</small></h3>` +
    `<div class="table-scroll"><table class="data-table" id="sourcesTable"><thead><tr><th>ID</th><th>種別</th><th>発行元</th><th>URL</th><th>公開日</th><th>取得日</th><th>ライセンス</th><th>参照数</th><th>備考</th></tr></thead><tbody>` +
    dataset.sources
      .map(
        (s) =>
          `<tr data-source-id="${escapeHtml(s.id)}"><td>${escapeHtml(s.id)}</td><td>${SOURCE_KIND_LABELS[s.kind]}</td><td>${escapeHtml(s.publisher)}</td><td>${link(s.url)}</td>` +
          `<td class="num">${s.publishedAt ? escapeHtml(s.publishedAt) : '未記録'}</td><td class="num">${escapeHtml(s.accessedAt)}</td><td>${s.license ? escapeHtml(s.license) : '未記録'}</td>` +
          `<td class="num">${citations.get(s.id) ?? 0}</td><td>${s.notes ? escapeHtml(s.notes) : ''}</td></tr>`,
      )
      .join('') +
    `</tbody></table></div>`;

  const rows = dataset.products.flatMap((p) => {
    const projection = projectProduct(prepared, p.id);
    return METRIC_KEYS.map((k, i) => {
      const m = projection.metrics[k];
      const record = m.measurementId ? dataset.measurements.find((x) => x.id === m.measurementId) : undefined;
      const value =
        record && record.value !== null ? `${escapeHtml(String(record.value))} ${escapeHtml(record.unit)}` : '未測定';
      const canonical = METRIC_UNITS[k].canonical;
      const converted = record && record.value !== null && record.unit !== canonical && m.derived.value !== null ? `<br><span class="small">→ ${m.derived.value} ${canonical}（換算）</span>` : '';
      const warnings = m.issues.map((i) => `<li>${escapeHtml(i.message)}</li>`).join('');
      return (
        `<tr data-product-id="${escapeHtml(p.id)}" data-metric="${k}" data-status="${m.status}">` +
        (i === 0 ? `<th scope="rowgroup" rowspan="${METRIC_KEYS.length}">${escapeHtml(p.name)}<br><span class="small">${escapeHtml(p.maker)}${p.revision ? ` / ${escapeHtml(p.revision)}` : ''}</span></th>` : '') +
        `<td>${METRIC_LABELS[k]}</td><td class="num">${value}${converted}</td><td>${pill(m.status)}</td><td>${m.sourceId ? escapeHtml(m.sourceId) : '—'}</td>` +
        `<td>${record ? conditionsList(record.conditions) : '—'}</td><td>${record ? formatUncertainty(record.uncertainty) : '—'}</td>` +
        `<td>${warnings ? `<ul class="conditions-list">${warnings}</ul>` : '<span class="small">なし</span>'}</td></tr>`
      );
    });
  });
  const evidenceTable =
    `<h3 class="sources-heading">製品別の測定根拠<small>指標ごとに値・証拠種別・出典・測定条件・不確かさ・品質の注意を示します。</small></h3>` +
    legend +
    `<div class="table-scroll"><table class="data-table" id="evidenceTable"><thead><tr><th>製品</th><th>指標</th><th>記録値</th><th>証拠種別</th><th>出典</th><th>測定条件</th><th>不確かさ</th><th>品質の注意</th></tr></thead><tbody>${rows.join('')}</tbody></table></div>`;

  const grouped = new Map<string, { message: string; count: number }>();
  for (const w of prepared.warnings) {
    const g = grouped.get(w.code) ?? { message: w.message, count: 0 };
    g.count += 1;
    grouped.set(w.code, g);
  }
  const issues =
    `<h3 class="sources-heading">データ品質の注意<small>品質ゲートの検証結果。エラーがあるデータは表示されません（現在 ${prepared.errors.length} 件）。</small></h3>` +
    (grouped.size === 0
      ? '<p class="small">注意事項はありません。</p>'
      : `<div class="table-scroll"><table class="data-table" id="issuesTable"><thead><tr><th>コード</th><th>件数</th><th>内容（例）</th></tr></thead><tbody>${[...grouped.entries()]
          .map(([code, g]) => `<tr data-issue-code="${escapeHtml(code)}"><td><code>${escapeHtml(code)}</code></td><td class="num issue-count">${g.count}</td><td>${escapeHtml(g.message)}</td></tr>`)
          .join('')}</tbody></table></div>`);

  target.innerHTML = sourcesTable + evidenceTable + issues;
}
