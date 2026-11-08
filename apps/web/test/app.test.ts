/**
 * Smoke test of the real UI module running against the real markup in jsdom.
 * Layout (overflow, breakpoints) is not measurable here; see the PR notes for
 * what remains to be verified in a browser.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { METHODOLOGY_VERSION } from '@openaudiobenchmark/core';
import { initApp } from '../src/app.ts';
import type { App } from '../src/app.ts';
import { INVALID_INPUT_TEXT } from '../src/views/pairing.ts';
import { KNOWN_LIMITS } from '../src/views/methodology.ts';
import { NO_SELECTION_TEXT } from '../src/views/compare.ts';
import html from '../index.html?raw';

const body = html.split('<body>')[1]!.split('<script')[0]!;

let app: App;
let downloads: Blob[];

function el<T extends Element = HTMLElement>(selector: string): T {
  const found = document.querySelector<T>(selector);
  if (!found) throw new Error(`missing ${selector}`);
  return found;
}

function fire(target: Element, type: string): void {
  target.dispatchEvent(new Event(type, { bubbles: true }));
}

function setValue(selector: string, value: string, type: 'input' | 'change' = 'input'): void {
  const input = el<HTMLInputElement | HTMLSelectElement>(selector);
  input.value = value;
  fire(input, type);
}

function setChecked(selector: string, checked: boolean): void {
  const box = el<HTMLInputElement>(selector);
  box.checked = checked;
  fire(box, 'change');
}

function records(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>('#records .record'));
}

function recordNames(): string[] {
  return records().map((r) => r.querySelector('h4')!.textContent!);
}

async function lastDownloadText(): Promise<string> {
  const blob = downloads.at(-1);
  if (!blob) throw new Error('no download captured');
  return blob.text();
}

beforeEach(() => {
  document.body.innerHTML = body;
  history.replaceState(null, '', '#');
  downloads = [];
  window.scrollTo = vi.fn();
  URL.createObjectURL = vi.fn((blob: Blob) => {
    downloads.push(blob);
    return 'blob:mock';
  });
  URL.revokeObjectURL = vi.fn();
  // jsdom does not implement navigation; a bare anchor click would only log.
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  app = initApp();
});

describe('navigation', () => {
  it('renders six views with the overview active and a six-item sidebar', () => {
    const views = Array.from(document.querySelectorAll<HTMLElement>('.view'));
    expect(views.map((v) => v.dataset['view'])).toEqual([
      'overview',
      'benchmark',
      'compare',
      'pairing',
      'methodology',
      'principles',
    ]);
    expect(views.filter((v) => v.classList.contains('active')).map((v) => v.id)).toEqual(['overview']);
    expect(views.filter((v) => !v.hidden).map((v) => v.id)).toEqual(['overview']);
    expect(document.querySelectorAll('.app-sidebar .menu-button')).toHaveLength(6);
    expect(el('.app-sidebar').getAttribute('aria-label')).toBeTruthy();
  });

  it('switches view, aria-current, breadcrumb and hash when a menu button is clicked', () => {
    el('.menu-button[data-go="pairing"]').click();
    expect(el('#pairing').classList.contains('active')).toBe(true);
    expect(el<HTMLElement>('#pairing').hidden).toBe(false);
    expect(el<HTMLElement>('#overview').hidden).toBe(true);
    expect(el('.menu-button[data-go="pairing"]').getAttribute('aria-current')).toBe('page');
    expect(el('.menu-button[data-go="overview"]').hasAttribute('aria-current')).toBe(false);
    expect(el('#currentView').textContent).toBe('相性診断');
    expect(location.hash).toBe('#pairing');
  });

  it('falls back to the overview for an unknown view name', () => {
    location.hash = '#nope';
    window.dispatchEvent(new Event('hashchange'));
    expect(el('#overview').classList.contains('active')).toBe(true);
    expect(location.hash).toBe('#overview');
  });

  it('overview entry buttons navigate too', () => {
    el('.entry[data-go="compare"]').click();
    expect(el('#compare').classList.contains('active')).toBe(true);
  });
});

describe('catalog', () => {
  it('lists all six fictional products, each labelled as demo data', () => {
    expect(el('#nproducts').textContent).toBe('6');
    expect(el('#resultCount').textContent).toBe('比較結果 · 6製品');
    expect(records()).toHaveLength(6);
    for (const r of records()) {
      expect(r.textContent).toContain('デモ製品');
      expect(r.textContent).toContain('架空');
    }
  });

  it('shows 未測定 instead of a number for missing metrics', () => {
    const e = records().find((r) => r.dataset['productId'] === 'e')!;
    const thd = Array.from(e.querySelectorAll('.metric')).find((m) => m.textContent!.includes('THD+N'))!;
    expect(thd.textContent).toContain('未測定');
    expect(thd.textContent).not.toMatch(/\b0\b/);
  });

  it('shows per-metric evidence status, source and data-quality warnings in the details', () => {
    const e = records().find((r) => r.dataset['productId'] === 'e')!;
    const rows = Array.from(e.querySelectorAll<HTMLElement>('.provenance li'));
    expect(rows.map((r) => r.dataset['status'])).toEqual(['manufacturer', 'manufacturer', 'missing', 'manufacturer']);
    expect(rows[2]!.textContent).toContain('未測定');
    expect(rows[2]!.textContent).toContain('出典なし');
    expect(rows[0]!.textContent).toContain('DEMO-MFG-005');
    const a = records().find((r) => r.dataset['productId'] === 'a')!;
    expect(a.querySelector('.provenance li[data-metric="power"]')!.textContent).toContain('第三者測定');
    expect(a.querySelector('.provenance li[data-metric="price"]')!.textContent).toContain('メーカー公称');
    const issues = Array.from(a.querySelectorAll<HTMLElement>('.quality-issues li')).map((li) => li.dataset['issue']);
    expect(issues).toEqual(['measurement.required-condition-unrecorded', 'measurement.required-condition-unrecorded']);
    expect(a.querySelector('.quality-issues')!.textContent).toContain('outputLevel');
  });

  it('filters by budget, required features and third-party verification', () => {
    setValue('#budget', '30000');
    expect(recordNames()).toEqual(['Compact Amp E']);

    setValue('#budget', '100000');
    setChecked('.feature[value="phono"]', true);
    expect(recordNames().sort()).toEqual(['Classic Amp F', 'Living Amp C']);

    setChecked('.feature[value="phono"]', false);
    setChecked('#verified', true);
    expect(recordNames().sort()).toEqual(['Drive Amp D', 'Reference Amp A', 'Studio Amp B']);

    setChecked('#verified', false);
    setValue('#budget', '10000');
    expect(records()).toHaveLength(0);
    expect(el('#records').textContent).toContain('条件に一致する製品はありません');
  });

  it('applies presets and slider edits to the displayed weight percentages', () => {
    const sliderValues = () =>
      ['price', 'power', 'thdn', 'snr'].map((k) => Number(el<HTMLInputElement>(`#w_${k}`).value));
    expect(sliderValues()).toEqual([25, 25, 30, 20]);

    setValue('#preset', 'budget', 'change');
    expect(sliderValues()).toEqual([65, 10, 15, 10]);
    expect(app.catalog.weights()).toEqual({ price: 65, power: 10, thdn: 15, snr: 10 });

    setValue('#w_price', '0');
    const outputs = Array.from(document.querySelectorAll('#sliders output')).map((o) => o.textContent);
    expect(outputs[0]).toBe('0%');
    const total = outputs.reduce((sum, t) => sum + Number(t!.replace('%', '')), 0);
    expect(total).toBeGreaterThanOrEqual(99);
    expect(total).toBeLessThanOrEqual(101);
  });

  it('ranks the balanced preset in the order implied by the formulas', () => {
    // Hand-computed from the v0.4 normalisation with balanced weights (25/25/30/20), e.g.
    // A: price 67.5, power 46.4, THD+N 43.4, S/N 70 → 55.5; C: 85, 39.3, 33.3, 56 → 52.3.
    // F lacks S/N (80 % coverage) and E lacks THD+N (70 % coverage) but both stay above the 70 % gate.
    expect(recordNames()).toEqual([
      'Studio Amp B',
      'Drive Amp D',
      'Classic Amp F',
      'Reference Amp A',
      'Living Amp C',
      'Compact Amp E',
    ]);
    const scores = records().map((r) => r.querySelector('.score b')!.textContent);
    expect(scores).toEqual(['69.5', '66.0', '56.6', '55.5', '52.3', '51.6']);
  });

  it('shows 比較保留 instead of a score once coverage drops below 70 %', () => {
    const scoreOf = (id: string) => records().find((r) => r.dataset['productId'] === id)!.querySelector('.score')!.textContent;
    expect(scoreOf('e')).toContain('参考適合度 / 100');
    // Move weight onto THD+N, which Compact Amp E lacks: E's coverage falls to 30/55 ≈ 55 %.
    setValue('#w_thdn', '45');
    setValue('#w_price', '0');
    setValue('#w_power', '0');
    setValue('#w_snr', '10');
    expect(scoreOf('e')).toBe('—比較保留');
    expect(scoreOf('a')).toContain('参考適合度 / 100');
    expect(records().at(-1)!.dataset['productId']).toBe('e');
  });

  it('keeps keyboard focus on the slider being adjusted and updates its percentage in place', () => {
    el('.menu-button[data-go="benchmark"]').click();
    const slider = el<HTMLInputElement>('#w_price');
    slider.focus();
    expect(document.activeElement).toBe(slider);
    setValue('#w_price', '45');
    expect(document.activeElement).toBe(slider);
    expect(el<HTMLInputElement>('#w_price').isConnected).toBe(true);
    expect(el('#w_price_pct').textContent).toBe(`${Math.round((45 / 120) * 100)}%`);
    expect(app.catalog.weights().price).toBe(45);
  });

  it('treats an empty or zero budget as no limit and a negative budget as excluding everything (v0.4 parity)', () => {
    setValue('#budget', '');
    expect(records()).toHaveLength(6);
    setValue('#budget', '0');
    expect(records()).toHaveLength(6);
    setValue('#budget', '-1');
    expect(records()).toHaveLength(0);
  });

  it('keeps at most two selected products and renders them side by side', () => {
    const select = (id: string) => el(`[data-select="${id}"]`).click();
    expect(el('#comparison').textContent).toBe(NO_SELECTION_TEXT);

    select('a');
    let heads = Array.from(document.querySelectorAll('#comparison .cell.head')).map((c) => c.textContent);
    expect(heads).toEqual(['比較指標', 'Reference Amp A', '未選択']);

    select('b');
    heads = Array.from(document.querySelectorAll('#comparison .cell.head')).map((c) => c.textContent);
    expect(heads).toEqual(['比較指標', 'Reference Amp A', 'Studio Amp B']);

    select('e');
    heads = Array.from(document.querySelectorAll('#comparison .cell.head')).map((c) => c.textContent);
    expect(heads).toEqual(['比較指標', 'Studio Amp B', 'Compact Amp E']);
    expect(el('#comparison').textContent).toContain('未測定');
    expect(document.querySelectorAll('[data-select].accent')).toHaveLength(2);

    select('e');
    expect(app.catalog.selectedProducts().map((p) => p.id)).toEqual(['b']);
  });

  it('exports the visible products as CSV (with BOM) and JSON (with notice and methodology version)', async () => {
    setValue('#budget', '40000');
    const visible = app.catalog.visibleProducts().length;
    expect(visible).toBe(3);

    el('#csv').click();
    // blob.text() strips the BOM while decoding, so check the raw bytes.
    const bytes = new Uint8Array(await downloads.at(-1)!.arrayBuffer());
    expect(Array.from(bytes.slice(0, 3))).toEqual([0xef, 0xbb, 0xbf]);
    const csv = await lastDownloadText();
    const lines = csv.split('\r\n');
    expect(lines).toHaveLength(visible + 1);
    expect(lines[0]).toBe('"製品","価格(円)","8Ω出力(W/ch)","THD+N(%)","S/N(dB)","適合度(参考)","カバー率(%)","第三者測定(架空)","機能"');
    // Compact Amp E, balanced weights: price 95.0, power 14.29, S/N 44.0 → (25·95 + 25·14.29 + 20·44) / 70 = 51.60; THD+N missing → ''.
    expect(lines).toContain('"Compact Amp E","24000","40","","92","51.60","70","なし","usb|bt"');

    el('#json').click();
    const json = JSON.parse(await lastDownloadText()) as {
      notice: string;
      methodologyVersion: string;
      date: string;
      products: { id: string; computed: { coverage: number } }[];
    };
    expect(json.notice).toBe('FICTIONAL DEMO DATA ONLY');
    expect(json.methodologyVersion).toBe(METHODOLOGY_VERSION);
    expect(json.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(json.products).toHaveLength(visible);
    const e = json.products.find((p) => p.id === 'e') as unknown as {
      thdn: unknown;
      fictional: unknown;
      computed: { coverage: number; status: string };
    };
    expect(e.computed.coverage).toBe(0.7);
    expect(e.computed.status).toBe('scored');
    expect(e.thdn).toBeNull();
    expect(e.fictional).toBe(true);
  });

  it('reset restores the defaults', () => {
    el('[data-select="e"]').click();
    setValue('#budget', '30000');
    setChecked('#verified', true);
    expect(records()).toHaveLength(0);
    el('#reset').click();
    expect(el<HTMLInputElement>('#budget').value).toBe('100000');
    expect(el<HTMLInputElement>('#verified').checked).toBe(false);
    expect(records()).toHaveLength(6);
    expect(el('#comparison').textContent).toBe(NO_SELECTION_TEXT);
  });
});

describe('pairing', () => {
  const hero = () => el('#pairResult .pair-hero');
  const heroTitle = () => el('#pairResult .pair-hero-title');
  const card = (name: string) => el(`#pairResult [data-card="${name}"]`);

  it('renders the default case as positive (blue) with a text label and two pending sub-cards', () => {
    expect(el('#pairResult').getAttribute('aria-live')).toBe('polite');
    expect(hero().dataset['verdict']).toBe('positive');
    expect(heroTitle().textContent).toBe('出力に余裕あり');
    expect(heroTitle().classList.contains('pair-positive')).toBe(true);
    expect(card('output').querySelector('.pair-result-value')!.textContent).toBe('+5.8 dB');
    for (const name of ['load', 'band']) {
      const value = card(name).querySelector('.pair-result-value')!;
      expect(card(name).dataset['verdict']).toBe('pending');
      expect(value.textContent).toBe('判定保留');
      expect(value.classList.contains('pair-neutral')).toBe(true);
    }
    expect(el('#pairResult .pair-method').tagName).toBe('DETAILS');
    expect(document.querySelectorAll('#pairResult .pair-result-card')).toHaveLength(3);
    expect(el('#pairResult').textContent).toContain('22.5 W');
  });

  it('shows pending (black), never negative, when the 4 Ω output is unknown', () => {
    setValue('#pairAmp', 'e');
    setValue('#pairSpeaker', 's3');
    expect(hero().dataset['verdict']).toBe('pending');
    expect(heroTitle().textContent).toBe('判定保留');
    expect(heroTitle().classList.contains('pair-neutral')).toBe(true);
    expect(heroTitle().classList.contains('pair-negative')).toBe(false);
    expect(card('output').querySelector('.pair-result-value')!.textContent).toBe('判定保留');
    expect(el('#pairResult').textContent).toContain('未測定');
  });

  it('shows negative (red) when the required power exceeds the available output', () => {
    setValue('#pairAmp', 'e');
    setValue('#pairSpeaker', 's1');
    setValue('#pairDistance', '8');
    setValue('#pairPeak', '115');
    setValue('#pairGain', '0');
    setValue('#pairMargin', '6');
    expect(hero().dataset['verdict']).toBe('negative');
    expect(heroTitle().textContent).toBe('出力不足のおそれ');
    expect(heroTitle().classList.contains('pair-negative')).toBe(true);
    expect(card('output').querySelector('.pair-result-value')!.textContent).toMatch(/^-\d+\.\d dB$/);
  });

  it('shows neutral (black) for 0–3 dB of headroom', () => {
    // Easy Speaker E (90 dB) + Compact Amp E (40 W): tune the distance so headroom lands in [0, 3).
    setValue('#pairAmp', 'e');
    setValue('#pairSpeaker', 's2');
    setValue('#pairPeak', '100');
    setValue('#pairMargin', '3');
    setValue('#pairGain', '3');
    // required = 10^((100+3-90+20·log10(1.75)-3)/10) ≈ 30.6 W → headroom ≈ +1.2 dB → neutral.
    setValue('#pairDistance', '1.75');
    expect(hero().dataset['verdict']).toBe('neutral');
    expect(heroTitle().textContent).toBe('必要出力を満たす');
    expect(heroTitle().classList.contains('pair-neutral')).toBe(true);
  });

  it('rejects out-of-range distance and peak SPL with a notice instead of a verdict', () => {
    setValue('#pairDistance', '0.4');
    expect(el('#pairResult').textContent).toContain(INVALID_INPUT_TEXT);
    expect(document.querySelector('#pairResult .pair-hero')).toBeNull();

    setValue('#pairDistance', '1.5');
    setValue('#pairPeak', '116');
    expect(el('#pairResult').textContent).toContain(INVALID_INPUT_TEXT);

    setValue('#pairPeak', '95');
    expect(hero().dataset['verdict']).toBe('positive');
  });
});

describe('methodology and accessibility basics', () => {
  it('shows the methodology version and the known-limits list', () => {
    const block = el('#methodology [data-methodology-version]');
    expect(block.dataset['methodologyVersion']).toBe(METHODOLOGY_VERSION);
    expect(block.querySelectorAll('li')).toHaveLength(KNOWN_LIMITS.length);
    expect(KNOWN_LIMITS.length).toBeGreaterThanOrEqual(5);
    expect(block.textContent).toContain(METHODOLOGY_VERSION);
    expect(block.textContent).toContain('架空');
  });

  it('every form control has an associated label', () => {
    const controls = Array.from(document.querySelectorAll<HTMLElement>('input, select'));
    expect(controls.length).toBeGreaterThan(10);
    for (const control of controls) {
      const labelled =
        (control.id !== '' && document.querySelector(`label[for="${control.id}"]`) !== null) ||
        control.closest('label') !== null;
      expect(labelled, `${control.tagName}#${control.id || control.className}`).toBe(true);
    }
  });

  it('marks demo data in the sidebar, header and overview', () => {
    expect(el('.sidebar-foot').textContent).toContain('架空');
    expect(el('.header-meta').textContent).toContain('SAMPLE DATA');
    expect(el('#overview .demo-label').textContent).toBe('DEMO DATA');
  });
});
