# Data model

Implemented in `packages/core/src/model/` (dataset schema `1.1`, ADR-0004 and its 1.1 revision). Strongly typed, immutable records; derived values carry lineage.

## Entities

| Entity | Purpose | Key fields |
| --- | --- | --- |
| `Product` | Identity and stated attributes | id, maker, model, revision, category, name, subtitle, features, region, dimensionsMm, massKg, fictional |
| `Source` | Where a figure comes from and what may be reused | id, publisher, kind (independent-lab / manufacturer / retailer / editorial / other), tier (primary / secondary), url, publishedAt, accessedAt, license, notes, archiveRef, reuse {quoteFacts, reproduceFigures, storeRawData, redistribute, basis, checkedAt} |
| `Measurement` | One figure | id, productId, metric (`MetricId`: price, power, thdn, snr, sensitivity, nominalImpedance, minimumImpedance, crossoverFrequency), value \| null, unit, status, sourceId, conditions, uncertainty \| null, derivation, capturedAt, version, notes |
| `MeasurementReference` | A figure that exists at a source but whose value is not stored (rights unconfirmed, third-party measurement kept as location only) | id, productId, metric, sourceId, quantities (words, no digits), conditions, status, accessedAt, notes |
| `RangeMeasurement` | A range specification such as "47 Hz – 45 kHz (−6 dB)" | id, productId, metric `frequencyRange`, lowHz, highHz, toleranceDb, toleranceKind, status, sourceId, conditions, capturedAt, version |
| `MeasurementConditions` | How it was measured | frequencyHz, bandwidthHz, loadOhms, loadType, channelsDriven, inputSignal, outputLevel, weighting, environment, method, instrument, testSignal, averaging, averagingBandHz, distortionCriterion, sensitivityReference, distanceM |
| `Dataset` | A validated bundle | schemaVersion (`1.1`), fictional, products, sources, measurements, references?, ranges? |

Additional record types:

| Entity | Purpose | Module |
| --- | --- | --- |
| `PriceObservation`, `ExchangeRate` | Prices as dated observations under stated conditions; tracked currency conversion; comparable-group summaries | `model/price` (ADR-0005) |
| `SpeakerElectricalTrace` | Impedance magnitude and phase vs frequency with method, conditions, uncertainty; points marked measured / interpolated / converted | `model/trace` (ADR-0006) |

Not yet implemented: `ComparisonContext`, `PairingContext`.

### Price observations

- `validatePriceObservations`: ids, references, amount domain (null = unobservable, 0 only with a reason), currency list, ISO 8601 date-time with offset and real calendar day, blank text, version, list price only from manufacturer sources, rate sanity (positive, different currencies, calendar date, method). Warnings: unstated tax/shipping, missing amount, product without prices.
- `convertPrice` is a tracked step (rate, date, method, source); `value` unrounded, `display` rounded half-up. `explainPriceComparability` names what differs; `summarizePrices` never merges groups with different currency/kind/condition/tax/shipping/bundle/locale and excludes null and zero amounts.

### Electrical load traces

- Points are `measured`, `converted` (same frequency, `conversion` metadata required) or `interpolated` (`derivedFrom` = adjacent bracketing primary frequencies). `passivity` declares whether the ±90° phase rule applies (passive: error; unknown: warning; not-passive: off).
- Validation (`validateTraces`): strictly increasing positive frequencies; |Z| finite and > 0; phase finite; ≥ 2 primary points; interpolated ancestry bracketed and adjacent; conversion metadata; uncertainty rules as above with unit Ω; sense resistor and numeric conditions sane; blank strings = unstated; estimated requires derivation; status/source-kind consistency; product must be a speaker; duplicate ids in the supplied context reported. Warnings: unknown revision, unstated drive level, no phase data, unstated uncertainty, unrecorded conditions, passivity unknown, phase beyond ±90° on an unknown-passivity trace.
- `summarizeTrace` is descriptive only (range, counts, min |Z| with its frequency and the phase at that point, max |Z|, phase extremes with frequencies) and carries a note that no compatibility, safety or sound verdict follows from it.
- `resampleTrace` interpolates linearly on a log-frequency axis between adjacent primary points, refuses extrapolation, lists skipped requests with reasons, and returns `interpolated` points with `derivedFrom` plus `select-measurement` and `interpolate` steps carrying the trace version and method version.

## Evidence status

| status | Meaning | Rules |
| --- | --- | --- |
| `observed` | Independent measurement | value and source required; source kind must not be `manufacturer` |
| `manufacturer` | Published specification | value and source required; source kind must not be `independent-lab` |
| `estimated` | Derived value | value, source and `derivation` text required |
| `missing` | Unknown | value `null`, no source; never 0, never a score |

Unknown uncertainty is `null`. An uncertainty of 0 is a validation error.

## From records to scores (lineage)

1. `selectMeasurement`: per product and metric, pick by status priority (observed > manufacturer > estimated), then highest `version` (a corrected re-issue of the same figure supersedes the original), then latest `capturedAt`, then id. Records carrying a validation error are never selected.
2. `toCanonicalUnit`: convert the published unit to the metric's canonical unit (JPY, W, %, dB). THD+N dB → % is the only non-identity conversion today. Unconvertible → withheld with an error issue.
3. `projectProduct` returns, per metric, the chosen measurement id, status, source and a `DerivedValue` with every step recorded; plus `QualityIssue`s (e.g. required condition unrecorded).
4. `toMetricValues` hands four numbers-or-null to `calculateUtility`. The scorer never sees a `Measurement`.

## Data-quality gate

- `prepareDataset(dataset)` runs `validateDataset` once and returns a `PreparedDataset` (`usable`, `errors`, `warnings`, `issuesById`). Projection, the adapter, the views and the export accept a prepared dataset; `assertUsable` throws when errors exist, so a dataset that fails the gate never reaches a view or an export. The gate is asserted at every public boundary — app start-up (`initApp`), every view (`initCatalog`, `renderCompare`, `renderSources`), the JSON export (`buildCatalogJson` with a dataset) and the core helpers that take a dataset (`projectProduct`, `projectMetric`, `selectMeasurement` with a prepared dataset, `sourcesForProduct`, `toDemoProduct`) — independently of how many products the dataset has. Warnings attached to the selected measurement travel into every projection and are displayed.
- `validateDataset(dataset)` → `QualityIssue[]` with code, severity (error / warning), path, Japanese message and related ids.
  - Errors: schema version; fictional flag mismatch; duplicate or empty ids; dangling product/source references; value/status inconsistency; non-finite or out-of-domain values (price > 0, power > 0, THD+N % > 0); unaccepted units; missing source, or a source on a `missing` record; missing or blank derivation on estimates, derivation on non-estimates; uncertainty that is zero, negative, non-finite, reversed, on a `missing` record or in another unit; non-positive-integer version; status/source-kind conflicts; metric outside `METRIC_IDS` (`*.metric-invalid`; metric-dependent checks are skipped for it); evidence status outside the vocabulary (`*.status-invalid`; references and ranges may not be `missing`); condition values that are `null`, of the wrong type, outside an enum vocabulary, blank, non-positive, malformed band tuples or unknown keys (`*.condition-value-invalid`, see `conditionValueProblem`); invalid `accessedAt`, `publishedAt`, `capturedAt` (calendar dates, `YYYY-MM-DD`); missing/blank source URL when the dataset is **not** fictional.
  - Warnings: unrecorded required conditions; differing relevant conditions within one product and metric; ambiguous selection (two equally ranked records with different values); source without URL (fictional datasets); unreferenced sources; products without measurements.
- Condition relevance: `RELEVANT_CONDITIONS[metric]` limits mismatch checks to the keys that matter for that metric (none for price).
- `explainComparability(a, b)` → level `comparable` / `comparable-with-caveats` / `not-comparable` with all applicable reasons (metric differs, value missing or non-finite, unit not convertible, relevant condition mismatch — naming each key with both values — or required condition unrecorded; evidence tier differs, estimated, unit converted, uncertainty unstated). `explainMetricComparability(prepared, productA, productB, metric)` applies it to the records two products actually use and treats an absent record exactly like an explicit `missing` one.
- `evaluateProduct(prepared, productId, weights)` returns the projection, the scorer input, the utility result and, per metric, the full lineage including the `normalize` step. The JSON export (`buildCatalogJson(..., { dataset })`, format 0.4.0) publishes this chain as `provenance`.
- `REQUIRED_CONDITIONS` per metric (drives the "unrecorded" warnings and the comparability block today; scoring eligibility based on it is **not implemented yet** — G9/D-17, see ADR-0007 P9): power → loadOhms, channelsDriven, bandwidthHz, distortionCriterion; THD+N → loadOhms, outputLevel, bandwidthHz; S/N → weighting, outputLevel; price → none; sensitivity → sensitivityReference, distanceM, averaging, averagingBandHz, environment; minimumImpedance → frequencyHz; nominalImpedance / crossoverFrequency → none.
- `COMPARISON_REQUIRED_CONDITIONS` (comparison only, never eligibility — D-03): `instrument` for power, THD+N, S/N, sensitivity and minimum impedance. Unrecorded on either side → `conditions.unrecorded`. "Recorded" means present and well-formed (`isConditionRecorded`): a `null`, blank or malformed value counts as unrecorded for required and comparison-only conditions alike, so it can never establish comparability.
- `METRIC_CATEGORIES`: amplifier metrics only on amplifiers, speaker metrics only on speakers, price on any category.
- Rights (D-15): in a non-fictional dataset a numeric `Measurement` may cite a source only when `reuse.quoteFacts` is `allowed`, `allowed-with-attribution` or `permitted-by-law-or-terms`; `unknown` / `prohibited` sources can only be referenced through `MeasurementReference`. Publication is a separate approval.

## Licensing

Prefer metadata + links to original plotted measurements. Assess rights and terms before storing/redistributing raw datasets, graphics or scraped prices. `Source.license` records the outcome.
