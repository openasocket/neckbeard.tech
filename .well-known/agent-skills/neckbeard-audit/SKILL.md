---
name: neckbeard-audit
description: >
  Audit a repo or folder for the same three gates as neckbeard-review (Safe,
  Fast at the named load, Done), starting at entry points. Lean is the ladder,
  not a gate. Modes: lite (default — targeted execution flows and major
  internal/external data & trust boundaries) or complete (exhaustive audit of
  every single code, config, and documentation file). Use for "audit this repo",
  "security audit", "is this codebase safe", or /neckbeard-audit. One-shot
  report; changes no code.
argument-hint: "[lite|complete] [path]"
---

# Neckbeard audit

Audit a repository or folder against the gates in `skills/neckbeard/SKILL.md` without restating them. One-shot report; changes no code.

## Modes: `lite` (default) vs. `complete`

- **`lite` (default, or `/neckbeard-audit lite`):** Targeted, selective, yet thorough audit of execution flows and major boundaries for data flow, data access, and data use. Start from `.neckbeard.json` (internal and external trust-boundary map), entry points, auth/ownership gates, data stores, external egress, CI/build configs, dependency manifests, and top-level docs (`README.md`, `AGENTS.md`, `CLAUDE.md`, Copilot instructions). Trace the main execution and data paths end to end without reading every peripheral file. List unread files/modules in `Not checked:`.
- **`complete` (`/neckbeard-audit complete`, or when asked for a complete/exhaustive audit):** Every little thing—audit **every single tracked code, configuration, script, workflow, and documentation file** in the repository (or named folder).
  - **Mandatory upfront warning:** When running `complete`, immediately warn the user that an exhaustive audit of every code, config, and documentation file in the repo may take a long time, consume a large number of tokens, and require many tool calls (and state the file count from `git ls-files`).
  - Enumerate all non-vendored files (`git ls-files`), read every code, config, and doc file systematically in batches, verify every cross-file data flow and doc claim, and lift the 20-finding cap so every confirmed finding is reported.

## 1. Map first

- Determine the mode (`lite` unless `complete` was requested) and scope (what the user names, or the whole repo).
- Read the README, docs, agent instruction files (`AGENTS.md`, `CLAUDE.md`, Copilot instructions), `.neckbeard.json`, deploy and build config, CI workflows, dependency manifests and lockfiles, and entry points (routes, handlers, jobs, CLI, webhooks, tool handlers).
- In `lite`, trace the main execution flows and major internal/external data-access and trust boundaries end to end; in `complete`, read every remaining code, config, and documentation file in the scope.
- Go deep where a mistake costs the most: auth, money, personal data, file and shell access, input from the network, hot paths under load, user-facing failure states, least-privilege scopes (credentials, CI tokens, containers, MCP/tool grants), and anything that feeds a model or lets a model act.
- Say what you did not read. Say the load you assumed.

## 2. Look for

Look for breaks in the three gates from `skills/neckbeard/SKILL.md`: Safe, Fast and scalable at the named number, Done. Also check:

- **Broken doc promises and stale agent instructions:** when a doc promises a security property, check, or guarantee the code lacks, report the code gap as a finding (never edit the doc to describe the bug); when an agent instruction file (`AGENTS.md`, `CLAUDE.md`, Copilot instructions) points at missing commands, wrong paths, or unsafe rules, report it.
- **Permissions, CI, privacy, and AI boundaries:** credentials, cloud roles, or MCP tools granted broader permissions than they use; CI workflows running untrusted pull-request code with secrets; personal data in logs, URLs, or error reports; untrusted content or retrieved data reaching a model's context or tools without separation.
- **Supply chain:** no lockfile, an install script, or a dependency nothing imports. Do not add a package-reputation investigation. Run an ecosystem audit command only when that command is already installed. Never install a tool to audit.
- **VIBES provenance (`.ai-audit/`, when present):** prioritize files with High/Critical PRISM `risk_score` (`>= 0.60` in `.ai-audit/annotations.jsonl`), verify immutable `.ai-audit/` artifacts (`manifest.json`, `annotations.jsonl`, `blobs/`, `attestations/`, `incidents/`, `evidence/`) were not hand-edited, and run `vibecheck validate` or `vibetrace scan` only when already installed on `PATH` (never install a tool to audit).
- **Lean is the ladder, not a fourth gate:** dead code, an unused dependency, a new abstraction, or a knob nobody asked for goes under Nice to have. A Fast miss is Must fix only when it breaks the named load.

## 3. Prove it and search for variants

Use the same proof rule, plain-English style, and finding shape as `skills/neckbeard-review/SKILL.md`:
- Every finding needs a concrete case (who sends what and what they get, what input causes what wrong result or leaked internal error, or what load triggers what bottleneck or race). Confirm the check is really missing, including middleware and framework defaults.
- A `risk:` comment that names its limit is a decision, not a finding, unless it illegally defers a trust check or data-loss write, or the current load already crosses it.
- **Variant search:** for each **Must fix** you are reporting, search once for that same pattern and list the copies under that finding. Say when you stopped. Do not search past the findings in this report.

## 4. Output

Start with `Audit mode: lite | complete (N files audited)`, `What this repo does:`, `Attack surface:`, and `Load assumed:` in a few lines.

In `lite` mode, report at most 20 findings (and say how many you left out); in `complete` mode, report all confirmed findings. Number findings across **Must fix**, **Should fix**, and **Nice to have** (no other severity taxonomy or vulnerability IDs). Each finding has a title, a `file:line` location (plus any variant locations), **What this is**, **Problem**, **Fix** (smallest root fix), and **If we skip it**.

End with:
- `Verdict:` and `Not checked:`.
- **Inherited-repo remediation offer:** offer a draft `SPEC.md` for the confirmed Must-fix and Should-fix findings (a `keep`, `refactor`, or `rewrite` decision per component, and `rewrite` only when patching costs more over the life of the code or cannot close a Must-fix finding) or draft Maestro Auto Run playbooks in `.maestro/playbooks/`. Write nothing unless the user asks. Call a workstream approved only after the user approves it in a later reply.
