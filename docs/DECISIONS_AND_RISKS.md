# Open questions / known limitations

- v0.4 contains *only fictional demonstration fixtures*. No real-world device compatibility can be inferred.
- Existing demo score normalization and 70% coverage gate are product hypotheses, not scientifically calibrated; port as-is for continuity before methodology review.
- Reference headroom calculation approximates free field and may not match room acoustics; reference source code may have specific stereo assumption / sensitivities. Preserve and document behavior, then propose changes separately.
- Amplifier power at nominal load is insufficient to assess real speaker load stability; impedance magnitude and phase, current limits and protection behavior require measurements.
- Sonic 'synergy' must not be inferred from amplifier brand adjectives, subjective 'bass ability' or unsupported assumptions.
- Public measurement datasets and graphs require license review before copying.
- Need later requirements for product revisions, uncertainty and pricing history. These are not Phase 1 blockers.

## Notes from the Phase 1 independent reviews (2026-11-08)

Recorded for the Phase 2 data-model work; none of these blocks Phase 1.

- One `MeasurementConditions` record per product is attached to three physically different metrics. Power needs load/channels/bandwidth, S/N needs weighting and reference level, THD+N needs output level. The model must carry conditions per measurement (see `Measurement.conditions` in DATA_MODEL.md), not per product.
- `DemoProduct.evidence` is product-level; which metric is independently measured versus manufacturer-stated is not representable yet. Evidence tier must move to the measurement.
- `normalize` treats negative values as missing, which is right for the four demo metrics but wrong for metrics with negative native ranges (e.g. noise floor in dBV). Per-metric validity rules belong in the metric definition.
- `MeasurementConditions.weighting` collapses to `string`; pairing `problems` are free strings. Tighten to literal unions once the vocabularies settle.
- Ranking and export never consult `compareConditions`; with a single demo condition set this is moot, but real data needs a ranking path that reports condition warnings.
