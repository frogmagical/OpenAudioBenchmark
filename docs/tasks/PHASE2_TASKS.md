# Phase 2 backlog (after the Phase 1 review, 2026-11-08)

Priority set by the product owner: provenance, measurement conditions and data-quality controls come first. Real-product data is entered only once the schema and validation exist.

## P2-0 — Methodology 0.5.0-demo (first change; separate PR)
- Price 0 → invalid, excluded from the price score. Public JSON `computed.score` null below the coverage gate; `provisionalScore` for internal use. ADR-0003.

## P2-1 — Provenance and conditions schema (docs/DATA_MODEL.md)
- `Source`, `Measurement` (value nullable, status observed/manufacturer/estimated/missing, conditions per measurement, uncertainty), `PriceObservation`.
- Move `conditions` and evidence tier from product level to measurement level (review notes in DECISIONS_AND_RISKS.md).
- Validation on ingestion; condition-mismatch warnings surfaced in ranking and export, not only in the comparison view.
- Literal unions for `weighting` and pairing problem codes.

## P2-2 — Browser verification (carried over from Phase 1)
- Playwright smoke test at 1280 px, 760 px and 460 px: no horizontal overflow, sidebar vs compact navigation.
- Pairing view: primary card + three sub-cards + details; verdict colours blue/red/black with text labels for positive / negative / neutral / pending.
- E2E of the main flows: filter → select two → compare → export; pairing input edits update the result.
- Host prerequisite on the current WSL machine: `sudo apt-get install libnss3 libasound2t64`, then `npx playwright install chromium`.

## P2-3 — Real-data pilot (blocked on P2-1)
- SMSL AO300 PRO and KEF LS50 Meta per docs/IMPLEMENTATION_PLAN.md Phase 3; exact revision and published test conditions verified; licence review before storing any figure or graphic.
