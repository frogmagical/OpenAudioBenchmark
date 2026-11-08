/** Comparison view with synthetic fixtures: condition mismatch must withhold, not compare. */
import { beforeEach, describe, expect, it } from 'vitest';
import { DEMO_DATASET, DEMO_PRODUCTS, WEIGHT_PRESETS } from '@openaudiobenchmark/core';
import type { Dataset, DemoProduct, Measurement } from '@openaudiobenchmark/core';
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
  it('compares two products measured under the same conditions and explains the caveats per metric', () => {
    renderCompare([a, b], WEIGHT_PRESETS.balanced);
    expect(document.querySelector('[data-condition-mismatch]')).toBeNull();
    // Demo data: power is fully conditioned but unstated uncertainty is a caveat; THD+N and S/N lack required conditions → withheld.
    const items = Array.from(document.querySelectorAll<HTMLElement>('[data-comparability] li'));
    expect(items.map((li) => [li.dataset['metric'], li.dataset['level']])).toEqual([
      ['power', 'comparable-with-caveats'],
      ['thdn', 'not-comparable'],
      ['snr', 'not-comparable'],
    ]);
    expect(items[1]!.textContent).toContain('outputLevel');
    expect(cells('THD+N')).toEqual([WITHHELD_TEXT, WITHHELD_TEXT]);
    expect(cells('S/N')).toEqual([WITHHELD_TEXT, WITHHELD_TEXT]);
    expect(cells('参考適合度')).toEqual([WITHHELD_TEXT, WITHHELD_TEXT]);
    expect(cells('8Ω 出力/ch')).toEqual(['85W', '100W']);
  });

  it('shows every condition-dependent row when the measurements are fully conditioned and comparable', () => {
    const full = { ...DEMO_DATASET.measurements[0]!.conditions, outputLevel: '1 W', weighting: 'A' as const };
    const measurements: Measurement[] = DEMO_DATASET.measurements.map((m) => ({
      ...m,
      conditions: full,
      uncertainty: m.value === null ? null : { type: 'relative', plusMinusPercent: 1 },
    }));
    const ds: Dataset = { ...DEMO_DATASET, measurements };
    renderCompare([a, b], WEIGHT_PRESETS.balanced, ds);
    expect(document.querySelector('[data-comparability]')).toBeNull();
    expect(cells('8Ω 出力/ch')).toEqual(['85W', '100W']);
    expect(cells('THD+N')).toEqual(['0.005%', '0.0015%']);
    expect(cells('S/N')).toEqual(['105dB', '111dB']);
    expect(cells('参考適合度')[0]).toMatch(/^\d+\.\d\/100$/);
  });

  it('withholds only the metric whose measurements are incompatible, with the reason', () => {
    const full = { ...DEMO_DATASET.measurements[0]!.conditions, outputLevel: '1 W', weighting: 'A' as const };
    const measurements: Measurement[] = DEMO_DATASET.measurements.map((m) => ({
      ...m,
      conditions: m.id === 'm-b-power' ? { ...full, loadOhms: 4 } : full,
      uncertainty: m.value === null ? null : { type: 'relative', plusMinusPercent: 1 },
    }));
    renderCompare([a, b], WEIGHT_PRESETS.balanced, { ...DEMO_DATASET, measurements });
    expect(cells('8Ω 出力/ch')).toEqual([WITHHELD_TEXT, WITHHELD_TEXT]);
    expect(cells('THD+N')).toEqual(['0.005%', '0.0015%']);
    expect(cells('参考適合度')).toEqual([WITHHELD_TEXT, WITHHELD_TEXT]);
    const item = document.querySelector<HTMLElement>('[data-comparability] li[data-metric="power"]')!;
    expect(item.dataset['level']).toBe('not-comparable');
    expect(item.textContent).toContain('測定条件が一致しない');
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
