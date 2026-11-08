# Multi-agent development operating model

## Intended setup

- **Human product owner**: final approval on scope/methodology and merging to `main`.
- **Claude Code lead/orchestrator**: plans and delegates, handles shared architecture, integration, CI, Git operations and communication.
- **Claude worker / UI**: migrates approved UI and keyboard/mobile accessibility. Owns `apps/web/**` except shared integration files as assigned.
- **Codex worker / core**: implements pure, typed score, data coverage, pairing calculations and fixtures. Owns `packages/core/**` and its tests. Tool availability must be established first.
- **Independent reviewer**: preferably another model than the implementer; reviews diff, scientific assumptions, test boundaries and UX regressions. Read-only; may be invoked after implementation rather than constantly running.

## Practical dispatch

1. Lead confirms local working tree, tool capabilities, budget constraints and dependency graph.
2. Lead writes task definitions with files owned, inputs/outputs, acceptance tests and non-goals. Use `docs/tasks/PHASE1_TASKS.md` as initial backlog.
3. Parallelism: two workers maximum; use `git worktree` for concurrent editing. Give each a branch, fixed file ownership and deliverable checklist. For one integration point, let lead own it.
4. Codex access check: inspect installed binaries/extensions and built-in tool help; invoke the actual supported interface, never guess command flags or assume MCP endpoint shape. If missing, lead implements the core serially and labels review as pending.
5. Workers report exact changes and executed tests. Lead integrates through normal merges/cherry-picks onto the feature branch, resolves conflicts, verifies final code, and runs complete CI-equivalent checks.
6. Independent reviewer supplies issues with severity, location, reproduction and proposed test. Lead fixes and reruns checks. Only human approves final merge to `main`.

## Tool selection

- Repository inspection and patching: local shell, editor and Git.
- Type safety / tests: `tsc`, Vitest, lint and Vite build, only once scripts are installed.
- Browser and screenshots: Playwright or available actual browser runner; if missing, mark visual parity **not verified** rather than invent it.
- Public measurement research: do not do in Phase 1, except to clarify source licensing; do not make real-product claims.
- GitHub PR creation: `gh` if installed and authenticated, or available connector. Else leave branch and a PR body template. No token exposure.
- Do not treat external benchmarks alone as justification for model routing. Measure actual task correctness, regressions, review defects, and time/usage **if observable**; log unknown usage as unknown.

## Agent performance log

For each task, optionally append a row to `docs/agent_runs.csv` with: task_id,agent,model_if_known,started_at,finished_at,tests_passed,tests_failed,review_findings,tool_failures,token_usage_if_available,notes. Never fabricate metrics. Do not calculate a performance leaderboard from incomparable tasks.

## Hard stop / escalate only when needed

Request user action only for inaccessible ZIP, non-resolvable merge conflict risking existing work, unavailable GitHub credentials to publish, destructive action, cloud deployment, pricing, or a scientific methodology change requiring product-owner approval. Continue any other independent work.
