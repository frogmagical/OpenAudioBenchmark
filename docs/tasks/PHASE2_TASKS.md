# Phase 2 backlog (after the Phase 1 review, 2026-11-08)

Priority set by the product owner: provenance, measurement conditions and data-quality controls come first. Real-product data is entered only once the schema and validation exist.

## P2-0 — Methodology 0.5.0-demo (first change; separate PR)
- Price 0 → invalid, excluded from the price score. Public JSON `computed.score` null below the coverage gate; `provisionalScore` for internal use. ADR-0003.

## P2-1 — Provenance and conditions schema (in progress: PR `feat/phase2-provenance-model`)
- Implemented in `packages/core/src/model/` (ADR-0004, docs/DATA_MODEL.md): `Product`, `Source`, `Measurement` (status observed / manufacturer / estimated / missing; value null = unknown; uncertainty null = unstated), `Dataset` (schema 1.0, fictional flag).
- Projection with lineage (`projectProduct` → `DerivedValue.steps`), unit conversion as a tracked step, scorer decoupled (`calculateUtility(values: MetricValues)`).
- Data-quality gate: `validateDataset` (errors block, warnings shown) and `explainComparability` (level + coded Japanese reasons).
- `REQUIRED_CONDITIONS` per metric; demo dataset intentionally lacks output level / weighting so warnings are visible.
- UI: record details list per-metric evidence status, source and quality warnings.
- Carried to P2-1b: `PriceObservation`, `SpeakerElectricalTrace`, comparability reasons in the comparison view, literal unions for `weighting` / problem codes.

## P2-2 — Browser verification (independent task, planned to run in parallel; separate PR `feat/phase2-e2e`)
- Why CI-only: the lead's WSL host cannot start Chromium without root (`libnss3`, `libasound2`). The job runs in GitHub Actions on `ubuntu-latest` with `npx playwright install --with-deps chromium`; local runs work on any machine with those libraries.
- Scope: Playwright against `vite preview` of the production build.
  1. Viewports 1280 / 760 / 460 px: `document.documentElement.scrollWidth <= clientWidth` (no horizontal overflow); sidebar visible at 1280, compact top navigation at 760 and 460; screenshots uploaded as CI artifacts for human review (no automated pixel diff until a baseline is approved).
  2. Pairing view: primary card + three sub-cards + `<details>`; verdict colours computed via `getComputedStyle` → blue `rgb(23, 93, 160)` for positive, red `rgb(187, 48, 55)` for negative, black `rgb(32, 39, 46)` for neutral/pending; text labels present.
  3. Main flows: filter by budget → select two → compare grid → CSV/JSON download (file contents checked) ; pairing input edits update the result; keyboard navigation of the menu.
- Acceptance: job green on PR; screenshots attached; any failure reported as a finding with viewport and selector.

## P2-3 — Real-data pilot (blocked on P2-1)
- SMSL AO300 PRO and KEF LS50 Meta per docs/IMPLEMENTATION_PLAN.md Phase 3; exact revision and published test conditions verified; licence review before storing any figure or graphic.
