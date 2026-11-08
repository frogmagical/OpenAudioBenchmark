# Data model

Implemented in `packages/core/src/model/` (dataset schema `1.0`, ADR-0004). Strongly typed, immutable records; derived values carry lineage.

## Entities

| Entity | Purpose | Key fields |
| --- | --- | --- |
| `Product` | Identity only | id, maker, model, revision, category, name, subtitle, features, fictional |
| `Source` | Where a figure comes from | id, publisher, kind (independent-lab / manufacturer / retailer / editorial / other), url, publishedAt, accessedAt, license, notes, archiveRef |
| `Measurement` | One figure | id, productId, metric, value \| null, unit, status, sourceId, conditions, uncertainty \| null, derivation, capturedAt, version, notes |
| `MeasurementConditions` | How it was measured | frequencyHz, bandwidthHz, loadOhms, loadType, channelsDriven, inputSignal, outputLevel, weighting, environment, method |
| `Dataset` | A validated bundle | schemaVersion, fictional, products, sources, measurements |

Additional record types:

| Entity | Purpose | Module |
| --- | --- | --- |
| `SpeakerElectricalTrace` | Impedance magnitude and phase vs frequency with method, conditions, uncertainty; points marked measured / interpolated / converted | `model/trace` (ADR-0006) |
| `PriceObservation`, `ExchangeRate` | Prices as dated observations under stated conditions; tracked currency conversion | `model/price` (ADR-0005, separate PR) |

Not yet implemented: `ComparisonContext`, `PairingContext`.

### Electrical load traces

- Validation (`validateTraces`): strictly increasing positive frequencies; |Z| finite and > 0; phase finite and within ±90° (passivity); ≥ 2 measured points; derived points reference measured frequencies; uncertainty rules as above; estimated requires derivation; status/source-kind consistency; product must be a speaker. Warnings: unknown revision, unstated drive level, no phase data, unstated uncertainty, unrecorded conditions.
- `summarizeTrace` is descriptive only (range, counts, min/max |Z| with frequency, phase extremes) and carries a note that no compatibility, safety or sound verdict follows from it.
- `resampleTrace` interpolates linearly on a log-frequency axis between adjacent measured points, refuses extrapolation, and returns the points as `interpolated` with `derivedFrom` plus the transform steps.

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

- `prepareDataset(dataset)` runs `validateDataset` once and returns a `PreparedDataset` (`usable`, `errors`, `warnings`, `issuesById`). Projection, the adapter, the views and the export accept a prepared dataset; `assertUsable` throws when errors exist, so a dataset that fails the gate never reaches a view or an export. Warnings attached to the selected measurement travel into every projection and are displayed.
- `validateDataset(dataset)` → `QualityIssue[]` with code, severity (error / warning), path, Japanese message and related ids.
  - Errors: schema version; fictional flag mismatch; duplicate or empty ids; dangling product/source references; value/status inconsistency; non-finite or out-of-domain values (price > 0, power > 0, THD+N % > 0); unaccepted units; missing source, or a source on a `missing` record; missing or blank derivation on estimates, derivation on non-estimates; uncertainty that is zero, negative, non-finite, reversed, on a `missing` record or in another unit; non-positive-integer version; status/source-kind conflicts; invalid `accessedAt`, `publishedAt`, `capturedAt` (calendar dates, `YYYY-MM-DD`); missing/blank source URL when the dataset is **not** fictional.
  - Warnings: unrecorded required conditions; differing relevant conditions within one product and metric; ambiguous selection (two equally ranked records with different values); source without URL (fictional datasets); unreferenced sources; products without measurements.
- Condition relevance: `RELEVANT_CONDITIONS[metric]` limits mismatch checks to the keys that matter for that metric (none for price).
- `explainComparability(a, b)` → level `comparable` / `comparable-with-caveats` / `not-comparable` with all applicable reasons (metric differs, value missing or non-finite, unit not convertible, relevant condition mismatch — naming each key with both values — or required condition unrecorded; evidence tier differs, estimated, unit converted, uncertainty unstated). `explainMetricComparability(prepared, productA, productB, metric)` applies it to the records two products actually use and treats an absent record exactly like an explicit `missing` one.
- `evaluateProduct(prepared, productId, weights)` returns the projection, the scorer input, the utility result and, per metric, the full lineage including the `normalize` step. The JSON export (`buildCatalogJson(..., { dataset })`, format 0.4.0) publishes this chain as `provenance`.
- `REQUIRED_CONDITIONS` per metric: power → loadOhms, channelsDriven, bandwidthHz; THD+N → loadOhms, outputLevel, bandwidthHz; S/N → weighting, outputLevel; price → none.

## Licensing

Prefer metadata + links to original plotted measurements. Assess rights and terms before storing/redistributing raw datasets, graphics or scraped prices. `Source.license` records the outcome.
