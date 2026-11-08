# Evaluation methodology (draft; not a validated measurement standard)

## Data fidelity

Each metric is recorded with value, unit, measurement conditions, source URL, publisher, capture date, evidence tier and status. Do not directly compare differently conditioned metrics. Document reconciliation rules and version them.

## Missingness

Never fabricate measurements. Missing does not equal poor performance, and missing does not award full marks. Current demonstration's utility score excludes missing metric weights from the denominator and shows coverage; if coverage <70% it displays an undetermined comparison. This 70% threshold is a **prototype UX assumption**, not scientific validation.

## Current v0.4 demo utility score

`Score = sum(weight_i * normalized_i for available i) / sum(weight_i for available i)`

`Coverage = sum(weight_i for available i) / sum(weight_i for all i)`

The demo evaluates 4 indicators (reference price, nominal 8Ω power/ch, THD+N, S/N) over illustrative fixed bounds. It is not an objective audio fidelity metric. Manufacturer specs and third-party tests are distinguished through metadata and are not inherently interchangeable. Normalizations and bounds are temporary; do not call them standard.

## Current demo pairing

`SPL ≈ sensitivity(dB / 1 W / 1 m) + 10*log10(P / 1 W) - 20*log10(distance / 1 m) + stereo_assumption_dB`

`P_required = 10 ** ((target_peak_SPL + safety_margin - sensitivity + 20*log10(distance) - stereo_assumption) / 10)`

`headroom_dB = 10*log10(available_W / P_required)`

The current UI calls >=3 dB spare headroom positive, 0–<3 dB neutral, <0 dB negative, and unavailable output undetermined. These thresholds are **illustrative choices**, not safety certifications. This approximation assumes a simplified free field and sensitivity measured at 1W/1m; 2.83V/1m sensitivity is not interchangeable at 4Ω. Room gain, phase, thermal compression, distance and amplifier dynamic limitations are not fully modeled.

## Pairing future metrics

Use measured speaker impedance magnitude and phase over frequency, power amp output impedance over frequency, load-dependent response and distortion/power sweeps, noise and protection tests. Treat room/placement measurement separately. No speculative 'amp prefers bass' tags.

## Phase 1 port: deviations from the v0.4 prototype

Methodology version `0.4.0-demo` reproduces the prototype's formulas, bounds and thresholds for every input the prototype can produce with the shipped fixtures. For inputs the prototype never encountered, the port defines explicit behaviour instead of inheriting accidental arithmetic. These are not methodology changes; they are recorded here because AGENTS.md requires every intentional behaviour difference to be documented.

| Input | v0.4 prototype | Phase 1 core / web | Rationale |
| --- | --- | --- | --- |
| THD+N = 0 or negative | `log10(0)` → score 100 / NaN | `null` (missing) | Non-positive distortion is not a measurement |
| Negative price, power or S/N | price → 100, power/S-N → 0 | `null` (missing) | Physically impossible values are treated as unknown |
| Price = 0 | score 100 | `null` (missing) since 0.5.0-demo | Product-owner decision 2026-11-08 (ADR-0003) |
| Budget field empty or 0 | no limit (`+v \|\| Infinity`) | no limit (web maps to `null`) | Parity |
| Budget negative | nothing passes | nothing passes | Parity |
| Product with unknown price under a budget | included (`null <= max` is true) | excluded | Unknown price cannot be proven affordable |
| Amplifier power ≤ 0 or non-finite | headroom −∞ → negative | `null` → 判定保留 | Invalid data is unknown, not a verdict |
| Speaker nominal load other than 4 Ω / 8 Ω | uses the 4 Ω figure | `null` → 判定保留 | No figure exists for that load |
| Speaker nominal load ≤ 0 or non-finite | computed anyway | `invalid-input` (`speaker-load-invalid`) | Input validation |
| Two products with differing or unrecorded conditions | compared anyway (fixtures identical) | condition-dependent rows withheld as 条件不一致（比較保留） | AGENTS.md §4 |
| CSV cell for a `null` price/power | `"null"` | `""` | Missing is empty, not the string "null" |
| CSV string cell starting with `= + - @ TAB CR` | written verbatim | prefixed with `'` | Spreadsheet formula-injection guard |
| JSON export `date` | fixed `2026-11-08` | actual export date | Bug fix |
| JSON export shape | `version 0.1.0`, `computed: {coverage, score}` | `version 0.3.0`, `computed` adds status, metric scores, weights used, `methodologyVersion` and `provisionalScore`; products carry provenance and `fictional: true` | Traceability |
| JSON `computed.score` below the coverage gate | numeric | `null` since 0.5.0-demo (`provisionalScore` keeps the internal ordering value) | Product-owner decision 2026-11-08 (ADR-0003) |

Convention note: 2.83 V ≙ 1 W into 8 Ω (2.83² = 8.0089 W, a 0.005 dB difference that is ignored).

## Methodology 0.5.0-demo (2026-11-08)

First Phase 2 change, decided by the product owner after the Phase 1 review (ADR-0003). Everything else is identical to 0.4.0-demo.

| Change | 0.4.0-demo | 0.5.0-demo |
| --- | --- | --- |
| Reference price of 0 JPY | valid value, price score 100 | invalid data: price score `null`, excluded from the denominator, coverage drops accordingly. Genuinely free products will get an explicit representation later. |
| Published JSON `computed.score` when coverage < 70 % | numeric (same value the ranking uses) | `null`. The internal ordering value is published as `computed.provisionalScore` and is not a rating. |
| UI | unchanged: 比較保留 / `—` below the gate | unchanged |
| Export format version | 0.2.0 | 0.3.0 |
