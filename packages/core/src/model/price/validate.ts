/** Validation of price observations and exchange rates. */
import { isBlank, isCalendarDate } from '../common.ts';
import type { Product, QualityIssue, Source } from '../types.ts';
import type { ExchangeRate, PriceObservation } from './types.ts';
import { CURRENCIES } from './types.ts';
import { isIsoDateTimeWithOffset } from './rules.ts';

export interface PriceValidationInput {
  readonly observations: readonly PriceObservation[];
  readonly rates: readonly ExchangeRate[];
  readonly products: readonly Product[];
  readonly sources: readonly Source[];
}

/**
 * Pure validation; never mutates. Paths: `prices[i]`, `rates[i]`. `relatedIds` lists the ids involved.
 *
 * Errors:
 * - `price.duplicate-id`, `price.id-empty`, `rate.duplicate-id`, `rate.id-empty`.
 * - `price.unknown-product`, `price.unknown-source`, `rate.unknown-source`.
 * - `price.amount-invalid`: amount is non-finite or negative.
 * - `price.zero-reason-required`: `amount === 0` with `zeroPriceReason` null/blank.
 * - `price.zero-reason-forbidden`: `zeroPriceReason` set while `amount !== 0` (including null).
 * - `price.currency-unsupported`: currency not in `CURRENCIES`.
 * - `price.observed-at-invalid`: `observedAt` fails `isIsoDateTimeWithOffset`.
 * - `price.merchant-empty`, `price.locale-empty`: empty/blank strings.
 * - `price.blank-text`: `couponApplied`, `bundle`, `notes` or `zeroPriceReason` is an empty/blank string (use null).
 * - `price.version-invalid`: not a positive integer.
 * - `price.list-from-non-manufacturer`: `kind === 'list'` whose source `kind` is not `manufacturer`.
 *   First source wins for duplicate ids; kind checks skip ambiguous ids. Dataset validation reports duplicates.
 * - `rate.value-invalid`: rate non-finite or ≤ 0.  `rate.same-currency`: from === to.
 * - `rate.date-invalid`: `rateDate` not a calendar date (YYYY-MM-DD, real date).
 * - `rate.currency-unsupported`.
 * - `rate.method-empty`: method is null, undefined or blank.
 *
 * Warnings:
 * - `price.tax-unstated`, `price.shipping-unstated`: amount is observed and the corresponding flag is `null`.
 * - `price.amount-missing`: `amount === null` (recorded as unobservable; informational).
 * - `price.product-without-prices`: a product with no observation at all (one per product).
 *
 * Order: observations in input order, then rates, then product warnings. Deterministic.
 */
export function validatePriceObservations(input: PriceValidationInput): QualityIssue[] {
  const issues: QualityIssue[] = [];
  const products = new Set(input.products.map((product) => product.id));
  const sources = new Map<string, Source>();
  const duplicateSourceIds = new Set<string>();
  for (const source of input.sources) {
    if (sources.has(source.id)) duplicateSourceIds.add(source.id);
    else sources.set(source.id, source);
  }
  const observedProducts = new Set(input.observations.map((price) => price.productId));
  const priceIds = new Set<string>();
  const rateIds = new Set<string>();
  const add = (code: string, severity: QualityIssue['severity'], path: string, message: string, relatedIds: string[]) => {
    issues.push({ code, severity, path, message, relatedIds });
  };

  input.observations.forEach((price, index) => {
    const path = `prices[${index}]`;
    const error = (code: string, message: string, ids = [price.id]) => add(code, 'error', path, message, ids);
    const warning = (code: string, message: string) => add(code, 'warning', path, message, [price.id]);
    if (isBlank(price.id)) error('price.id-empty', '価格観測のIDが空白です');
    if (priceIds.has(price.id)) error('price.duplicate-id', `価格観測ID ${price.id} が重複しています`);
    priceIds.add(price.id);
    if (!products.has(price.productId)) error('price.unknown-product', `製品 ${price.productId} が見つかりません`, [price.id, price.productId]);
    const source = sources.get(price.sourceId);
    if (!source) error('price.unknown-source', `出典 ${price.sourceId} が見つかりません`, [price.id, price.sourceId]);
    if (price.amount !== null && (!Number.isFinite(price.amount) || price.amount < 0)) error('price.amount-invalid', '金額は有限の非負数または未観測（null）で記録してください');
    if (price.amount === 0 && !price.zeroPriceReason?.trim()) error('price.zero-reason-required', '金額0には無償である理由が必要です');
    if (price.amount !== 0 && price.zeroPriceReason !== null) error('price.zero-reason-forbidden', '金額0以外には無償の理由を設定できません');
    if (!CURRENCIES.includes(price.currency)) error('price.currency-unsupported', `通貨 ${price.currency} は未対応です`);
    if (!isIsoDateTimeWithOffset(price.observedAt)) error('price.observed-at-invalid', '観測日時には有効なオフセット付きISO日時が必要です');
    if (isBlank(price.merchant)) error('price.merchant-empty', '販売店名が空白です');
    if (isBlank(price.conditions.locale)) error('price.locale-empty', '価格の対象地域が空白です');
    for (const [key, value] of [
      ['couponApplied', price.conditions.couponApplied], ['bundle', price.conditions.bundle],
      ['notes', price.notes], ['zeroPriceReason', price.zeroPriceReason],
    ] as const) {
      if (isBlank(value)) error('price.blank-text', `${key} は空白ではなくnullで記録してください`);
    }
    if (!Number.isInteger(price.version) || price.version <= 0) error('price.version-invalid', '版番号は正の整数で記録してください');
    if (price.kind === 'list' && source && !duplicateSourceIds.has(source.id) && source.kind !== 'manufacturer') {
      error('price.list-from-non-manufacturer', `メーカー希望小売価格の出典 ${source.id} はメーカーではありません`, [price.id, source.id]);
    }
    if (price.amount !== null) {
      if (price.conditions.taxIncluded === null) warning('price.tax-unstated', '税込・税抜の条件が未記録です');
      if (price.conditions.shippingIncluded === null) warning('price.shipping-unstated', '送料込みかどうか未記録です');
    }
    if (price.amount === null) warning('price.amount-missing', '金額が未観測です（0とは異なります）');
  });

  input.rates.forEach((rate, index) => {
    const path = `rates[${index}]`;
    const error = (code: string, message: string, ids = [rate.id]) => add(code, 'error', path, message, ids);
    if (isBlank(rate.id)) error('rate.id-empty', '為替レートのIDが空白です');
    if (rateIds.has(rate.id)) error('rate.duplicate-id', `為替レートID ${rate.id} が重複しています`);
    rateIds.add(rate.id);
    if (!sources.has(rate.sourceId)) error('rate.unknown-source', `出典 ${rate.sourceId} が見つかりません`, [rate.id, rate.sourceId]);
    if (!Number.isFinite(rate.rate) || rate.rate <= 0) error('rate.value-invalid', '為替レートは有限の正数で記録してください');
    if (rate.from === rate.to) error('rate.same-currency', `同じ通貨 ${rate.from} 同士の為替レートは設定できません`);
    if (!isCalendarDate(rate.rateDate)) error('rate.date-invalid', 'レート適用日は実在する日付（YYYY-MM-DD）で記録してください');
    if (rate.method == null || isBlank(rate.method)) error('rate.method-empty', '為替レートの算出方法が未記録または空白です');
    if (!CURRENCIES.includes(rate.from) || !CURRENCIES.includes(rate.to)) error('rate.currency-unsupported', `通貨 ${rate.from} → ${rate.to} は未対応です`);
  });
  input.products.forEach((product, index) => {
    if (!observedProducts.has(product.id)) add('price.product-without-prices', 'warning', `products[${index}]`, `製品 ${product.id} に価格観測がありません`, [product.id]);
  });
  return issues;
}

/** True when no `error` issue is reported. */
export function arePricesUsable(input: PriceValidationInput): boolean {
  return !validatePriceObservations(input).some((issue) => issue.severity === 'error');
}
