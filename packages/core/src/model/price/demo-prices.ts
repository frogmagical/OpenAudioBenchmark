/** FICTIONAL / 架空の価格観測と為替レート。実製品・実売価格・実際の為替相場ではありません。 */
import { DEMO_DATASET } from '../demo-dataset.ts';
import type { Source } from '../types.ts';
import type { ExchangeRate, PriceObservation } from './types.ts';

export const DEMO_PRICE_SOURCES: Source[] = ['001', '002'].map((suffix) => ({
  id: `DEMO-RETAIL-${suffix}`, publisher: `Demo Retail ${suffix}（架空）`, kind: 'retailer',
  url: null, publishedAt: null, accessedAt: '2026-11-08', license: null, archiveRef: null,
  notes: 'FICTIONAL / 架空の販売店資料。価格・条件・参考為替レートは動作確認専用であり、実際の取引には使えません。',
}));

function street(productId: string, suffix: string, amount: number | null, patch: Partial<PriceObservation> = {}): PriceObservation {
  return {
    id: `demo-price-${productId}-${suffix}`, productId, merchant: 'Demo Retail 001（架空）',
    amount, currency: 'JPY', kind: 'street', observedAt: '2026-11-08T09:00:00+09:00',
    conditions: { itemCondition: 'new', taxIncluded: true, shippingIncluded: true, couponApplied: null, bundle: null, locale: 'JP' },
    zeroPriceReason: null, sourceId: 'DEMO-RETAIL-001', version: 1,
    notes: 'FICTIONAL / 架空の価格観測。実製品の価格や購入条件を示すものではありません。', ...patch,
  };
}

// FICTIONAL: only products with an existing DEMO-MFG price source get list
// observations. The lab-sourced legacy prices for b/d are not relabelled.
const listPrices: PriceObservation[] = DEMO_DATASET.products.flatMap((product) => {
  const price = DEMO_DATASET.measurements.find((measurement) => measurement.productId === product.id
    && measurement.metric === 'price' && measurement.sourceId?.startsWith('DEMO-MFG-'));
  if (!price?.sourceId) return [];
  // An MSRP has no shipping term: recorded as unstated (null), which the validator reports as a warning.
  return [street(product.id, 'list', price.value, {
    kind: 'list', sourceId: price.sourceId, merchant: 'Demo Audio（架空）',
    conditions: { itemCondition: 'new', taxIncluded: true, shippingIncluded: null, couponApplied: null, bundle: null, locale: 'JP' },
  })];
});

const streets: PriceObservation[] = [
  street('a', 'street', 42000),
  // US market, pre-tax display: a realistic cross-market pair that is NOT comparable with the JP street price.
  street('a', 'usd', 280, {
    currency: 'USD', sourceId: 'DEMO-RETAIL-002', merchant: 'Demo Retail 002（架空）',
    conditions: { itemCondition: 'new', taxIncluded: false, shippingIncluded: true, couponApplied: null, bundle: null, locale: 'US' },
  }),
  street('b', 'street', 33000),
  street('b', 'used', 21000, { conditions: { itemCondition: 'used', taxIncluded: true, shippingIncluded: true, couponApplied: null, bundle: null, locale: 'JP' } }),
  street('c', 'coupon', 29000, { conditions: { itemCondition: 'new', taxIncluded: true, shippingIncluded: true, couponApplied: '架空の1000円引きクーポン適用済み', bundle: null, locale: 'JP' } }),
  street('d', 'street', 65000),
  street('d', 'tax-unknown', 63000, { conditions: { itemCondition: 'new', taxIncluded: null, shippingIncluded: true, couponApplied: null, bundle: null, locale: 'JP' } }),
  street('d', 'shipping-unknown', 64000, { conditions: { itemCondition: 'new', taxIncluded: true, shippingIncluded: null, couponApplied: null, bundle: null, locale: 'JP' } }),
  street('e', 'free', 0, { zeroPriceReason: '架空の販促キャンペーンによる無償提供（購入可能な実際の企画ではありません）' }),
  street('f', 'missing', null, { notes: 'FICTIONAL / 架空の欠品表示で金額が未観測。0円を意味しません。' }),
];

export const DEMO_PRICE_OBSERVATIONS: PriceObservation[] = DEMO_DATASET.products.flatMap((product) =>
  [...listPrices, ...streets].filter((price) => price.productId === product.id));

// FICTIONAL: ExchangeRate has no notes field; both method and source notes
// explicitly identify this invented reference rate as demonstration data.
export const DEMO_EXCHANGE_RATES: ExchangeRate[] = [{
  id: 'DEMO-FX-USD-JPY', from: 'USD', to: 'JPY', rate: 150, rateDate: '2026-11-08',
  sourceId: 'DEMO-RETAIL-002', method: 'FICTIONAL / 架空の固定デモ換算値（市場相場ではありません）',
}];
