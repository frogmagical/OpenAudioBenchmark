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
  void observation;
  void target;
  void rates;
  throw new Error('not implemented');
}
