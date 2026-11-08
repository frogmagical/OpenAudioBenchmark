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

Not yet implemented (future): `PriceObservation` (amount, currency, locale, merchant, timestamp, condition, tax/shipping assumptions), `SpeakerElectricalTrace` (impedance magnitude/phase vs frequency), `ComparisonContext`, `PairingContext`.

## Evidence status

| status | Meaning | Rules |
| --- | --- | --- |
| `observed` | Independent measurement | value and source required; source kind must not be `manufacturer` |
| `manufacturer` | Published specification | value and source required; source kind must not be `independent-lab` |
| `estimated` | Derived value | value, source and `derivation` text required |
| `missing` | Unknown | value `null`, no source; never 0, never a score |

Unknown uncertainty is `null`. An uncertainty of 0 is a validation error.

## From records to scores (lineage)

1. `selectMeasurement`: per product and metric, pick by status priority (observed > manufacturer > estimated), then highest `version`, then latest `capturedAt`.
2. `toCanonicalUnit`: convert the published unit to the metric's canonical unit (JPY, W, %, dB). THD+N dB → % is the only non-identity conversion today. Unconvertible → withheld with an error issue.
3. `projectProduct` returns, per metric, the chosen measurement id, status, source and a `DerivedValue` with every step recorded; plus `QualityIssue`s (e.g. required condition unrecorded).
4. `toMetricValues` hands four numbers-or-null to `calculateUtility`. The scorer never sees a `Measurement`.

## Data-quality gate

- `validateDataset(dataset)` → `QualityIssue[]` with code, severity (error / warning), path, Japanese message and related ids. Errors: dangling references, duplicate ids, value/status inconsistency, non-finite values, unaccepted units, missing source or derivation, zero uncertainty, status/source-kind conflicts, bad dates. Warnings: unrecorded required conditions, differing conditions within one product and metric, sources without URL, products without measurements.
- `explainComparability(a, b)` → level `comparable` / `comparable-with-caveats` / `not-comparable` with all applicable reasons (metric differs, value missing, unit not convertible, condition mismatch or unrecorded; evidence tier differs, estimated, unit converted, uncertainty unstated).
- `REQUIRED_CONDITIONS` per metric: power → loadOhms, channelsDriven, bandwidthHz; THD+N → loadOhms, outputLevel, bandwidthHz; S/N → weighting, outputLevel; price → none.

## Licensing

Prefer metadata + links to original plotted measurements. Assess rights and terms before storing/redistributing raw datasets, graphics or scraped prices. `Source.license` records the outcome.
