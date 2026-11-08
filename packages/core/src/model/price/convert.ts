/** Currency conversion as a tracked transform with separate display rounding. */
import type { ConvertedPrice, Currency, ExchangeRate, PriceObservation } from './types.ts';
import { MINOR_UNIT_DIGITS, roundHalfUp } from './rules.ts';

/**
 * Express `observation.amount` in `target` currency.
 * - Same currency → identity with one `unit-convert` step noting "変換なし".
 * - Otherwise a rate with `from === observation.currency && to === target` is required; the step note
 *   records rate, rateDate, method and sourceId; `rateId` is set.
 * - `amount === null` → value null, a `withhold` step ("金額が未観測"), rateId as above or null.
 * - No matching rate → value null, `withhold` step naming both currencies, `rateId: null`.
 * - `value` is unrounded; `display` is rounded half-up to the target currency's minor unit, including identity.
 * - Withheld results have both `value` and `display` null.
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
    ...result, value: null, display: null, steps: [{ op: 'withhold', input, output: null, note }],
  });
  if (observation.amount === null) return withhold('金額が未観測');
  if (!sameCurrency && !rate) return withhold(`${observation.currency} から ${target} への為替レートがないため変換を保留`);
  if (!Number.isFinite(observation.amount) || observation.amount < 0 || (rate && (!Number.isFinite(rate.rate) || rate.rate <= 0))) {
    return withhold('金額または為替レートが無効のため変換を保留');
  }
  // Adding zero normalizes signed zero without rounding the amount used for aggregation.
  const value = observation.amount * (rate?.rate ?? 1) + 0;
  if (!Number.isFinite(value)) return withhold('通貨変換結果が有限数でないため保留');
  const decimals = MINOR_UNIT_DIGITS[target]!;
  const display = roundHalfUp(value, decimals);
  const conversionNote = rate
    ? `${observation.currency} → ${target}: レート ${rate.rate}、適用日 ${rate.rateDate}、方法 ${rate.method}、出典 ${rate.sourceId}`
    : `${target}: 変換なし（原観測値を保持）`;
  const note = `${conversionNote}、小数点以下${decimals}桁で表示用に四捨五入（半上げ）、集計は未丸め値`;
  return {
    ...result, value, display,
    steps: [{ op: 'unit-convert', input: { ...input, rate: rate ?? null }, output: { value, display, currency: target }, note }],
  };
}
