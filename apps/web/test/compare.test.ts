/** Comparison view against prepared datasets: one lineage for values, scores and reasons. */
import { beforeEach, describe, expect, it } from 'vitest';
import { DEMO_DATASET, PREPARED_DEMO_DATASET, WEIGHT_PRESETS, prepareDataset } from '@openaudiobenchmark/core';
import type { Dataset, Measurement, MeasurementConditions } from '@openaudiobenchmark/core';
import { NO_SELECTION_TEXT, WITHHELD_TEXT, renderCompare } from '../src/views/compare.ts';

const FULL: MeasurementConditions = { ...DEMO_DATASET.measurements[0]!.conditions, outputLevel: '1 W', weighting: 'A' };

/** Demo dataset with every measurement fully conditioned and with stated uncertainty, optionally modified. */
function conditioned(modify: (m: Measurement) => Measurement = (m) => m): Dataset {
  const measurements = DEMO_DATASET.measurements.map((m) =>
    modify({
      ...m,
      conditions: FULL,
      uncertainty: m.value === null ? null : { type: 'relative', plusMinusPercent: 1 },
    }),
  );
  return { ...DEMO_DATASET, measurements };
}

function cells(label: string): string[] {
  const all = Array.from(document.querySelectorAll('#comparison .cell'));
  const i = all.findIndex((c) => c.textContent === label);
  if (i < 0) throw new Error(`row ${label} not found`);
  return [all[i + 1]!.textContent!, all[i + 2]!.textContent!];
}

const reasonItems = () =>
  Array.from(document.querySelectorAll<HTMLElement>('[data-comparability] li')).map((li) => [li.dataset['metric'], li.dataset['level']]);

beforeEach(() => {
  document.body.innerHTML = '<div id="comparison"></div>';
});

describe('renderCompare', () => {
  it('shows the placeholder for no (or unknown) products', () => {
    renderCompare([], WEIGHT_PRESETS.balanced);
    expect(document.querySelector('#comparison')!.textContent).toBe(NO_SELECTION_TEXT);
    renderCompare(['nope'], WEIGHT_PRESETS.balanced);
    expect(document.querySelector('#comparison')!.textContent).toBe(NO_SELECTION_TEXT);
  });

  it('demo data: power comparable with caveats, THD+N and S/N withheld for unrecorded required conditions', () => {
    renderCompare(['a', 'b'], WEIGHT_PRESETS.balanced, PREPARED_DEMO_DATASET);
    expect(reasonItems()).toEqual([
      ['power', 'comparable-with-caveats'],
      ['thdn', 'not-comparable'],
      ['snr', 'not-comparable'],
    ]);
    expect(document.querySelector('[data-comparability] li[data-metric="thdn"]')!.textContent).toContain('出力レベル');
    expect(cells('8Ω 出力/ch')).toEqual(['85W', '100W']);
    expect(cells('THD+N')).toEqual([WITHHELD_TEXT, WITHHELD_TEXT]);
    expect(cells('S/N')).toEqual([WITHHELD_TEXT, WITHHELD_TEXT]);
    expect(cells('参考適合度')).toEqual([WITHHELD_TEXT, WITHHELD_TEXT]);
    expect(cells('価格')).toEqual(['46,000円', '34,000円']);
    expect(cells('証拠の種類')).toEqual(['第三者測定（架空）（第三者測定）', '第三者測定（架空）（第三者測定）']);
  });

  it('shows every row when the measurements are fully conditioned and comparable', () => {
    renderCompare(['a', 'b'], WEIGHT_PRESETS.balanced, prepareDataset(conditioned()));
    expect(document.querySelector('[data-comparability]')).toBeNull();
    expect(cells('THD+N')).toEqual(['0.005%', '0.0015%']);
    expect(cells('S/N')).toEqual(['105dB', '111dB']);
    expect(cells('参考適合度')[0]).toMatch(/^\d+\.\d\/100$/);
  });

  it('withholds only the metric whose own pair is incompatible, naming both values', () => {
    const ds = conditioned((m) => (m.id === 'm-b-power' ? { ...m, conditions: { ...FULL, loadOhms: 4 } } : m));
    renderCompare(['a', 'b'], WEIGHT_PRESETS.balanced, prepareDataset(ds));
    expect(cells('8Ω 出力/ch')).toEqual([WITHHELD_TEXT, WITHHELD_TEXT]);
    expect(cells('THD+N')).toEqual(['0.005%', '0.0015%']);
    expect(cells('S/N')).toEqual(['105dB', '111dB']);
    expect(cells('参考適合度')).toEqual([WITHHELD_TEXT, WITHHELD_TEXT]);
    const item = document.querySelector<HTMLElement>('[data-comparability] li[data-metric="power"]')!;
    expect(item.dataset['level']).toBe('not-comparable');
    expect(item.textContent).toContain('8 Ω');
    expect(item.textContent).toContain('4 Ω');
  });

  it('treats an absent record exactly like an explicit missing one', () => {
    const absent = conditioned();
    const dsAbsent: Dataset = { ...absent, measurements: absent.measurements.filter((m) => m.id !== 'm-b-thdn') };
    renderCompare(['a', 'b'], WEIGHT_PRESETS.balanced, prepareDataset(dsAbsent));
    const absentCells = cells('THD+N');
    const absentScore = cells('参考適合度');
    const absentItems = reasonItems();

    const dsMissing = conditioned((m) =>
      m.id === 'm-b-thdn' ? { ...m, value: null, status: 'missing', sourceId: null, uncertainty: null } : m,
    );
    renderCompare(['a', 'b'], WEIGHT_PRESETS.balanced, prepareDataset(dsMissing));
    expect(cells('THD+N')).toEqual(absentCells);
    expect(cells('参考適合度')).toEqual(absentScore);
    expect(reasonItems()).toEqual(absentItems);
    expect(absentItems).toEqual([['thdn', 'not-comparable']]);
    expect(absentScore).toEqual([WITHHELD_TEXT, WITHHELD_TEXT]);
  });

  it('labels estimate-only and mixed evidence honestly', () => {
    const ds = conditioned((m) =>
      m.productId === 'c' ? { ...m, status: 'estimated', derivation: 'デモ用の推定', sourceId: 'DEMO-MFG-003' } : m,
    );
    renderCompare(['c', 'e'], WEIGHT_PRESETS.balanced, prepareDataset(ds));
    expect(cells('証拠の種類')[0]).toContain('推定値のみ');
    expect(cells('証拠の種類')[1]).toContain('メーカー値のみ');
  });

  it('escapes product names and reason text', () => {
    const ds: Dataset = {
      ...conditioned(),
      products: DEMO_DATASET.products.map((p) => (p.id === 'a' ? { ...p, name: '<img src=x onerror="alert(1)">' } : p)),
    };
    renderCompare(['a', 'b'], WEIGHT_PRESETS.balanced, prepareDataset(ds));
    expect(document.querySelectorAll('img')).toHaveLength(0);
    expect(document.querySelector('#comparison')!.textContent).toContain('<img src=x onerror="alert(1)">');
  });

  it('refuses a dataset that fails the quality gate', () => {
    const broken: Dataset = { ...DEMO_DATASET, measurements: DEMO_DATASET.measurements.map((m) => (m.id === 'm-a-power' ? { ...m, sourceId: null } : m)) };
    expect(() => renderCompare(['a', 'b'], WEIGHT_PRESETS.balanced, prepareDataset(broken))).toThrow(/validation error/);
  });
});
