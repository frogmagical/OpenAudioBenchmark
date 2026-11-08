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

`P_required = 10 ** ((target_peak_SPl + safety_margin - sensitivity + 20*log10(distance) - stereo_assumption) / 10)`

`headroom_dB = 10*log10(available_W / P_required)`

The current UI calls >=3 dB spare headroom positive, 0–<3 dB neutral, <0 dB negative, and unavailable output undetermined. These thresholds are **illustrative choices**, not safety certifications. This approximation assumes a simplified free field and sensitivity measured at 1W/1m; 2.83V/1m sensitivity is not interchangeable at 4Ω. Room gain, phase, thermal compression, distance and amplifier dynamic limitations are not fully modeled.

## Pairing future metrics

Use measured speaker impedance magnitude and phase over frequency, power amp output impedance over frequency, load-dependent response and distortion/power sweeps, noise and protection tests. Treat room/placement measurement separately. No speculative 'amp prefers bass' tags.
