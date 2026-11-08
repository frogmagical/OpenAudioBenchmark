# ADR-0005 — Prices as observations (P2-3A)

Status: **accepted in part** (PL review 2026-11-08). The data model, validation, tracked conversion, pairwise comparability and comparable-group summaries are accepted with the policy below. Connecting price observations to the utility score remains **unapproved**.

## Context

Phase 1 carried one `price` per product as a plain reference figure. Real prices vary by merchant, date, currency, new/used state and whether tax, shipping or a coupon is included; aggregating them without recording those conditions produces numbers nobody can audit.

## Decision (implemented)

- `PriceObservation`: product, merchant, `amount | null` (null = not observable; 0 only with `zeroPriceReason`), currency (closed list), `kind` list / street / sold, `observedAt` (ISO 8601 with UTC offset, impossible dates rejected), conditions (item condition, `taxIncluded | null`, `shippingIncluded | null`, coupon, bundle, locale), source, version.
- `ExchangeRate`: from/to, rate (`to` per 1 `from`), rate date, source, method. Rates are never inverted or chained.
- `convertPrice`: identity or a recorded rate, as a tracked `unit-convert` step naming rate, date, method and source. The converted `value` is unrounded; `display` is rounded half-up to the currency's minor unit for presentation only.
- `explainPriceComparability`: not-comparable when amounts are missing, currencies differ without a rate, `kind` differs, or any blocking condition differs (item condition, tax true/false, shipping true/false, bundle, locale); caveats for conversion, unstated tax/shipping, coupon, merchant, day gap (reported, no threshold), zero price. Messages name both values.
- `summarizePrices`: groups by currency / kind / item condition / tax / shipping / bundle / locale, never merges groups, excludes null and zero amounts (listed separately), min / median / max on unrounded values, lineage with an `aggregate` step that states what is still merged (merchants, coupons, dates).
- Fictional demo observations and one fictional rate exercise every branch; the demo dataset validates with zero errors.

## Policy approved by the PL (2026-11-08)

| Topic | Approved rule | Where enforced |
| --- | --- | --- |
| Blocking differences | new/used (item condition), price kind (list / street / sold), a clear tax or shipping difference (included vs not), bundle contents, market (locale) → direct comparison withheld | `BLOCKING_CONDITION_KEYS`, `explainPriceComparability` (`not-comparable`) |
| Caveats | merchant, coupon, observation date-time gap, **unstated** tax or shipping → reported as 注意, comparison allowed | `CAVEAT_CONDITION_KEYS`, caveat reasons |
| Rounding | internal values unrounded; rounding only for display (half-up, minor unit) | `convertPrice.value` vs `.display`; summaries aggregate unrounded values |
| Aggregation | never across condition groups (currency / kind / item condition / tax / shipping / bundle / locale); aggregation without a time window is **descriptive only**, not an input to any score | `summarizePrices`, `aggregate` step note |
| Currency conversion | requires rate date, source and direction (`to` per 1 `from`); never inverted or chained | `ExchangeRate`, `convertPrice`, `rate.*` validation |
| List price | manufacturer sources only (error otherwise) | `price.list-from-non-manufacturer` |

## Open items (recorded, not approved)

| # | Item | Status |
| --- | --- | --- |
| O1 | Consistency check between `observedAt` and the exchange rate's `rateDate` | **Mandatory for a future revision**; not enforced yet (no gap rule defined) |
| O2 | Market code normalisation (`locale` vocabulary), VAT-rate modelling | follow-up task |
| O3 | Model extensions: stock / availability state, quantity and price-per-unit, bundle breakdown, price ranges, financing terms, b-stock / demo units, quotes | follow-up task |
| O4 | Connecting price observations to the utility score (reference-price selection) | **unapproved**; the legacy `price` Measurement remains the scorer's input |
| O5 | Accepted currencies (JPY, USD, EUR, GBP, CNY), UTC offset range ±14:00, day-gap on recorded local date | implemented defaults, may be revised without a methodology change |

## Consequences

- Price data can be entered only as observations with source and conditions; the gate reports violations before anything is displayed.
- A UI for observations (per-product price table with conditions and comparability reasons) can now follow in the sources view.
- Any proposal to use observations for scoring must come with basis, scope, counter-examples, behaviour on missing data and a verification method, and go through PL review (O4).
