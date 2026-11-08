# ADR-0003 — Methodology 0.5.0-demo: price 0 is invalid; withheld scores are published as null

Status: accepted (2026-11-08, product-owner decision at the Phase 1 review).

## Context

The Phase 1 port (methodology `0.4.0-demo`) reproduced two behaviours of the v0.4 prototype that the independent core review flagged as questionable:

1. A reference price of 0 JPY scored 100 on the price metric. In real datasets 0 is a common placeholder for "unknown".
2. Products below the 70 % coverage gate still carried a numeric `score` in the JSON export, although the UI withholds it. A consumer ignoring `computed.status` would read a number the methodology says must not be shown.

## Decision

1. Price 0 is invalid price data. It is excluded from the price score (`null`, treated as missing) and therefore lowers coverage. Truly free products will be represented explicitly in a later data-model revision, not through a 0 price.
2. In the public JSON export, `computed.score` is `null` unless `computed.status === 'scored'`. The internal ordering value remains available as `computed.provisionalScore` for analysis and is not a published rating.

The methodology version is bumped to `0.5.0-demo` and the export format to `0.3.0`. The change ships in its own PR, separate from the Phase 1 deliverable.

## Consequences

- `NormalizationBounds.requirePositive` expresses rule 1 per metric (price and THD+N true; power and S/N keep 0 as the bottom of their range).
- Ranking inside the pending group still uses the internal value, as in v0.4.
- Every result carries `methodologyVersion: '0.5.0-demo'`.
