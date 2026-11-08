/**
 * Sources and evidence view (06, Phase 2 P2-3C). Everything shown here is
 * read from the prepared dataset projection: sources, per-metric evidence
 * status, measurement conditions, uncertainty and the data-quality warnings
 * that the gate attached. No number is typed in twice.
 */
import {
  CONDITION_KEYS,
  CONDITION_LABELS,
  METRIC_CATEGORIES,
  METRIC_IDS,
  METRIC_UNITS,
  PREPARED_DEMO_DATASET,
  STATUS_LABELS,
  formatConditionValue,
  projectProduct,
} from '@openaudiobenchmark/core';
import type { MeasurementConditions, MeasurementStatus, MetricId, PreparedDataset, Product, ReusePermission, Source, Uncertainty } from '@openaudiobenchmark/core';
import { escapeHtml, qs } from '../dom.ts';
import { fmt } from '../format.ts';

/** Metric names as the catalog and comparison views print them (not the scoring-direction labels). */
const METRIC_NAMES: Readonly<Record<MetricId, string>> = {
  price: '価格',
  power: '出力（8Ω）',
  thdn: 'THD+N',
  snr: 'S/N',
  sensitivity: '感度',
  nominalImpedance: '公称インピーダンス',
  minimumImpedance: '最小インピーダンス',
  crossoverFrequency: 'クロスオーバー周波数',
};

export const REUSE_LABELS: Readonly<Record<ReusePermission, string>> = {
  allowed: '引用可',
  'allowed-with-attribution': '引用可（出典表示）',
  'permitted-by-law-or-terms': '法令・規約で可',
  unknown: '未確認',
  prohibited: '不可',
};

/** Metrics that make sense for a product's category (schema 1.1, METRIC_CATEGORIES). */
export function metricsForProduct(p: Product): MetricId[] {
  return METRIC_IDS.filter((m) => METRIC_CATEGORIES[m].includes(p.category));
}

function formatRecorded(value: number, unit: string): string {
  if (unit === 'JPY') return `${fmt(value)}円`;
  return `${Number.isInteger(value) ? value : Number(value.toPrecision(6))} ${unit}`;
}

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
  const trimmed = url?.trim() ?? '';
  if (trimmed === '') return '<span class="small">未記録</span>';
  // Only http(s) becomes a link; anything else is shown as text and marked as not linked.
  if (/^https?:\/\//i.test(trimmed)) return `<a href="${escapeHtml(trimmed)}" rel="noopener noreferrer" target="_blank">${escapeHtml(trimmed)}</a>`;
  return `${escapeHtml(trimmed)} <span class="small">（リンク化しない形式）</span>`;
}

export function renderSources(prepared: PreparedDataset = PREPARED_DEMO_DATASET): void {
  const target = qs('#sourcesView');
  const { dataset } = prepared;
  const citations = new Map<string, number>();
  for (const m of dataset.measurements) if (m.sourceId) citations.set(m.sourceId, (citations.get(m.sourceId) ?? 0) + 1);
  for (const r of dataset.references ?? []) citations.set(r.sourceId, (citations.get(r.sourceId) ?? 0) + 1);
  for (const r of dataset.ranges ?? []) citations.set(r.sourceId, (citations.get(r.sourceId) ?? 0) + 1);

  const sourceIssues = (id: string): string => {
    const list = (prepared.issuesById.get(id) ?? []).filter((i) => i.severity === 'warning');
    return list.length ? `<ul class="issue-list">${list.map((i) => `<li data-issue="${escapeHtml(i.code)}">${escapeHtml(i.message)}</li>`).join('')}</ul>` : '<span class="small">なし</span>';
  };

  const legend = `<ul class="legend" role="list" aria-label="証拠種別の凡例">${(Object.keys(STATUS_DESCRIPTIONS) as MeasurementStatus[])
    .map((s) => `<li>${pill(s)}<small>${STATUS_DESCRIPTIONS[s]}</small></li>`)
    .join('')}</ul>`;

  const sourcesTable =
    `<h3 class="sources-heading">出典一覧<small>${dataset.sources.length} 件。URL・ライセンス・取得日を記録します。</small></h3>` +
    `<div class="table-scroll"><table class="data-table" id="sourcesTable"><thead><tr><th scope="col" class="id">ID</th><th scope="col">種別</th><th scope="col">発行元</th><th scope="col">URL</th><th scope="col">公開日</th><th scope="col">取得日</th><th scope="col">ライセンス</th><th scope="col">区分</th><th scope="col">数値引用の許諾</th><th scope="col">参照数</th><th scope="col">備考</th><th scope="col">品質の注意</th></tr></thead><tbody>` +
    dataset.sources
      .map(
        (s) =>
          `<tr data-source-id="${escapeHtml(s.id)}"><td class="id">${escapeHtml(s.id)}</td><td>${SOURCE_KIND_LABELS[s.kind] ?? escapeHtml(s.kind)}</td><td>${escapeHtml(s.publisher)}</td><td>${link(s.url)}</td>` +
          `<td class="num">${s.publishedAt ? escapeHtml(s.publishedAt) : '未記録'}</td><td class="num">${escapeHtml(s.accessedAt)}</td><td>${s.license ? escapeHtml(s.license) : '未記録'}</td>` +
          `<td>${s.tier === 'primary' ? '一次' : '二次'}</td><td data-reuse="${escapeHtml(s.reuse.quoteFacts)}">${REUSE_LABELS[s.reuse.quoteFacts] ?? escapeHtml(String(s.reuse.quoteFacts))}${s.reuse.checkedAt ? `<br><span class="small">確認 ${escapeHtml(s.reuse.checkedAt)}</span>` : ''}</td>` +
          `<td class="num">${citations.get(s.id) ?? 0}</td><td>${s.notes ? escapeHtml(s.notes) : ''}</td>` +
          `<td>${sourceIssues(s.id)}</td></tr>`,
      )
      .join('') +
    `</tbody></table></div>`;

  const productIssues = (id: string): string => {
    const list = (prepared.issuesById.get(id) ?? []).filter((i) => i.severity === 'warning');
    return list.length ? `<ul class="issue-list">${list.map((i) => `<li data-issue="${escapeHtml(i.code)}">${escapeHtml(i.message)}</li>`).join('')}</ul>` : '';
  };

  const bodies = dataset.products.map((p) => {
    const projection = projectProduct(prepared, p.id);
    const metricList = metricsForProduct(p);
    const rows = metricList.map((k, i) => {
      const m = projection.metrics[k];
      const record = m.measurementId ? dataset.measurements.find((x) => x.id === m.measurementId) : undefined;
      const present = record !== undefined && record.value !== null && m.status !== 'missing';
      const canonical = METRIC_UNITS[k].canonical;
      const value = present ? formatRecorded(record.value as number, record.unit) : '未測定';
      const converted =
        present && record.unit !== canonical && m.derived.value !== null
          ? `<br><span class="small">→ ${formatRecorded(Number(m.derived.value.toPrecision(6)), canonical)}（換算）</span>`
          : '';
      // Estimated values: the derivation text is the evidence; show it with the status.
      const derivation = present && record.status === 'estimated' && record.derivation ? `<div class="small" data-derivation>導出: ${escapeHtml(record.derivation)}</div>` : '';
      const meta = present
        ? `<div class="small">${record.capturedAt ? `測定日 ${escapeHtml(record.capturedAt)} ／ ` : ''}版 ${record.version}${record.notes ? ` ／ ${escapeHtml(record.notes)}` : ''}</div>`
        : '';
      const warnings = m.issues.map((w) => `<li data-issue="${escapeHtml(w.code)}">${escapeHtml(w.message)}</li>`).join('');
      return (
        `<tr data-product-id="${escapeHtml(p.id)}" data-metric="${k}" data-status="${m.status}">` +
        (i === 0
          ? `<th scope="rowgroup" rowspan="${metricList.length}">${escapeHtml(p.name)}<br><span class="small">${escapeHtml(p.maker)}${p.revision ? ` / ${escapeHtml(p.revision)}` : ''}</span>${productIssues(p.id)}</th>`
          : '') +
        `<td>${METRIC_NAMES[k]}</td><td class="num">${value}${converted}</td><td>${pill(m.status)}${derivation}${meta}</td><td class="id">${present && m.sourceId ? escapeHtml(m.sourceId) : '—'}</td>` +
        `<td>${present ? conditionsList(record.conditions) : '—'}</td><td>${present ? formatUncertainty(record.uncertainty) : '—'}</td>` +
        `<td>${warnings ? `<ul class="issue-list">${warnings}</ul>` : '<span class="small">なし</span>'}</td></tr>`
      );
    });
    // Value-less references (D-16 / G5): the figure exists at the source; we point to it and show nothing numeric.
    const refRows = (dataset.references ?? [])
      .filter((r) => r.productId === p.id)
      .map((r) => {
        const src = dataset.sources.find((x) => x.id === r.sourceId);
        return (
          `<tr data-product-id="${escapeHtml(p.id)}" data-reference-id="${escapeHtml(r.id)}" data-status="reference">` +
          `<td>${METRIC_NAMES[r.metric]}</td><td class="num">出典で確認${src ? `<br>${link(src.url)}` : ''}</td>` +
          `<td><span class="status-pill" data-status="${r.status}">${STATUS_LABELS[r.status]}</span><div class="small">所在のみ（数値は未保存）: ${r.quantities.map(escapeHtml).join('、')}</div></td>` +
          `<td class="id">${escapeHtml(r.sourceId)}</td><td>${conditionsList(r.conditions)}</td><td>—</td><td><span class="small">数値の利用条件が未確認のため所在のみ</span></td></tr>`
        );
      });
    // Range specifications (D-07): kept as one record with tolerance and conditions.
    const rangeRows = (dataset.ranges ?? [])
      .filter((r) => r.productId === p.id)
      .map(
        (r) =>
          `<tr data-product-id="${escapeHtml(p.id)}" data-range-id="${escapeHtml(r.id)}" data-status="${r.status}">` +
          `<td>周波数範囲</td><td class="num">${r.lowHz}–${r.highHz} Hz（${r.toleranceKind === 'minus' ? `${r.toleranceDb} dB` : `±${r.toleranceDb} dB`}）</td>` +
          `<td>${pill(r.status)}<div class="small">版 ${r.version}${r.capturedAt ? ` ／ 測定日 ${escapeHtml(r.capturedAt)}` : ''}</div></td>` +
          `<td class="id">${escapeHtml(r.sourceId)}</td><td>${conditionsList(r.conditions)}</td><td>—</td><td><span class="small">なし</span></td></tr>`,
      );
    const allRows = [...rows, ...refRows, ...rangeRows];
    // The product header spans every row of this product.
    allRows[0] = allRows[0]!.replace(`rowspan="${metricList.length}"`, `rowspan="${allRows.length}"`);
    return `<tbody data-product-id="${escapeHtml(p.id)}">${allRows.join('')}</tbody>`;
  });
  const evidenceTable =
    `<h3 class="sources-heading">製品別の測定根拠<small>指標ごとに値・証拠種別・出典・測定条件・不確かさ・品質の注意を示します。</small></h3>` +
    legend +
    `<div class="table-scroll"><table class="data-table" id="evidenceTable"><thead><tr><th scope="col">製品</th><th scope="col">指標</th><th scope="col">記録値</th><th scope="col">証拠種別</th><th scope="col">出典</th><th scope="col">測定条件</th><th scope="col">不確かさ</th><th scope="col">品質の注意</th></tr></thead>${bodies.join('')}</table></div>`;

  const grouped = new Map<string, { message: string; count: number }>();
  for (const w of prepared.warnings) {
    const g = grouped.get(w.code) ?? { message: w.message, count: 0 };
    g.count += 1;
    grouped.set(w.code, g);
  }
  const issues =
    `<h3 class="sources-heading">データ品質の注意<small>品質ゲートの検証結果。エラーを含むデータセットは画面に表示されないため、ここに並ぶのは警告のみです。</small></h3>` +
    (grouped.size === 0
      ? '<p class="small">注意事項はありません。</p>'
      : `<div class="table-scroll"><table class="data-table" id="issuesTable"><thead><tr><th scope="col">コード</th><th scope="col">件数</th><th scope="col">内容（例）</th></tr></thead><tbody>${[...grouped.entries()]
          .map(([code, g]) => `<tr data-issue-code="${escapeHtml(code)}"><td><code>${escapeHtml(code)}</code></td><td class="num issue-count">${g.count}</td><td>${escapeHtml(g.message)}</td></tr>`)
          .join('')}</tbody></table></div>`);

  target.innerHTML = sourcesTable + evidenceTable + issues;
}
