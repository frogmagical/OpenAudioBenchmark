# ADR-0006 — Speaker electrical load traces (P2-3B)

Status: **proposed** — data model and validation implemented for review; no evaluation logic uses the data until the PL accepts the interpretation section.

## Context

The pairing view's "電気的負荷の適合性" card has been 判定保留 since v0.4 because nominal impedance says nothing about the load an amplifier actually sees. Frequency-dependent impedance magnitude and phase are the measurable quantities behind that card. The product owner asked for a model that holds such traces with provenance, conditions, uncertainty and a clear separation of measured, interpolated and converted points, and asked that no safety or sound-quality verdict be derived from impedance alone.

## Decision (data model, implemented)

- `SpeakerElectricalTrace`: product id, exact `revision` (null/blank = unknown → warning), source, status (observed / manufacturer / estimated), **`passivity`** (passive / not-passive / unknown), `TraceMethod` (technique, drive level, sense resistor, sweep), `MeasurementConditions`, ordered `TracePoint[]`, uncertainty for |Z| (absolute/range in Ω or relative; null = unstated, never 0) and phase, capture date, derivation, version.
- `TracePoint`: `frequencyHz`, `impedanceOhms | null`, `phaseDeg | null`, `kind`: `measured` (as recorded), `converted` (same frequency, value converted from another representation; `conversion {from, method, originalRecordId}` required), `interpolated` (synthesised; `derivedFrom` = bracketing adjacent primary frequencies `[lo, hi]` or `[f]` for an exact hit). Measured and converted points are *primary*; interpolated points never are.
- Validation (`validateTraces`): strictly increasing positive frequencies; |Z| finite and > 0; phase finite; phase within **[−90°, +90°]** enforced as an error only for `passivity: 'passive'`, downgraded to a warning for `unknown`, disabled for `not-passive`; ≥ 2 primary points; interpolated points must be bracketed by adjacent primary points (no extrapolation, no duplicate or reversed ancestry); converted points carry conversion metadata; uncertainty rules as ADR-0004 plus unit must be Ω; sense resistor and numeric conditions sane; blank strings count as unstated; duplicate ids in the supplied product/source context are reported, not resolved silently.
- Descriptive summary only (`summarizeTrace`): frequency range, point counts (total / measured / primary), minimum |Z| with its frequency **and the phase recorded at that same point**, maximum |Z|, phase extremes with their frequencies. No verdict, no derived "difficulty" figure.
- Interpolation (`resampleTrace`): linear in |Z| and phase on a log-frequency axis between adjacent primary points, recorded as an `interpolate` step with the trace version and method version; skipped requests carry a reason (outside range, invalid frequency, missing neighbour values, too few points). Extrapolation is refused.

## Physical basis stated (and its limits)

- Phase range: the driving-point impedance of a passive linear time-invariant one-port has a non-negative real part, so its principal phase lies within ±90° inclusive (see e.g. J. O. Smith, *Physical Audio Signal Processing*, "Properties of Passive Impedances", https://www.dsprelated.com/freebooks/pasp/Properties_Passive_Impedances.html). A value outside that range on a passive device indicates a measurement or processing error — a sign-convention flip cannot produce it, since it preserves |phase|. Active loudspeakers or protection electronics in the signal path are outside the rule; they are declared `not-passive`.
- Sign convention: positive phase = inductive (current lags voltage), the usual electrical convention. Published plots do not all follow it; the convention of each source must be checked before ingestion (Stereophile documents historical reversed plots in its measurement methodology articles).
- Impedance depends on drive level and signal (thermal and nonlinear effects, especially near resonance), on cabinet state (ports open/closed, damping), on conditioning/break-in and thermal history, and on the measurement circuit (sense-resistor loading, input impedance, calibration). The ARTA *LIMP* tutorial (§3.1, https://www.artalabs.hr/AppNotes/LIMP_Tutorial_Version_2_4_English.pdf) and the REW impedance-measurement help (https://www.roomeqwizard.com/help/help_en-GB/html/impedancemeasurement.html) describe these effects for the respective tools. Hence drive level, technique and conditions are recorded, and traces measured under different conditions are never merged. These references support recording context; they are not used as correction factors.

## Storage policies (product decisions, not physics — for PL confirmation)

1. A trace needs at least two primary points; a single impedance sample would be stored as a `Measurement`, not a trace.
2. |Z| must be > 0: an exact short is passive but is not meaningful loudspeaker data.
3. A point with neither |Z| nor phase is rejected (omit the point instead).
4. Uncertainty-aware tolerance on the ±90° rule (e.g. accepting 90.3° ± 1°) is **not** applied; out-of-range values on passive traces are errors until the PL sets a policy.

## Interpretation — proposals requiring PL decision (not implemented)

1. Minimum |Z| with the phase at that frequency is descriptive and implemented. Any rule turning it into a verdict (an "equivalent peak dissipation resistance" style figure, or thresholds such as "below 3 Ω is demanding") is an evaluation method and needs PL approval with cited basis and applicability.
2. Linking a trace to the pairing load card requires amplifier-side data (current capability into low impedance, output vs load, protection behaviour) that the model does not have; the card stays 判定保留 regardless of trace data until such data exist and the combination rule is approved.
3. Interpolated points are for display only and are never inputs to a verdict; interpolation across a resonance peak is approximate.

## Consequences

- Traces are additive data; `DEMO_DATASET` gains no trace in this PR (none of the fictional speakers has one), so UI behaviour is unchanged.
- Validation and summary have boundary tests (±90° inclusive/exclusive per passivity mode, zero/negative/non-finite frequency, non-monotonic order, single point, bracketing and ancestry of interpolated points, converted points, uncertainty 0 / unit, context duplicates, blank strings).
- Review round 1 (Codex, read-only) found five major issues — uncertainty unit, converted-point lineage, unvalidated interpolation ancestry, silent duplicate context, passivity scope — all addressed above.
