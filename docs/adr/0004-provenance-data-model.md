# ADR-0004 — Provenance data model and data-quality gate (P2-1)

Status: accepted for implementation (2026-11-08, product-owner direction after the Phase 1 review).

## Context

Phase 1 carried numbers on the product (`DemoProduct.price/power/thdn/snr`) with one condition record and one evidence flag per product. The reviews showed this cannot represent real data: evidence tier and conditions differ per metric, units differ per source, and nothing explains *why* two figures must not be compared.

## Decision

1. **Measurement is the unit of record.** `Measurement { productId, metric, value | null, unit, status, sourceId, conditions, uncertainty | null, derivation, capturedAt, version }`. Products carry identity and features only. Sources are first-class (`Source { publisher, kind, url, publishedAt, accessedAt, license, archiveRef }`).
2. **Four evidence statuses, enforced:** `observed` (independent measurement), `manufacturer` (published specification), `estimated` (derived; `derivation` text required), `missing` (`value === null`, no source). Unknown uncertainty is `null`, never 0.
3. **Originals are immutable; derivations carry lineage.** Projection (`projectProduct`) selects one measurement per metric by status priority (observed > manufacturer > estimated), converts to the canonical unit, and returns a `DerivedValue` whose `steps` list every select / unit-convert / withhold operation. The scorer only ever receives `MetricValues`.
4. **Evaluation is independent of the model.** `calculateUtility(values: MetricValues, weights)` depends on nothing in `model/`. The only bridge is `toMetricValues(projection)`; the Phase 1 UI keeps working through `toDemoProduct`.
5. **Data quality is a gate, not a hint.** `validateDataset` returns typed `QualityIssue`s (errors block use; warnings must be displayed). `explainComparability(a, b)` returns a level (`comparable` / `comparable-with-caveats` / `not-comparable`) with coded, Japanese reasons (condition mismatch, unrecorded required conditions, evidence tier, unit conversion, unstated uncertainty).
6. **Required conditions per metric** (`REQUIRED_CONDITIONS`): power → load, channels driven, bandwidth; THD+N → load, output level, bandwidth; S/N → weighting, output level; price → none. The demo dataset deliberately leaves output level and weighting unrecorded so the mechanism visibly reports it.
7. **Fictional flag at dataset level** and on every product; `toDemoProduct` refuses non-fictional datasets.

## Alternatives considered

- Keep numbers on the product and add per-metric metadata fields: rejected, duplicates every metric's shape and still cannot hold several sources per metric.
- A database now: rejected (docs/IMPLEMENTATION_PLAN.md Phase 4); typed in-memory records plus a validation gate are enough until real ingestion exists.
- Silently normalising units on ingestion: rejected; the published value and unit are kept and conversion is a tracked step.

## Consequences

- Real-product data can be entered only as `Measurement`s with sources and conditions, and only after `validateDataset` reports no errors.
- The methodology version is unchanged (`0.5.0-demo`): formulas, bounds and thresholds did not change. Dataset schema version is `1.0`.
- UI work to show per-metric status, sources and comparability reasons follows in the same PR where feasible, otherwise as P2-1b.
