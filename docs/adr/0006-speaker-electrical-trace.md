# ADR-0006 — Speaker electrical load traces (P2-3B)

Status: **proposed** — data model and validation implemented for review; no evaluation logic uses the data until the PL accepts the interpretation section.

## Context

The pairing view's "電気的負荷の適合性" card has been 判定保留 since v0.4 because nominal impedance says nothing about the load an amplifier actually sees. Frequency-dependent impedance magnitude and phase are the measurable quantities behind that card. The product owner asked for a model that holds such traces with provenance, conditions, uncertainty and a clear separation of measured, interpolated and converted points, and asked that no safety or sound-quality verdict be derived from impedance alone.

## Decision (data model, implemented)

- `SpeakerElectricalTrace`: product id, exact `revision` (null = unknown → warning), source, status (observed / manufacturer / estimated), `TraceMethod` (technique, drive level, sense resistor, sweep), `MeasurementConditions`, ordered `TracePoint[]`, uncertainty for |Z| and phase (null = unstated, never 0), capture date, derivation, version.
- `TracePoint`: `frequencyHz`, `impedanceOhms | null`, `phaseDeg | null`, `kind: measured | interpolated | converted`, `derivedFrom` (source frequencies for derived points).
- Validation (`validateTraces`): strictly increasing positive frequencies; |Z| finite and > 0; phase finite and within **[−90°, +90°]**; a trace needs at least two measured points; derived points must reference existing measured frequencies; uncertainty rules as in ADR-0004; revision unknown is a warning; estimated requires derivation.
- Descriptive summary only (`summarizeTrace`): frequency range, point counts, minimum and maximum |Z| with their frequencies, phase extremes. No verdict, no derived "difficulty" metric.
- Interpolation (`resampleTrace`): linear interpolation of |Z| and phase on a log-frequency axis, producing `interpolated` points with `derivedFrom`; the method is recorded in the step note. Extrapolation is refused.

## Physical basis stated (and its limits)

- Phase range: the driving-point impedance of a passive one-port has a non-negative real part, so its phase lies within ±90°. A value outside that range indicates a measurement or sign-convention error, not a property of the loudspeaker. Source: passivity of linear time-invariant one-ports (standard network theory). Active loudspeakers or those with protection electronics are out of scope for this check and must be marked with `conditions.method`.
- Impedance depends on drive level (thermal and nonlinear effects, especially near resonance) and on cabinet state (ports open/closed, damping); hence `driveLevel` and `conditions` are mandatory context, and traces measured under different conditions are not merged.

## Interpretation — proposals requiring PL decision (not implemented)

1. Minimum |Z| and the phase at frequencies near it describe the current demand; the common practice of quoting a "minimum impedance with phase" summary is descriptive and is implemented. Any rule turning it into a verdict (e.g. an "equivalent peak dissipation resistance" style figure, or thresholds such as "below 3 Ω is demanding") is an evaluation method and needs PL approval with cited basis and applicability.
2. Linking a trace to the pairing load card requires amplifier-side data (current capability into low impedance, output vs load, protection behaviour) that the model does not have; the card stays 判定保留 regardless of trace data until such data exist and the combination rule is approved.
3. Interpolation of phase across a resonance peak is approximate; the proposal is to show interpolated points only for display, never as inputs to any verdict.

## Consequences

- Traces are additive data; `DEMO_DATASET` gains no trace in this PR (none of the fictional speakers has one), so UI behaviour is unchanged.
- Validation and summary have boundary tests (±90°, zero/negative frequency, non-monotonic order, single point, derived-from mismatches, uncertainty 0).
