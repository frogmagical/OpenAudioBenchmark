# Phase 3 backlog (after the PL review of PR #9, 2026-11-08)

Governance: Issue #10 GitHub handoff. PL technical acceptance ≠ PM merge approval. Real-product data is entered only after D-15 (rights) is decided and the schema work below is merged.

## P3-1 — Dataset schema 1.1 (PR `feat/phase3-schema-1.1`)
- G1 `MetricKey` (scoring, 4) vs `MetricId` (model, 8) separation; speaker metrics `sensitivity`, `nominalImpedance`, `minimumImpedance`, `crossoverFrequency`; `METRIC_CATEGORIES` validation.
- G3 `Source.tier`, `Source.reuse`; non-fictional datasets: numeric `Measurement` only when `quoteFacts` ∈ allowed / allowed-with-attribution / permitted-by-law-or-terms.
- G4 structured conditions (`instrument`, `testSignal`, `averaging`, `averagingBandHz`, `distortionCriterion`, `sensitivityReference`, `distanceM`).
- G5 `MeasurementReference` (value-less, words only). G6 `distortionCriterion` required for power. G7 product attributes. G8 schema `1.1`, demo migrated.
- D-03 `COMPARISON_REQUIRED_CONDITIONS` (`instrument` on both sides for amp metrics / sensitivity / min impedance), never an eligibility condition.
- Demo effect (D-18 approval needed in the PR): scores unchanged; warnings 17 → 23; comparison view withholds the demo power row.

## P3-2 — Scoring eligibility (G9 / D-17, separate PR)
- `eligible` / `ineligible` / `missing`; `estimated` and unrecorded required conditions → ineligible; coverage numerator only (denominator stays all 4 scoring metrics); `METHODOLOGY_VERSION` → `0.6.0-demo`; demo result diff presented for explicit approval (D-18); no `demo-assumed` backfill.

## P3-3 — Real-data bundle and loader
- `RealDataBundle { dataset, prices, rates, traces }`, JSON loader with `fictional: false`, `data-gate` CI job, publication build gated on PM approval (INGESTION_DESIGN.md).

## P3-4 — UI for schema 1.1
- Sources view: speaker metrics for speaker products, `MeasurementReference` rows ("出典で確認" + link), range specifications, reuse status per source.

## Pilot data (blocked)
- SMSL AO300 PRO / KEF LS50 Meta entry waits for D-15 and for the rights checks listed in docs/phase3/SOURCE_INVENTORY.md; third-party measurements as `MeasurementReference` only.
