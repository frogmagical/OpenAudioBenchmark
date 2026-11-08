# OpenAudioBenchmark — Claude Code / Codex startup handoff

This repository import package contains the user-approved **v0.4** standalone prototype, scientific-methodology guardrails, multi-agent orchestration instructions and Phase 1 acceptance criteria.

**To start:** give this ZIP to Claude Code in VS Code and say: **「このZIPファイルを基に作業を開始せよ」**. The agent must locate `START_HERE.md`, inspect the repository `https://github.com/frogmagical/OpenAudioBenchmark`, import safely and actually implement Phase 1. The instructions are written to avoid routine clarification questions.

Files: `START_HERE.md` (execution order), `CLAUDE.md` (Claude entry), `AGENTS.md` (all agents), `docs/ORCHESTRATION.md` (roles), `docs/tasks/PHASE1_TASKS.md` (assignments), `docs/PHASE1_ACCEPTANCE.md` (completion gates), `docs/` (product and science), `prototype/index.html` (immutable baseline).

No AWS is needed. GitHub pushing or opening a PR depends on existing local credentials; never imply that credentials are bundled. If CLI cross-agent integration is missing, the lead must continue serially and report that exception rather than halt.

## Development (Phase 1 workspace)

Requirements: Node 22 (`.nvmrc`) and npm 10. No cloud resources, no network access at runtime.

| Command | What it does |
| --- | --- |
| `npm ci` | Install pinned dependencies |
| `npm run dev` | Start the web app (Vite dev server, `apps/web`) |
| `npm run build` | Production build to `apps/web/dist` (relative paths, works from a sub-path) |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | `tsc` for `packages/core` and `apps/web` |
| `npm run lint` | ESLint over the repository |
| `npm test` | Vitest: core unit tests (Node) and UI smoke tests (jsdom) |
| `npm run verify:baseline` | Confirm `prototype/index.html` is byte-identical to the approved v0.4 |

Layout:

- `packages/core` — framework-neutral evaluation logic and the fictional demo fixtures. Every computed result carries `methodologyVersion`.
- `apps/web` — the six-view workspace UI (vanilla TypeScript + Vite). Markup and CSS are ported from the prototype; all numbers come from `packages/core`.
- `prototype/index.html` — immutable v0.4 reference. Never edit; CI checks its hash.

All data shipped in Phase 1 is fictional demonstration data and is labelled as such in the UI and in exports.
