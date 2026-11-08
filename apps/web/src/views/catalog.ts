/**
 * Catalog view (01): filters, weight sliders, ranked records, selection for
 * comparison and CSV/JSON export. All numbers come from @openaudiobenchmark/core;
 * this module only renders and wires events.
 */
import {
  FEATURE_LABELS,
  METRIC_KEYS,
  METRIC_LABELS,
  PREPARED_DEMO_DATASET,
  STATUS_LABELS,
  WEIGHT_PRESETS,
  buildCatalogCsv,
  buildCatalogJson,
  calculateUtility,
  filterProducts,
  metricScore,
  projectProduct,
  rankProducts,
  toDemoProduct,
  weightPercentages,
} from '@openaudiobenchmark/core';
import type { DemoProduct, FeatureKey, PreparedDataset, PresetKey, Weights } from '@openaudiobenchmark/core';
import { escapeHtml, qs, qsa } from '../dom.ts';
import { download } from '../download.ts';
import { fmt, fmtDb, fmtPercent, todayIso } from '../format.ts';
import { renderCompare } from './compare.ts';

export interface CatalogController {
  /** Products currently visible, in ranked order. */
  visibleProducts(): DemoProduct[];
  /** Selected products (max 2) in selection order. */
  selectedProducts(): DemoProduct[];
  weights(): Readonly<Weights>;
  render(): void;
}

const DEFAULT_PRESET: PresetKey = 'balanced';
const DEFAULT_BUDGET = 100000;

function isPresetKey(value: string): value is PresetKey {
  return Object.prototype.hasOwnProperty.call(WEIGHT_PRESETS, value);
}

/**
 * Per-metric provenance for the record details: evidence status, source and
 * quality warnings, taken from the dataset projection (never from the score).
 */
function provenanceHtml(prepared: PreparedDataset, productId: string): string {
  const dataset = prepared.dataset;
  const projection = projectProduct(prepared, productId);
  const rows = METRIC_KEYS.map((k) => {
    const m = projection.metrics[k];
    const source = m.sourceId ? dataset.sources.find((s) => s.id === m.sourceId) : undefined;
    const sourceText = source ? `${escapeHtml(source.id)}（${escapeHtml(source.publisher)}）` : '出典なし';
    return `<li data-metric="${k}" data-status="${m.status}">${METRIC_LABELS[k]}：${STATUS_LABELS[m.status]} ／ ${sourceText}</li>`;
  }).join('');
  const warnings = projection.issues
    .map((i) => `<li data-issue="${escapeHtml(i.code)}">${escapeHtml(i.message)}</li>`)
    .join('');
  return (
    `<p style="margin-top:11px">指標ごとの証拠種別と出典</p><ul class="provenance">${rows}</ul>` +
    (warnings ? `<p>データ品質の注意</p><ul class="quality-issues">${warnings}</ul>` : '') +
    `<p><button type="button" class="inline-link" data-go="sources">出典と測定根拠の一覧を見る →</button></p>`
  );
}

/**
 * The catalog renders one prepared dataset. Product values are projected from
 * its measurements, so displayed numbers, scores and provenance share one lineage.
 */
export function initCatalog(prepared: PreparedDataset = PREPARED_DEMO_DATASET): CatalogController {
  const products: readonly DemoProduct[] = prepared.dataset.products.map((p) => toDemoProduct(prepared, p.id));
  let weights: Weights = { ...WEIGHT_PRESETS[DEFAULT_PRESET] };
  let selected: string[] = [];

  const presetEl = qs<HTMLSelectElement>('#preset');
  const budgetEl = qs<HTMLInputElement>('#budget');
  const verifiedEl = qs<HTMLInputElement>('#verified');
  const slidersEl = qs('#sliders');
  const recordsEl = qs('#records');
  const countEl = qs('#resultCount');
  const featureEls = qsa<HTMLInputElement>('.feature');

  const list = (): DemoProduct[] => {
    // Parity with v0.4 (`+value || Infinity`): empty, 0 or non-numeric = no limit; a negative budget excludes everything.
    const budget = Number(budgetEl.value) || null;
    const needed = featureEls.filter((e) => e.checked).map((e) => e.value as FeatureKey);
    const filtered = filterProducts(products, {
      budgetMax: budget,
      requiredFeatures: needed,
      verifiedOnly: verifiedEl.checked,
    });
    return rankProducts(filtered, weights);
  };

  const selectedProducts = (): DemoProduct[] =>
    selected.map((id) => products.find((p) => p.id === id)).filter((p): p is DemoProduct => p !== undefined);

  const updateSliderOutputs = (): void => {
    const pct = weightPercentages(weights);
    for (const k of METRIC_KEYS) qs(`#w_${k}_pct`).textContent = `${pct[k]}%`;
  };

  const renderSliders = (): void => {
    slidersEl.innerHTML = METRIC_KEYS.map(
      (k) =>
        `<div class="weighttitle"><label for="w_${k}">${METRIC_LABELS[k]}</label><output id="w_${k}_pct" for="w_${k}"></output></div>` +
        `<input class="slider" type="range" min="0" max="100" step="5" id="w_${k}" value="${weights[k]}">`,
    ).join('');
    updateSliderOutputs();
    for (const k of METRIC_KEYS) {
      // Update the percentages in place so the slider being adjusted keeps keyboard focus.
      qs<HTMLInputElement>(`#w_${k}`).addEventListener('input', (e) => {
        weights = { ...weights, [k]: Number((e.target as HTMLInputElement).value) };
        updateSliderOutputs();
        render();
      });
    }
  };

  const record = (p: DemoProduct): string => {
    const u = calculateUtility(p, weights);
    const shown = u.status === 'scored' && u.score !== null;
    const coveragePct = Math.round(u.coverage * 100);
    const isSelected = selected.includes(p.id);
    const breakdown = METRIC_KEYS.map((k) => {
      const s = metricScore(p, k);
      return `<li>${METRIC_LABELS[k]}：${s === null ? '未測定' : `${s.toFixed(1)}点`}（重み ${weights[k]}）</li>`;
    }).join('');
    return (
      `<article class="panel record" data-product-id="${escapeHtml(p.id)}">` +
      `<div class="recordhead"><div><h4>${escapeHtml(p.name)}</h4><div class="desc">${escapeHtml(p.subtitle)} · デモ製品</div></div>` +
      `<div class="score"><b>${shown ? u.score!.toFixed(1) : '—'}</b><span>${shown ? '参考適合度 / 100' : '比較保留'}</span></div></div>` +
      `<div class="metrics">` +
      `<div class="metric"><small>参考価格</small><b>${fmt(p.price)}円</b></div>` +
      `<div class="metric"><small>8Ω 定格出力/ch</small><b>${fmt(p.power)} W</b></div>` +
      `<div class="metric"><small>THD+N</small><b>${fmtPercent(p.thdn)}</b></div>` +
      `<div class="metric"><small>S/N</small><b>${fmtDb(p.snr)}</b></div></div>` +
      `<div class="tags">${p.features.map((f) => `<span class="tag">${FEATURE_LABELS[f]}</span>`).join('')}` +
      `<span class="tag ${p.verified ? 'good' : 'warn'}">${p.verified ? '第三者測定あり（架空）' : '公称値中心（架空）'}</span></div>` +
      `<div class="recordfoot"><div class="evidence"><div class="bar" aria-label="データ充足度"><span style="width:${coveragePct}%"></span></div>指標カバー率 ${coveragePct}%</div>` +
      `<button class="btn ${isSelected ? 'accent' : ''}" data-select="${escapeHtml(p.id)}">${isSelected ? '選択済み ✓' : '比較に追加'}</button></div>` +
      `<details class="details"><summary>根拠データと評価内訳を表示</summary><p>各指標の正規化値（100点満点）</p><ul>${breakdown}</ul>` +
      `<p style="margin-top:11px">出典・測定証跡：${p.sources.map(escapeHtml).join(' ／ ')}</p>` +
      provenanceHtml(prepared, p.id) +
      `<p>※実データではありません。将来版では出典URL、測定日、測定条件、証拠種類、変更履歴を表示します。</p></details></article>`
    );
  };

  const render = (): void => {
    const arr = list();
    countEl.textContent = `比較結果 · ${arr.length}製品`;
    recordsEl.innerHTML = arr.length
      ? arr.map(record).join('')
      : '<div class="panel empty">条件に一致する製品はありません。予算や必須機能を変更してください。</div>';
    renderCompare(selected, weights, prepared);
  };

  recordsEl.addEventListener('click', (e) => {
    const button = (e.target as HTMLElement).closest<HTMLElement>('[data-select]');
    if (!button) return;
    const id = button.dataset['select'];
    if (!id) return;
    // Toggle; at most two products stay selected (the newest replaces the oldest).
    selected = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected.slice(-1), id];
    render();
  });

  qs('#csv').addEventListener('click', () => {
    download('open-audio-demo.csv', 'text/csv;charset=utf-8', buildCatalogCsv(list(), weights));
  });
  qs('#json').addEventListener('click', () => {
    download(
      'open-audio-demo.json',
      'application/json;charset=utf-8',
      buildCatalogJson(list(), weights, { date: todayIso(), dataset: prepared }),
    );
  });

  presetEl.addEventListener('change', () => {
    const key = presetEl.value;
    weights = { ...WEIGHT_PRESETS[isPresetKey(key) ? key : DEFAULT_PRESET] };
    renderSliders();
    render();
  });
  budgetEl.addEventListener('input', render);
  for (const el of featureEls) el.addEventListener('change', render);
  verifiedEl.addEventListener('change', render);

  qs('#reset').addEventListener('click', () => {
    presetEl.value = DEFAULT_PRESET;
    weights = { ...WEIGHT_PRESETS[DEFAULT_PRESET] };
    budgetEl.value = String(DEFAULT_BUDGET);
    for (const el of featureEls) el.checked = false;
    verifiedEl.checked = false;
    selected = [];
    renderSliders();
    render();
  });

  renderSliders();
  render();

  return {
    visibleProducts: list,
    selectedProducts,
    weights: () => weights,
    render,
  };
}
