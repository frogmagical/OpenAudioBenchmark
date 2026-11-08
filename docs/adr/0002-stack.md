# ADR-0002 — Implementation stack

Status: accepted (2026-11-08, after environment inspection on the lead's machine).

## Decision

| Concern | Choice | Pinned version |
| --- | --- | --- |
| Language | TypeScript (strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`) | 5.9.3 |
| Package layout | npm workspaces: `packages/core` (framework-neutral logic + fixtures), `apps/web` (UI) | npm 10 / Node 22 |
| Build / dev server | Vite, relative `base` so the static output also works from a sub-path | 8.3.6 |
| Unit and DOM tests | Vitest; `packages/core` runs in Node, `apps/web` runs in jsdom | 5.1.0 / jsdom 31.0.0 |
| Lint | ESLint flat config + typescript-eslint recommended | 10.14.0 / 8.72.1 |
| UI framework | None. The v0.4 prototype is vanilla DOM with template strings; porting it 1:1 to typed modules keeps visual parity verifiable and the dependency surface minimal. | — |
| CI | GitHub Actions: baseline hash check, `npm ci`, typecheck, lint, test, build | — |

`packages/core` is consumed by `apps/web` as TypeScript source through the
package `exports` field (no separate compile step in Phase 1).

## Alternatives considered

- **React/Preact**: rejected for Phase 1. The UI has six static views, a few
  forms and template-string rendering; a framework would mean re-authoring the
  approved markup and CSS rather than porting it, which makes regressions
  harder to spot. Can be revisited in Phase 2 when provenance views grow.
- **pnpm / yarn**: rejected; npm workspaces are sufficient and need no extra tooling.
- **TypeScript 6/7**: available on the registry but very recent; 5.9 is the
  version the current typescript-eslint and Vitest tooling is validated against.
- **Playwright for the smoke test**: configured as optional. Chromium cannot
  start on the lead's WSL host without system libraries (`libnss3`,
  `libasound2`) that need root to install, so the Phase 1 smoke test runs the
  real UI module in jsdom instead and visual parity is reported as
  *not verified by screenshot* until a browser runner is available.

## Consequences

- One `npm ci && npm test && npm run build` reproduces CI locally.
- Methodology constants live in `packages/core/src/methodology.ts`; every
  computed result carries `methodologyVersion`.
