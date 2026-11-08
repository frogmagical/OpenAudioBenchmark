# ADR-0004 — Provenance data model and data-quality gate (P2-1)

Status: accepted for implementation (2026-11-08, product-owner direction after the Phase 1 review). **Revision 1.1 (2026-11-08, Phase 3)** — see "Schema 1.1" below; follows the PL decisions recorded in ADR-0007 and docs/phase3/OPEN_DECISIONS.md.

## Context

Phase 1 carried numbers on the product (`DemoProduct.price/power/thdn/snr`) with one condition record and one evidence flag per product. The reviews showed this cannot represent real data: evidence tier and conditions differ per metric, units differ per source, and nothing explains *why* two figures must not be compared.

## Decision

1. **Measurement is the unit of record.** `Measurement { productId, metric, value | null, unit, status, sourceId, conditions, uncertainty | null, derivation, capturedAt, version }`. Products carry identity and features only. Sources are first-class (`Source { publisher, kind, url, publishedAt, accessedAt, license, archiveRef }`).
2. **Four evidence statuses, enforced:** `observed` (independent measurement), `manufacturer` (published specification), `estimated` (derived; `derivation` text required), `missing` (`value === null`, no source). Unknown uncertainty is `null`, never 0.
3. **Originals are immutable; derivations carry lineage.** Projection (`projectProduct`) selects one measurement per metric by status priority (observed > manufacturer > estimated), converts to the canonical unit, and returns a `DerivedValue` whose `steps` list every select / unit-convert / withhold operation. The scorer only ever receives `MetricValues`.
4. **Evaluation is independent of the model.** `calculateUtility(values: MetricValues, weights)` depends on nothing in `model/`. The only bridge is `toMetricValues(projection)`; the Phase 1 UI keeps working through `toDemoProduct`.
5. **Data quality is a gate, not a hint.** `validateDataset` returns typed `QualityIssue`s (errors block use; warnings must be displayed). `explainComparability(a, b)` returns a level (`comparable` / `comparable-with-caveats` / `not-comparable`) with coded, Japanese reasons (condition mismatch, unrecorded required conditions, evidence tier, unit conversion, unstated uncertainty).
6. **Required conditions per metric** (`REQUIRED_CONDITIONS`): power → load, channels driven, bandwidth; THD+N → load, output level, bandwidth; S/N → weighting, output level; price → none. The demo dataset deliberately leaves output level and weighting unrecorded so the mechanism visibly reports it.
7. **Fictional flag at dataset level** and on every product; `toDemoProduct` refuses non-fictional datasets. For non-fictional datasets a source without URL is an error (AGENTS.md §7).
8. **The gate is enforced, not advisory.** `prepareDataset` → `assertUsable` sits in front of projection, adapter, views and export. Validation warnings attached to the selected measurement are carried into the projection so every view shows them.
9. **Selection tie-break**: evidence status, then `version`, then `capturedAt`, then id. `version` is a correction counter of the same figure (a re-issued record supersedes its predecessor regardless of date); between unrelated records the capture date decides. Two records that still tie with different values raise `measurement.ambiguous-selection`.
10. **One lineage per displayed number.** The views take a prepared dataset and derive product values from it; they never accept independently supplied numbers next to provenance. The export publishes the per-metric chain (original record → selection → unit conversion → normalisation).

## Alternatives considered

- Keep numbers on the product and add per-metric metadata fields: rejected, duplicates every metric's shape and still cannot hold several sources per metric.
- A database now: rejected (docs/IMPLEMENTATION_PLAN.md Phase 4); typed in-memory records plus a validation gate are enough until real ingestion exists.
- Silently normalising units on ingestion: rejected; the published value and unit are kept and conversion is a tracked step.

## Consequences

- Real-product data can be entered only as `Measurement`s with sources and conditions, and only after `validateDataset` reports no errors.
- The methodology version is unchanged (`0.5.0-demo`): formulas, bounds and thresholds did not change. Dataset schema version is `1.0`.
- UI work to show per-metric status, sources and comparability reasons follows in the same PR where feasible, otherwise as P2-1b.

## Schema 1.1 (Phase 3, implements the data-model parts of G1–G8 of docs/phase3/DATA_GAP_ANALYSIS.md; G2's pairing bridge and G9 are not included)

| Change | Decision it implements |
| --- | --- |
| `MetricId = MetricKey \| SpeakerMetricId` (`sensitivity`, `nominalImpedance`, `minimumImpedance`, `crossoverFrequency`); `METRIC_KEYS` keeps the four scoring metrics; `projectProduct` projects every `MetricId`, `toMetricValues` narrows to `MetricKey` | D-10 / G1 — speaker metrics are never fed to the utility score |
| `METRIC_CATEGORIES`: metric ↔ product category validation (`measurement.metric-category-mismatch`) | DATA_GAP validation rules |
| `Source.tier` (primary / secondary) and `Source.reuse` (quoteFacts / reproduceFigures / storeRawData / redistribute, basis, checkedAt). In non-fictional datasets a numeric `Measurement` may cite a source only when `reuse.quoteFacts` ∈ `NUMBER_STORAGE_PERMITTED` (allowed, allowed-with-attribution, permitted-by-law-or-terms); otherwise only a `MeasurementReference` | D-15 / D-09 / G3 — internal storage is not automatically permitted; the legal question itself stays with PM/legal |
| `MeasurementReference` (`Dataset.references`): value-less pointer to a figure held at a source; quantities as words only (digits rejected); never projected or scored | D-16 / G5 (option B) |
| `RangeMeasurement` (`Dataset.ranges`): low/high/tolerance/conditions kept as one record; display only | D-07 |
| `MeasurementConditions` gains `instrument`, `testSignal`, `averaging`, `averagingBandHz`, `distortionCriterion`, `sensitivityReference`, `distanceM` | G4 / P8 / D-06 |
| `REQUIRED_CONDITIONS.power` gains `distortionCriterion`; speaker metrics get their required sets (sensitivity: reference, distance, averaging, averaging band, environment; minimum impedance: frequency) | G6 / D-04 / P8 |
| `COMPARISON_REQUIRED_CONDITIONS`: `instrument` must be recorded on both sides for power / THD+N / S/N / sensitivity / minimum impedance comparisons, otherwise `conditions.unrecorded`. Deliberately **not** part of `REQUIRED_CONDITIONS`, so it never affects scoring eligibility | D-03 (PL: unknown instrument withholds comparisons; no blanket eligibility condition) |
| `Product.region`, `dimensionsMm`, `massKg`; `FeatureKey` gains optical / coaxial / subout / xlr | G7 |
| `DATASET_SCHEMA_VERSION = '1.1'`; the fictional demo dataset is migrated in the same change (reuse marked `allowed` with the basis "fictional demonstration data authored by this project") | G8 |

Runtime guards (added after the independent audits): evidence statuses and every condition value are validated at runtime (`*.status-invalid`, `*.condition-value-invalid` via `conditionValueProblem`: type, vocabulary, sign, tuple shape, unknown keys) because loaded data does not carry TypeScript's guarantees; a `null`, blank or malformed condition counts as unrecorded everywhere (`isConditionRecorded`); the views escape status attributes; and the gate is asserted at `initApp`, every view, `buildCatalogJson` and the dataset-taking core helpers, not only through product projection. Condition-key lookups use own properties only, so JSON keys such as `constructor` are rejected as unknown keys instead of crashing the validator.

Not in 1.1: scoring eligibility (G9 / D-17) — a separate PR with the demo-result diff for explicit approval (D-18).

### Effect on the fictional demo (to be approved explicitly, D-18)

The demo records carry no `distortionCriterion` and no `instrument`. Under 1.1:
- numeric scores and coverage of the six demo products are **unchanged** (scoring eligibility is not implemented; condition-unrecorded values still reach the scorer with a warning);
- quality warnings rise from 17 to 23 (`measurement.required-condition-unrecorded` now also on the six `power` records); the catalog record details therefore show one more warning per product;
- in the comparison view the 8 Ω output row is **newly withheld** (previously comparable with the uncertainty caveat); THD+N, S/N and the utility score were already withheld.
No demo condition is back-filled (D-18).
