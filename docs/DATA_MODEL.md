# Data model proposal

Use strongly typed entities and immutable source-backed measurements.

- `Product`: id, maker, model, revision, category, dates, capabilities.
- `Source`: id, publisher, URL, publishedAt?, accessedAt, license?, notes, archive/reference id?.
- `Measurement`: id, productId, metric, value?, unit, status (observed/manufacturer/estimated/missing), sourceId?, conditions object, uncertainty?, updatedAt, version.
- `MeasurementConditions`: frequencyHz?, bandwidthHz?, loadOhms?, loadType?, channelsDriven?, inputSignal?, outputLevel?, weighting?, environment?, method?.
- `PriceObservation`: amount, currency, locale, merchant, timestamp, condition (new/used), taxes/shipping/coupon assumptions, sourceId.
- `SpeakerElectricalTrace`: frequencies, impedanceMagnitude, impedancePhase, provenance and method.
- `ComparisonContext`: constraints (required features, budget, use case), metric weights, policy version.
- `PairingContext`: listening distance, peak SPL target, required safety margin, stereo summation assumption, room context if known.

Use `null` for unknown numerical values, explicit statuses for why, and never represent an unknown uncertainty by 0. Each computed result includes input IDs, methodology version and explanation.

## Licensing

Prefer metadata + links to original plotted measurements. Assess rights and terms before storing/redistributing raw datasets, graphics or scraped prices.
