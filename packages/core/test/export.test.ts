import { describe, expect, it } from 'vitest';
import {
  buildCatalogCsv, buildCatalogJson, CATALOG_CSV_HEADER, DEMO_PRODUCTS, toCsv, WEIGHT_PRESETS,
} from '../src/index.ts';

const product = DEMO_PRODUCTS[0]!;
const weights = WEIGHT_PRESETS.balanced;
const header = '"製品","価格(円)","8Ω出力(W/ch)","THD+N(%)","S/N(dB)","適合度(参考)","カバー率(%)","第三者測定(架空)","機能"';

describe('CSV export', () => {
  it('quotes every cell, doubles quotes, preserves commas/newlines, and emits CRLF with no trailing newline', () => {
    expect(toCsv([['a,b', 'say "hello"', 'line1\nline2', 'line1\r\nline2'], [null, undefined, 0, 12.5]]))
      .toBe('"a,b","say ""hello""","line1\nline2","line1\r\nline2"\r\n"","","0","12.5"');
    expect(toCsv([])).toBe('');
  });

  it('exports the exact header, BOM, units and two decimal score', () => {
    expect(CATALOG_CSV_HEADER).toEqual([
      '製品', '価格(円)', '8Ω出力(W/ch)', 'THD+N(%)', 'S/N(dB)', '適合度(参考)', 'カバー率(%)', '第三者測定(架空)', '機能',
    ]);
    expect(buildCatalogCsv([product], weights)).toBe('\ufeff' + header + '\r\n' +
      '"Reference Amp A","46000","85","0.005","105","55.49","100","あり","hdmi|usb|bt|hp"');
    expect(buildCatalogCsv([], weights)).toBe('\ufeff' + header);
  });

  it('exports missing measurements as empty cells while scoring exactly 70 percent coverage', () => {
    const compact = DEMO_PRODUCTS.find(p => p.id === 'e')!;
    expect(buildCatalogCsv([compact], weights)).toBe('\ufeff' + header + '\r\n' +
      '"Compact Amp E","24000","40","","92","51.60","70","なし","usb|bt"');
  });

  it('omits the displayed score below threshold even when coverage rounds up to 70', () => {
    const nearBoundary = { price: 37.5, power: 49.875, thdn: 37.625, snr: 0 };
    expect(buildCatalogCsv([{ ...product, thdn: null }], nearBoundary)).toBe('\ufeff' + header + '\r\n' +
      '"Reference Amp A","46000","85","","105","","70","あり","hdmi|usb|bt|hp"');
  });

  it('preserves supplied ordering, unknown price/power and all-zero pending status', () => {
    const unknown = { ...product, name: 'Unknown', price: null, power: null, thdn: null, snr: null, features: [] };
    const csv = buildCatalogCsv([unknown, product], { price: 0, power: 0, thdn: 0, snr: 0 });
    expect(csv.split('\r\n')[1]).toBe('"Unknown","","","","","","0","あり",""');
    expect(csv.split('\r\n')[2]).toBe('"Reference Amp A","46000","85","0.005","105","","0","あり","hdmi|usb|bt|hp"');
  });
});

describe('JSON export', () => {
  it('parses back with notice, both versions, date, weights, provenance and computed results', () => {
    const text = buildCatalogJson([product], weights, { date: '2026-11-08' });
    const parsed = JSON.parse(text);
    expect(text).toBe(JSON.stringify(parsed, null, 2));
    expect(parsed).toEqual({
      notice: 'FICTIONAL DEMO DATA ONLY', version: '0.1.0', methodologyVersion: '0.4.0-demo',
      date: '2026-11-08', weights,
      products: [{ ...product, computed: {
        score: expect.closeTo(55.4924428138, 8), coverage: 1, usedWeight: 100, totalWeight: 100,
        status: 'scored', methodologyVersion: '0.4.0-demo',
        metricScores: { price: 67.5, power: expect.closeTo(6500 / 140, 8), thdn: expect.closeTo(100 * (-1 - Math.log10(0.005)) / 3, 8), snr: 70 },
      } }],
    });
  });

  it('retains unknown metrics as null and includes a version on every computed product', () => {
    const parsed = JSON.parse(buildCatalogJson(DEMO_PRODUCTS, weights, { date: 'supplied-date' }));
    expect(parsed.date).toBe('supplied-date');
    expect(parsed.products.map((p: { id: string }) => p.id)).toEqual(DEMO_PRODUCTS.map(p => p.id));
    for (const p of parsed.products) expect(p.computed.methodologyVersion).toBe('0.4.0-demo');
    expect(parsed.products[4]).toMatchObject({ thdn: null, computed: { metricScores: { thdn: null }, coverage: 0.7 } });
    expect(parsed.products[5]).toMatchObject({ snr: null, computed: { metricScores: { snr: null }, coverage: 0.8 } });
  });

  it('serializes no-score results as null and supports an empty selection', () => {
    const zero = { price: 0, power: 0, thdn: 0, snr: 0 };
    const parsed = JSON.parse(buildCatalogJson([product], zero, { date: '2026-11-08' }));
    expect(parsed.products[0].computed).toMatchObject({ score: null, coverage: 0, status: 'pending' });
    expect(JSON.parse(buildCatalogJson([], weights, { date: '2026-11-08' })).products).toEqual([]);
  });
});
