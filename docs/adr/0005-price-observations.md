# ADR-0005 — Prices as observations (P2-3A)

Status: **proposed** — data model, validation, tracked conversion and comparable-group summaries are implemented for review. The policy choices listed under "Decisions for the PL" are implemented with the stated defaults but are not final, and nothing here feeds the utility score yet.

## Context

Phase 1 carried one `price` per product as a plain reference figure. Real prices vary by merchant, date, currency, new/used state and whether tax, shipping or a coupon is included; aggregating them without recording those conditions produces numbers nobody can audit.

## Decision (implemented)

- `PriceObservation`: product, merchant, `amount | null` (null = not observable; 0 only with `zeroPriceReason`), currency (closed list), `kind` list / street / sold, `observedAt` (ISO 8601 with UTC offset, impossible dates rejected), conditions (item condition, `taxIncluded | null`, `shippingIncluded | null`, coupon, bundle, locale), source, version.
- `ExchangeRate`: from/to, rate (`to` per 1 `from`), rate date, source, method. Rates are never inverted or chained.
- `convertPrice`: identity or a recorded rate, as a tracked `unit-convert` step naming rate, date, method and source. The converted `value` is unrounded; `display` is rounded half-up to the currency's minor unit for presentation only.
- `explainPriceComparability`: not-comparable when amounts are missing, currencies differ without a rate, `kind` differs, or any blocking condition differs (item condition, tax true/false, shipping true/false, bundle, locale); caveats for conversion, unstated tax/shipping, coupon, merchant, day gap (reported, no threshold), zero price. Messages name both values.
- `summarizePrices`: groups by currency / kind / item condition / tax / shipping / bundle / locale, never merges groups, excludes null and zero amounts (listed separately), min / median / max on unrounded values, lineage with an `aggregate` step that states what is still merged (merchants, coupons, dates).
- Fictional demo observations and one fictional rate exercise every branch; the demo dataset validates with zero errors.

## Decisions for the PL (defaults implemented; change requires only this ADR)

| # | Question | Default in code |
| --- | --- | --- |
| D1 | Which differences block a pairwise comparison vs caveat | block: kind, item condition, tax/shipping true vs false, bundle, locale; caveat: merchant, coupon, day gap, unstated tax/shipping |
| D2 | Rounding | never before aggregation; display rounded half-up to minor unit |
| D3 | Aggregation scope | per currency / kind / condition / tax / shipping / bundle / locale; merchants, coupons and dates merged with a lineage note; no time window |
| D4 | "Conversion date-time" | the rate's applicable date and source are recorded; the wall-clock time of conversion is not (pure function); no check on the gap between observation and rate date |
| D5 | List price from a non-manufacturer source | error (retailer "参考価格" would need its own `kind` or a relaxation to warning) |
| D6 | `locale` vocabulary | free text, compared literally; a closed region list and VAT-rate modelling are open |
| D7 | Model gaps | quantity / price-per-unit for bundles, stock state vs "ask" vs not captured, price ranges, financing terms, b-stock / demo-unit conditions, quotes |
| D8 | Offsets | ±14:00 accepted, `-00:00` rejected, year 0000 accepted |
| D9 | Currencies | JPY, USD, EUR, GBP, CNY |
| D10 | Day gap | computed on the recorded local calendar date |
| D11 | Relationship to scoring | the utility score still uses the legacy `price` Measurement; selecting a reference price from observations (e.g. latest new tax-included JPY street price) is a methodology change and is **not** implemented |

## Consequences

- Price data can be entered only as observations with source and conditions; the gate reports violations before anything is displayed.
- A UI for observations (per-product price table with conditions and comparability reasons) follows in the sources view once this ADR is accepted.
