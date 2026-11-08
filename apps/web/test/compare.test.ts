/** Comparison view with synthetic fixtures: condition mismatch must withhold, not compare. */
import { beforeEach, describe, expect, it } from 'vitest';
import { DEMO_PRODUCTS, WEIGHT_PRESETS } from '@openaudiobenchmark/core';
import type { DemoProduct } from '@openaudiobenchmark/core';
import { WITHHELD_TEXT, renderCompare } from '../src/views/compare.ts';

const a = DEMO_PRODUCTS[0]!;
const b = DEMO_PRODUCTS[1]!;

function cells(label: string): string[] {
  const all = Array.from(document.querySelectorAll('#comparison .cell'));
  const i = all.findIndex((c) => c.textContent === label);
  if (i < 0) throw new Error(`row ${label} not found`);
  return [all[i + 1]!.textContent!, all[i + 2]!.textContent!];
}

beforeEach(() => {
  document.body.innerHTML = '<div id="comparison"></div>';
});

describe('renderCompare', () => {
  it('compares two products measured under the same conditions', () => {
    renderCompare([a, b], WEIGHT_PRESETS.balanced);
    expect(document.querySelector('[data-condition-mismatch]')).toBeNull();
    expect(cells('8Ω 出力/ch')).toEqual(['85W', '100W']);
    expect(cells('THD+N')).toEqual(['0.005%', '0.0015%']);
    expect(cells('参考適合度')[0]).toMatch(/^\d+\.\d\/100$/);
  });

  it('withholds condition-dependent rows when measurement conditions differ', () => {
    const b4: DemoProduct = { ...b, conditions: { ...b.conditions, loadOhms: 4 } };
    renderCompare([a, b4], WEIGHT_PRESETS.balanced);
    const notice = document.querySelector('[data-condition-mismatch]');
    expect(notice?.textContent).toContain('loadOhms');
    expect(cells('8Ω 出力/ch')).toEqual([WITHHELD_TEXT, WITHHELD_TEXT]);
    expect(cells('THD+N')).toEqual([WITHHELD_TEXT, WITHHELD_TEXT]);
    expect(cells('S/N')).toEqual([WITHHELD_TEXT, WITHHELD_TEXT]);
    expect(cells('参考適合度')).toEqual([WITHHELD_TEXT, WITHHELD_TEXT]);
    // Price and provenance are not measurement-condition dependent and stay visible.
    expect(cells('価格')).toEqual(['46,000円', '34,000円']);
    expect(cells('証拠の種類')[0]).toContain('第三者測定');
  });

  it('treats an unrecorded condition on one side as a mismatch', () => {
    const rest: DemoProduct['conditions'] = { channelsDriven: 2, bandwidthHz: [20, 20000], method: 'demo-assumed-identical' };
    renderCompare([a, { ...b, conditions: rest }], WEIGHT_PRESETS.balanced);
    expect(document.querySelector('[data-condition-mismatch]')?.getAttribute('data-condition-mismatch')).toBe('incompatible');
    expect(cells('8Ω 出力/ch')).toEqual([WITHHELD_TEXT, WITHHELD_TEXT]);
  });

  it('withholds when neither product records any condition (unknown is not identical)', () => {
    renderCompare([{ ...a, conditions: {} }, { ...b, conditions: {} }], WEIGHT_PRESETS.balanced);
    const notice = document.querySelector('[data-condition-mismatch]');
    expect(notice?.getAttribute('data-condition-mismatch')).toBe('undetermined');
    expect(notice?.textContent).toContain('記録されていない');
    expect(cells('S/N')).toEqual([WITHHELD_TEXT, WITHHELD_TEXT]);
  });

  it('escapes product names and sources', () => {
    const hostile: DemoProduct = { ...a, name: '<img src=x onerror="alert(1)">', features: [] };
    renderCompare([hostile], WEIGHT_PRESETS.balanced);
    expect(document.querySelectorAll('img')).toHaveLength(0);
    expect(document.querySelector('#comparison')!.textContent).toContain('<img src=x onerror="alert(1)">');
  });
});
