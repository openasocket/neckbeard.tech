# NeckBeard (neckbeard.tech) auth.md

How AI coding agents, CLI skill installers, and developer tools connect to **neckbeard.tech** (`https://neckbeard.tech`) to discover, load, and verify the NeckBeard principal-engineer skillset and project badges.

## Audience

Autonomous AI coding agents (Claude Code, Codex, GitHub Copilot CLI, Antigravity CLI, Gemini CLI, Grok CLI, Pi / Oh My Pi, OpenCode / Kilo Code, Cursor, Windsurf, Kiro), skill discovery clients, and CI/CD pipelines.

## No Authentication Required (100% Public & Zero Telemetry)

All specifications, Agent Skills Discovery v0.2.0 endpoints, normative Markdown documents, and SVG/PNG project badges on `https://neckbeard.tech` are **public and require no authentication, API keys, or session cookies**:

- **Agent Skills Discovery v0.2.0 (`application/json` & `text/markdown`):**
  - `GET https://neckbeard.tech/.well-known/agent-skills/index.json` — Agent Skills Discovery v0.2.0 index with SHA-256 digests for all 5 skills
  - `GET https://neckbeard.tech/.well-known/agent-skills/neckbeard/SKILL.md` — Core writing rules, 4 framing questions, 6-rung minimalist ladder, and 3 gates (`Safe`, `Fast`, `Done`)
  - `GET https://neckbeard.tech/.well-known/agent-skills/neckbeard-review/SKILL.md` — Diff review with concrete exploit/load proof, variant search, and `--ci` JSON verdict
  - `GET https://neckbeard.tech/.well-known/agent-skills/neckbeard-audit/SKILL.md` — Repository audit (`lite` flow/boundary audit or `complete` exhaustive file audit)
  - `GET https://neckbeard.tech/.well-known/agent-skills/neckbeard-debt/SKILL.md` — Technical debt & `risk:` / `shortcut:` ledger enforcing the accepted-risk boundary
  - `GET https://neckbeard.tech/.well-known/agent-skills/neckbeard-gain/SKILL.md` — Local telemetry report & HTML dashboard (`~/.config/neckbeard/band/board.html`)
- **Normative Agent Manifests & Portable Rulesets (`text/markdown`):**
  - `GET https://neckbeard.tech/agents.md` — Normative Agent Manifest & quick-load guide
  - `GET https://neckbeard.tech/AGENTS.md` — Standalone drop-in `AGENTS.md` ruleset (byte-identical to `neckbeard/SKILL.md` body)
  - `GET https://neckbeard.tech/INSTALL.md` — Per-host plugin & extension installation guide
  - `GET https://neckbeard.tech/llms.txt` — Curated LLM index
  - `GET https://neckbeard.tech/llms-full.txt` — Full concatenated corpus of all 5 skills and guides
  - `GET https://neckbeard.tech/index.md` (or `GET https://neckbeard.tech/` with `Accept: text/markdown`) — Markdown representation of the website
- **Machine Discovery & Liveness (`application/json` & `application/linkset+json`):**
  - `GET https://neckbeard.tech/.well-known/api-catalog` — RFC 9727 API catalog (`application/linkset+json`)
  - `GET https://neckbeard.tech/openapi.json` — OpenAPI 3.1.0 specification
  - `GET https://neckbeard.tech/index.json` (also `/agents.json`, `/.well-known/agents.json`) — Machine-readable skillset & `.neckbeard.json` schema metadata
  - `GET https://neckbeard.tech/api/health` — Liveness check (`200 OK`)
- **Official Badges & Seal of Survival (`image/svg+xml` & `image/png`):**
  - `GET https://neckbeard.tech/assets/badge.svg` & `https://neckbeard.tech/assets/badge.png`
  - `GET https://neckbeard.tech/assets/seal.svg` & `https://neckbeard.tech/assets/seal.png`

## Security & Privacy Guarantees

- **Zero network telemetry:** Neither the NeckBeard plugin (`openasocket/NeckBeard`) nor `neckbeard.tech` collects agent telemetry or requires an account. The Claude Code `AbovePrompt` banner and `~/.config/neckbeard/band/board.html` dashboard run 100% locally.
- **Strict `.neckbeard.json` censorship:** When `.neckbeard.json` is shared in Git (`"shared": true`), NeckBeard restricts boundary entries to `<repo-relative-posix-path>-><closed-sink-enum>` and blocks any URLs, internal hostnames, IP addresses, emails, or secrets.
