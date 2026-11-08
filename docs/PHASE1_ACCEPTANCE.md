# Phase 1 acceptance gates

Run and report actual commands. If tooling uninstalled, report as not run with reason and continue other verification.

## Baseline integrity

- `prototype/index.html` must match the SHA-256 in `prototype/SHA256SUMS.txt`.
- All UI copy and fixture labels must clearly distinguish demonstration data from actual measurements.

## Automated checks

- `npm ci` (after committing lockfile), `npm run typecheck`, `npm test -- --run` (or canonical test script), `npm run build`, `npm run lint` where configured.
- CI must run install, typecheck, tests and build on pull requests. No green check claimed if not run.

## Core contract tests

- Missing inputs propagate as pending/unknown; never 0 or 1 by default.
- Different measurement conditions are marked incompatible rather than combined silently.
- Weighted scores expose coverage and scope. Prototype threshold exactly 70% should be unit-tested, including just below.
- Normalization handles zero and negative prices, absent THD+N, out-of-bounds specifications without NaN/Infinity.
- Pairing SPL/required power/headroom must have reference-unit test cases, invalid distance and unit test cases.
- Sensitivity at 2.83V/1m is not naively treated as 1W/1m for non-8Ω loads.
- Positive/neutral/negative card thresholds and pending case must match reference behavior; never label unmeasured impedance phase safe.

## UI acceptance

- Six navigable views, sidebar on desktop, compact mobile navigation with no unwanted horizontal overflow.
- Catalog filtering, adjustable weights, two-product comparison, CSV/JSON export, pairing input edits update outputs.
- Pairing results present primary card, three subcards and expandable details. Blue=positive, red=negative, black=neutral/pending. Color must not be the only channel: use text labels.
- Browser smoke test and screenshots at representative desktop and mobile widths when tooling available. Report not-run otherwise.

## Delivery

- Record file structure, run commands, open issues, scope changes and tests in PR body.
- No replacing historical prototype; no real measurement claims; no AWS.
- Branch pushed to remote and PR opened if access available; otherwise local commit and reproducible instructions.
- Do not merge `main` without human approval.
