# Implementation plan

## Phase 0 — Import and preserve (first PR)

- Keep `prototype/index.html` byte-identical as v0.4 baseline.
- Add docs and agent instructions (included in this handoff).
- Choose minimal TypeScript build tooling and lock versions.

## Phase 1 — Extract and test (second PR)

- Extract fixture records and calculation modules.
- Port UI into maintainable components while matching baseline design.
- Verify catalog filters, score coverage, selection of two products, export CSV/JSON, navigation, pairing input handling and card color semantics.
- Add unit tests and a smoke test, including narrow-screen overflow and accessibility basics.

## Phase 2 — Provenance schema

- Implement `Product`, `Source`, `Measurement`, `Conditions`, `PriceObservation`, versioned methodology.
- Validate ingestion. Show source links and measurement-condition mismatch warnings.
- No fabricated real-product values or 'verified' label without an actual source.

## Phase 3 — Pilot real data

- Start with SMSL AO300 PRO and KEF LS50 Meta; independently verify *exact model/revision* and published test conditions.
- Only compute aspects the data truly supports; unknown phase/stability/room effects remain undetermined.
- Separate manufacturer ratings from independently measured data.

## Phase 4 — Deployment

- GitHub Actions CI; consider GitHub Pages or other static hosting while backend is unnecessary.
- Add persistent backend/storage only when justified by real ingestion, collaboration or query needs. AWS is optional.

## Acceptance criteria for first coding-agent PR

- `prototype/index.html` unchanged.
- New app can be started locally with documented commands.
- All six views work; sidebar stays distinct; mobile navigation works.
- Demo output behaviors and threshold boundary tests pass.
- All fictional fixtures clearly labeled.
- Build/test/typecheck succeed locally and in CI.
- Screenshots show no material regression at desktop and mobile widths.
