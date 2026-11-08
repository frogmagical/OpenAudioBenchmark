/** Currency conversion as a tracked transform. Implemented by the core worker. */
import type { ConvertedPrice, Currency, ExchangeRate, PriceObservation } from './types.ts';

/**
 * Express `observation.amount` in `target` currency.
 * - Same currency → identity with one `unit-convert` step noting "変換なし".
 * - Otherwise a rate with `from === observation.currency && to === target` is required; the step note
 *   records rate, rateDate, method and sourceId; `rateId` is set.
 * - `amount === null` → value null, a `withhold` step ("金額が未観測"), rateId as above or null.
 * - No matching rate → value null, `withhold` step naming both currencies, `rateId: null`.
 * - Result rounded to 2 decimals for currencies with minor units, 0 decimals for JPY (document in the step).
 * Never mutates the observation.
 */
export function convertPrice(observation: PriceObservation, target: Currency, rates: readonly ExchangeRate[]): ConvertedPrice {
  // Inputs pass validatePriceObservations first. If multiple directed rates
  // exist, caller order selects the first; never infer an inverse or cross rate.
  const sameCurrency = observation.currency === target;
  const rate = sameCurrency ? undefined : rates.find((candidate) => candidate.from === observation.currency && candidate.to === target);
  const input = { observationId: observation.id, value: observation.amount, currency: observation.currency };
  const result = { currency: target, observationId: observation.id, rateId: rate?.id ?? null };
  const withhold = (note: string): ConvertedPrice => ({
    ...result, value: null, steps: [{ op: 'withhold', input, output: null, note }],
  });
  if (observation.amount === null) return withhold('金額が未観測');
  if (!sameCurrency && !rate) return withhold(`${observation.currency} から ${target} への為替レートがないため変換を保留`);
  if (!Number.isFinite(observation.amount) || observation.amount < 0 || (rate && (!Number.isFinite(rate.rate) || rate.rate <= 0))) {
    return withhold('金額または為替レートが無効のため変換を保留');
  }
  const raw = observation.amount * (rate?.rate ?? 1);
  if (!Number.isFinite(raw)) return withhold('通貨変換結果が有限数でないため保留');
  const decimals = target === 'JPY' ? 0 : 2;
  // Identity preserves the published amount; only actual conversion rounds.
  const value = sameCurrency ? observation.amount : Number(raw.toFixed(decimals));
  const note = sameCurrency ? `${target}: 変換なし（原観測値を保持）`
    : `${observation.currency} → ${target}: レート ${rate!.rate}、適用日 ${rate!.rateDate}、方法 ${rate!.method}、出典 ${rate!.sourceId}、小数点以下${decimals}桁に四捨五入`;
  return { ...result, value, steps: [{ op: 'unit-convert', input: { ...input, rate: rate ?? null }, output: { value, currency: target }, note }] };
}
