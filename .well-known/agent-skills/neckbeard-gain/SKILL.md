---
name: neckbeard-gain
description: >
  Local telemetry report and dashboard for NeckBeard: tokens used, cost, turn
  performance, code reuse %, refactor line deltas, PreToolUse guard blocks, and
  security issues identified and resolved (defaulting to .ai-audit/ VIBES data
  when present). Use for /neckbeard-gain, "neckbeard stats", "neckbeard board",
  or "what has neckbeard caught".
---

# Neckbeard Gain

Show the project's local telemetry and security scoreboard. One-shot report; edits no project source files.

## Data Sources (100% Local, VIBES-First)

1. **VIBES Protocol (`.ai-audit/manifest.json` & `.ai-audit/annotations.jsonl`):** When `.ai-audit/` is present in the repository, default to reading it first for session timelines, file line-range deltas (`created` / `modified` / `deleted`), PRISM `risk_score` distributions, EVOLVE `decision` counts, and TRACE incident/IoC resolution counts.
2. **Project Load & Trust-Boundary Store (`.neckbeard.json` or `~/.config/neckbeard/projects/`):** Read the project's default load target, sharing status (`shared: true` in Git vs. `shared: false` local), and internal/external trust-boundary counts.
3. **Local Telemetry Store & Guard Counters (`~/.config/neckbeard/telemetry/sessions.jsonl` & `guard-stats.json`):** Read recorded session cost (`$`), token totals, active agent time, definition reuse %, net refactor line deltas, and `PreToolUse` guard blocks.

## Execution

Run `node hooks/band-import.js --summary` (from the NeckBeard plugin root or repository root) to aggregate `.ai-audit/` VIBES records, session transcripts, and guard counters and regenerate `~/.config/neckbeard/telemetry/dashboard.html`. If the user asks to open the visual board, run `node hooks/band-import.js --open` (or `/neckbeard band board`).

Present the summary clearly with:
- **Load Target & Sharing Mode** (`.neckbeard.json` shared vs. local)
- **Trust-Boundary Map Summary** (`external` ingress/egress/supply and `internal` auth/data/exec/ai counts)
- **Tokens, Cost & Agent Time**
- **Refactor & Code Reuse** (reused vs. new definitions, net lines added/removed)
- **Security & VIBES Health** (`PreToolUse` blocks, security/TRACE findings identified vs. resolved, PRISM max risk score)
- **Local Command Center Path** (`~/.config/neckbeard/telemetry/dashboard.html`)
