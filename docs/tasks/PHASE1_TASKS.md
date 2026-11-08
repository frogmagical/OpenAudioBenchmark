# Phase 1 deliverables and ownership

## P0 — Bootstrap (lead, before parallel workers)
- Inspect repository; import docs and prototype safely; preserve original hash.
- Detect Node/npm and browsers; choose minimal conventions and document `docs/adr/0002-stack.md`.
- Establish `package.json`, `tsconfig`, lint/build/test scripts, `.github/workflows/ci.yml`.
- Scope independent worker file ownership; record exact git branches / worktrees if used.

## P1-A — Framework-neutral core (Codex preferred)
- Place demo fixtures and data types in `packages/core/`; fictional product and source labels never imply real observations.
- Isolate weighted utility scoring, bounded normalization, data coverage, explicit missing states.
- Isolate pairing SPL/headroom estimate with units and named assumptions. Do not claim load stability from nominal speaker impedance.
- Write spec-based unit tests including 2.83V vs 1W sensitivity distinction, invalid distance, missing power, score coverage boundary and 0/3 dB headroom boundaries.

## P1-B — UI migration (Claude preferred)
- Place six views in `apps/web/` with clear navigation: overview, catalog, comparison, pairing, methodology, principles.
- Preserve left navigation, white theme, compact data tables, no decorative hero/gradients, responsive narrow layout.
- Preserve export CSV/JSON, user adjustable settings and comparison; use shared core functions when integrated.
- Pairing results: primary card then three subordinate cards; prominent, readable blue/red/black text; missing != negative.

## P1-C — Integration and test (lead)
- Import core into web with no duplicated formula implementations.
- Run typecheck, unit tests, build, lint, minimal smoke E2E if available.
- Compare interactions and screenshots to `prototype/index.html` at desktop and mobile. Record where visual verification unavailable.
- Add explicit known-limits page and methodology version.

## P1-D — Independent review (different agent if available)
- Audit numerical formula assumptions, output unit interpretation and condition of comparisons.
- Check missing data and fictional demo labels, a11y, responsiveness and export escaping.
- Produce reviewer findings with severity and reproducibility; check fixes and rerun CI.

Definition of Done: all acceptance tests from `docs/PHASE1_ACCEPTANCE.md`; user approval needed before merging to main.
