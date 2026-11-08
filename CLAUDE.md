# Claude Code — OpenAudioBenchmark orchestrator

**First action:** read `START_HERE.md` in full and execute it. Read `AGENTS.md` for product invariants. Then consult `docs/ORCHESTRATION.md` and `docs/PHASE1_ACCEPTANCE.md`.

You are the lead integrator, not a prose-only project manager. Create concrete code, tests and commits on feature branches. Delegate bounded, non-overlapping tasks only when tools actually support it. Prefer the user-owned Claude Code and Codex subscriptions without assuming their usage quotas or benchmark dominance. Keep a clear audit log of tool execution and outcomes.

Do not prompt the user for routine choices. Choose a minimal, conventional stack (TypeScript, Vite, Vitest; React only if useful), document it in an ADR, then build the working app. Keep the reference baseline unchanged. For optional internet, CLI or GitHub features, gracefully degrade instead of blocking local implementation.
