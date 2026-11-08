# OpenAudioBenchmark — Claude Code / Codex startup handoff

This repository import package contains the user-approved **v0.4** standalone prototype, scientific-methodology guardrails, multi-agent orchestration instructions and Phase 1 acceptance criteria.

**To start:** give this ZIP to Claude Code in VS Code and say: **「このZIPファイルを基に作業を開始せよ」**. The agent must locate `START_HERE.md`, inspect the repository `https://github.com/frogmagical/OpenAudioBenchmark`, import safely and actually implement Phase 1. The instructions are written to avoid routine clarification questions.

Files: `START_HERE.md` (execution order), `CLAUDE.md` (Claude entry), `AGENTS.md` (all agents), `docs/ORCHESTRATION.md` (roles), `docs/tasks/PHASE1_TASKS.md` (assignments), `docs/PHASE1_ACCEPTANCE.md` (completion gates), `docs/` (product and science), `prototype/index.html` (immutable baseline).

No AWS is needed. GitHub pushing or opening a PR depends on existing local credentials; never imply that credentials are bundled. If CLI cross-agent integration is missing, the lead must continue serially and report that exception rather than halt.
