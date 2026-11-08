/**
 * CSV / JSON export builders. Pure string producers; the UI handles download.
 * Output format reproduces the v0.4 prototype exports.
 */
import { FICTIONAL_DATA_NOTICE } from './fixtures.ts';
import { METHODOLOGY_VERSION } from './methodology.ts';
import { calculateUtility } from './scoring.ts';
import type { DemoProduct, Weights } from './types.ts';

/** Column headers of the catalog CSV, in order. */
export const CATALOG_CSV_HEADER: readonly string[] = [
  '製品',
  '価格(円)',
  '8Ω出力(W/ch)',
  'THD+N(%)',
  'S/N(dB)',
  '適合度(参考)',
  'カバー率(%)',
  '第三者測定(架空)',
  '機能',
];

/**
 * RFC 4180-style serialisation: every cell is double-quoted, embedded `"`
 * doubled, rows joined with CRLF, no trailing newline. `null`/`undefined`
 * cells become empty strings. Non-string cells are stringified with `String()`.
 */
export function toCsv(rows: readonly (readonly (string | number | null | undefined)[])[]): string {
  void rows;
  throw new Error('not implemented');
}

/**
 * Catalog CSV (with UTF-8 BOM prefix `U+FEFF`) for the given, already
 * filtered/ranked products. Row cells, matching the prototype:
 * name, price, power, thdn ?? '', snr ?? '', score (toFixed(2) only when
 * `status === 'scored'`, else ''), Math.round(coverage × 100),
 * verified ? 'あり' : 'なし', features.join('|').
 */
export function buildCatalogCsv(products: readonly DemoProduct[], weights: Weights): string {
  void products;
  void weights;
  void calculateUtility;
  throw new Error('not implemented');
}

/**
 * Pretty-printed (2-space) JSON:
 * `{ notice: FICTIONAL_DATA_NOTICE, version: '0.1.0', methodologyVersion, date, weights,
 *    products: products.map(p => ({ ...p, computed: calculateUtility(p, weights) })) }`.
 * `version` is the export-format version kept from the prototype.
 */
export function buildCatalogJson(
  products: readonly DemoProduct[],
  weights: Weights,
  options: { readonly date: string },
): string {
  void products;
  void weights;
  void options;
  void FICTIONAL_DATA_NOTICE;
  void METHODOLOGY_VERSION;
  throw new Error('not implemented');
}
