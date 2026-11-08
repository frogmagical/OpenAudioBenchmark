# OpenAudioBenchmark — cross-agent binding requirements

## Product validity / scientific integrity

1. Separate independent measurement, manufacturer specification, derived estimate and missing data. Preserve publisher, date, original URL, conditions, unit, model revision and uncertainty where available.
2. Missing data is unknown, not zero, not a perfect score and not proof of bad performance. Any coverage threshold is a UX hypothesis, not a calibrated scientific confidence value.
3. No universal objective audio-quality score. Optional user-weighted utility scores must expose weights, normalization, coverage and assumptions.
4. Never compare measurement figures measured under incompatible impedance, channels driven, bandwidth, weighting, level or environment without explicit normalization and rationale.
5. Amp–speaker pairing separates output/headroom estimate, electrical load stability, frequency-dependent electrical effects and room/placement. Report insufficient data as **保留**, never as a safety guarantee.
6. The reference `prototype/index.html` is approved **v0.4**: Japanese-first, white background, left sidebar on desktop, responsive navigation on mobile, distinct views; pairing results use prominent cards, blue positive / red negative / black neutral or pending. Preserve it byte-for-byte.
7. All real-product claims need verifiable sources. No unauthorized data copying, redistribution or scraping.

## Engineering contract

- Read `START_HERE.md` before work. Use a feature branch; never push or merge straight to main.
- Isolate fictional demo data from real measurements, and visibly label it as fictional.
- Prefer a small TS/Vite app and framework-neutral testable core. Keep code readable, typed, minimal and accessible.
- Build tests from the specification, not solely from current output. Cover unknown data, invalid inputs, the illustrative 70% coverage threshold, normalization bounds, SPL/power headroom and unit handling.
- Keep calculated results traceable to inputs and methodology version. Document any intentional behavior change and request approval for changes to scientific interpretation.
- No real data ingestion, cloud deployment, or unattended remote actions in Phase 1.

## Multi-agent boundaries

- Orchestrator owns architecture, sequencing, integration and PR summaries.
- Workers own bounded directory/file sets and provide tests and explicit assumptions. Assign mutually exclusive file ownership or separate git worktrees; no simultaneous editing of the same file.
- Reviewer is independent and read-only by default. Treat review as advice; CI and test execution remain hard gates.
- No recursive or circular delegation, no permission escalation, no uncontrolled parallelism. Start with **two concurrent workers maximum**, and reduce if limits or tooling require it.
- If Codex is unavailable, proceed with the available agent. Never pretend a cross-model review took place.
