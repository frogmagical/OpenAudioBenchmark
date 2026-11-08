/** Whether two price observations may be compared, and why not. */
import type { Comparability, ComparabilityReason } from '../comparability.ts';
import type { ExchangeRate, PriceObservation } from './types.ts';
import { BLOCKING_CONDITION_KEYS, CAVEAT_CONDITION_KEYS, daysBetween, ITEM_CONDITION_LABELS, PRICE_KIND_LABELS } from './rules.ts';

const BUNDLE_NONE = '（セットなし）';
const bundleText = (b: string | null): string => (b === null ? BUNDLE_NONE : b);

/**
 * Rules (all applicable reasons reported; level = strongest):
 *
 * not-comparable
 * - `amount.missing`: either amount is null.
 * - `currency.differs`: currencies differ and no rate in `rates` converts one into the other (either direction).
 * - `kind.differs`: list vs street vs sold.
 * - `condition.item-differs`: itemCondition differs (details: both labels).
 * - `condition.tax-differs`: taxIncluded true on one side and false on the other.
 * - `condition.shipping-differs`: likewise for shippingIncluded.
 * - `condition.bundle-differs`: bundle null vs non-null, or two different bundle strings.
 *
 * comparable-with-caveats
 * - `currency.converted`: currencies differ but a rate exists (details: from, to, rateId).
 * - `condition.tax-unstated` / `condition.shipping-unstated`: null on either side.
 * - `condition.coupon-applied`: couponApplied non-null on either side (details: the coupon texts).
 * - `merchant.differs`, `locale.differs`.
 * - `observed-at.gap`: observations on different calendar days (details: [days as string]); no threshold — the gap is reported, the reader judges.
 * - `zero-price`: either amount is 0 (details: the zeroPriceReason texts).
 *
 * Messages in Japanese must name the differing values (e.g. 「新品 と 中古」「税込 と 税抜」「JPY と USD」).
 */
export function explainPriceComparability(a: PriceObservation, b: PriceObservation, rates: readonly ExchangeRate[] = []): Comparability {
  const reasons: ComparabilityReason[] = [];
  const add = (code: string, message: string, details: string[]) => reasons.push({ code, message, details });
  const ac = a.conditions;
  const bc = b.conditions;
  const rate = rates.find((candidate) => (candidate.from === a.currency && candidate.to === b.currency)
    || (candidate.from === b.currency && candidate.to === a.currency));
  if (a.amount === null || b.amount === null) add('amount.missing', '金額が未観測のため比較できません', [a.id, b.id]);
  if (a.currency !== b.currency && !rate) add('currency.differs', `通貨が ${a.currency} と ${b.currency} で異なり、換算レートがありません`, [a.currency, b.currency]);
  if (a.kind !== b.kind) add('kind.differs', `価格種別が ${PRICE_KIND_LABELS[a.kind]} と ${PRICE_KIND_LABELS[b.kind]} で異なります`, [a.kind, b.kind]);
  if (ac.itemCondition !== bc.itemCondition) {
    const labels = [ITEM_CONDITION_LABELS[ac.itemCondition], ITEM_CONDITION_LABELS[bc.itemCondition]];
    add('condition.item-differs', `商品の状態が ${labels[0]} と ${labels[1]} で異なります`, labels);
  }
  const taxLabel = (value: boolean | null) => value === null ? '税条件未記録' : value ? '税込' : '税抜';
  const shippingLabel = (value: boolean | null) => value === null ? '送料条件未記録' : value ? '送料込み' : '送料別';
  if (ac.taxIncluded !== null && bc.taxIncluded !== null && ac.taxIncluded !== bc.taxIncluded) add('condition.tax-differs', `税条件が ${taxLabel(ac.taxIncluded)} と ${taxLabel(bc.taxIncluded)} で異なります`, [taxLabel(ac.taxIncluded), taxLabel(bc.taxIncluded)]);
  if (ac.shippingIncluded !== null && bc.shippingIncluded !== null && ac.shippingIncluded !== bc.shippingIncluded) add('condition.shipping-differs', `送料条件が ${shippingLabel(ac.shippingIncluded)} と ${shippingLabel(bc.shippingIncluded)} で異なります`, [shippingLabel(ac.shippingIncluded), shippingLabel(bc.shippingIncluded)]);
  if (ac.bundle !== bc.bundle) {
    add('condition.bundle-differs', `セット内容が ${bundleText(ac.bundle)} と ${bundleText(bc.bundle)} で異なります`, [bundleText(ac.bundle), bundleText(bc.bundle)]);
  }
  if (ac.locale !== bc.locale) add('condition.locale-differs', `対象地域（市場）が ${ac.locale} と ${bc.locale} で異なるため、税制・流通条件が同じとは限りません`, [ac.locale, bc.locale]);
  // Every blocking key above must be listed in BLOCKING_CONDITION_KEYS (single source of policy).
  for (const key of BLOCKING_CONDITION_KEYS) {
    if (!['itemCondition', 'taxIncluded', 'shippingIncluded', 'bundle', 'locale'].includes(key)) throw new Error(`unhandled blocking condition ${key}`);
  }
  for (const key of CAVEAT_CONDITION_KEYS) {
    if (!['couponApplied'].includes(key)) throw new Error(`unhandled caveat condition ${key}`);
  }
  const blocked = reasons.length > 0;

  if (a.currency !== b.currency && rate) add('currency.converted', `通貨 ${a.currency} と ${b.currency} の比較には ${rate.from} → ${rate.to} のレート ${rate.id} による換算が必要です`, [rate.from, rate.to, rate.id]);
  if (ac.taxIncluded === null || bc.taxIncluded === null) add('condition.tax-unstated', `税条件が ${taxLabel(ac.taxIncluded)} と ${taxLabel(bc.taxIncluded)} のため確認が必要です`, [taxLabel(ac.taxIncluded), taxLabel(bc.taxIncluded)]);
  if (ac.shippingIncluded === null || bc.shippingIncluded === null) add('condition.shipping-unstated', `送料条件が ${shippingLabel(ac.shippingIncluded)} と ${shippingLabel(bc.shippingIncluded)} のため確認が必要です`, [shippingLabel(ac.shippingIncluded), shippingLabel(bc.shippingIncluded)]);
  if (ac.couponApplied !== null || bc.couponApplied !== null) add('condition.coupon-applied', `クーポン条件は ${ac.couponApplied ?? 'なし'} と ${bc.couponApplied ?? 'なし'} です`, [ac.couponApplied, bc.couponApplied].filter((text): text is string => text !== null));
  if (a.merchant !== b.merchant) add('merchant.differs', `販売店が ${a.merchant} と ${b.merchant} で異なります`, [a.merchant, b.merchant]);
  // Calendar days refer to each recorded local date; elapsed whole days can
  // be 0 across midnight or offsets. Preserve both timestamps in the message.
  if (a.observedAt.slice(0, 10) !== b.observedAt.slice(0, 10)) {
    const days = String(daysBetween(a.observedAt, b.observedAt));
    add('observed-at.gap', `観測日時は ${a.observedAt} と ${b.observedAt} で暦日が異なります（経過した丸日数: ${days}日）`, [days]);
  }
  if (a.amount === 0 || b.amount === 0) {
    const texts = [a, b].filter((price) => price.amount === 0).map((price) => price.zeroPriceReason ?? '理由未記録');
    add('zero-price', `金額0の観測を含みます。理由: ${texts.join('、')}`, texts);
  }
  return { level: blocked ? 'not-comparable' : reasons.length ? 'comparable-with-caveats' : 'comparable', reasons };
}
