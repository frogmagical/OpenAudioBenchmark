/**
 * CSV / JSON export builders. Pure string producers; the UI handles download.
 * Output format reproduces the v0.4 prototype exports.
 */
import { FICTIONAL_DATA_NOTICE } from './fixtures.ts';
import { METHODOLOGY_VERSION } from './methodology.ts';
import { calculateUtility } from './scoring.ts';
import type { DemoProduct, UtilityResult, Weights } from './types.ts';

/** Column headers of the catalog CSV, in order. */
/**
 * Export-format version. 0.1.0 was the prototype's `{coverage, score}` shape; 0.2.0 added status,
 * metric scores, provenance and methodologyVersion; 0.3.0 withholds `score` below the coverage gate
 * and adds `provisionalScore`.
 */
export const CATALOG_JSON_VERSION = '0.3.0' as const;

/**
 * Utility result as published in the JSON export. `score` is `null` unless the
 * product passed the coverage gate (methodology 0.5.0-demo); the number the
 * ranking uses internally is exposed separately as `provisionalScore`.
 */
export interface ExportedUtility extends Omit<UtilityResult, 'score'> {
  readonly score: number | null;
  /** Internal ordering value, present even when `score` is withheld. Not a published rating. */
  readonly provisionalScore: number | null;
}

export function toExportedUtility(result: UtilityResult): ExportedUtility {
  return {
    ...result,
    score: result.status === 'scored' ? result.score : null,
    provisionalScore: result.score,
  };
}

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
  return rows.map(row => row.map(cell => '"' + csvText(cell).replace(/"/g, '""') + '"').join(',')).join('\r\n');
}

/** Leading characters that spreadsheets interpret as a formula even inside a quoted cell. */
const FORMULA_PREFIX = /^[=+\-@\t\r]/;

/**
 * Text of one cell. String cells that start with a formula trigger are prefixed with
 * a single quote so spreadsheet software shows them literally; numbers are untouched.
 */
function csvText(cell: string | number | null | undefined): string {
  if (cell === null || cell === undefined) return '';
  if (typeof cell === 'number') return String(cell);
  return FORMULA_PREFIX.test(cell) ? `'${cell}` : cell;
}

/**
 * Catalog CSV (with UTF-8 BOM prefix `U+FEFF`) for the given, already
 * filtered/ranked products. Row cells, matching the prototype:
 * name, price, power, thdn ?? '', snr ?? '', score (toFixed(2) only when
 * `status === 'scored'`, else ''), Math.round(coverage × 100),
 * verified ? 'あり' : 'なし', features.join('|').
 */
export function buildCatalogCsv(products: readonly DemoProduct[], weights: Weights): string {
  const rows = products.map(product => {
    const result = calculateUtility(product, weights);
    return [
      product.name, product.price, product.power, product.thdn, product.snr,
      result.status === 'scored' && result.score !== null ? result.score.toFixed(2) : '',
      Math.round(result.coverage * 100), product.verified ? 'あり' : 'なし', product.features.join('|'),
    ];
  });
  return '\ufeff' + toCsv([CATALOG_CSV_HEADER, ...rows]);
}

/**
 * Pretty-printed (2-space) JSON:
 * `{ notice: FICTIONAL_DATA_NOTICE, version: CATALOG_JSON_VERSION, methodologyVersion, date, weights,
 *    products: products.map(p => ({ ...p, computed: toExportedUtility(calculateUtility(p, weights)) })) }`.
 * `version` is the export-format version (see CATALOG_JSON_VERSION).
 */
export function buildCatalogJson(
  products: readonly DemoProduct[],
  weights: Weights,
  options: { readonly date: string },
): string {
  return JSON.stringify({
    notice: FICTIONAL_DATA_NOTICE,
    version: CATALOG_JSON_VERSION,
    methodologyVersion: METHODOLOGY_VERSION,
    date: options.date,
    weights,
    products: products.map(product => ({ ...product, computed: toExportedUtility(calculateUtility(product, weights)) })),
  }, null, 2);
}
