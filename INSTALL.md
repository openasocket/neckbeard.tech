# Install

Pick your agent below. Not listed? Most agents read [`AGENTS.md`](AGENTS.md): copy it into your project root, or point your agent at [`skills/neckbeard/SKILL.md`](skills/neckbeard/SKILL.md). For the full host-to-manifest matrix, see [Agent Portability](docs/agent-portability.md).

The Claude Code and Codex plugins run lightweight Node.js lifecycle hooks (`node >= 18`, zero dependencies), so `node` should be on your non-interactive shell `PATH`.

## One-Command Cross-Platform Multi-Harness Installer & Updater (Windows, macOS, Linux)

To automatically detect every compatible AI coding agent installed on your system (`Claude Code`, `Codex`, `GitHub Copilot CLI`, `Grok CLI`, `Antigravity CLI`, `Gemini CLI`, `Pi / Oh My Pi`, `OpenCode / Kilo Code`), update their plugin caches to the current NeckBeard release, disable legacy `ponytail@ponytail` collisions, and rebuild your local Command Center (`~/.config/neckbeard/telemetry/dashboard.html`):

```bash
node scripts/install-all.js
# or: npm run sync
```

Flags:
- `node scripts/install-all.js --dry-run` — Inspect which agent harnesses are detected on your system without making changes.
- `node scripts/install-all.js --keep-ponytail` — Keep `ponytail@ponytail` enabled alongside NeckBeard if both are installed.
- `node scripts/install-all.js --json` — Emit machine-readable JSON output.

## Claude Code

From the command line:

```bash
claude plugin marketplace add openasocket/NeckBeard
claude plugin install neckbeard@neckbeard
```

Or inside an interactive Claude Code session, as two separate prompts:

```text
/plugin marketplace add openasocket/NeckBeard
```
```text
/plugin install neckbeard@neckbeard
```

Claude Code loads [`.claude-plugin/plugin.json`](.claude-plugin/plugin.json), [`hooks/claude-hooks.json`](hooks/claude-hooks.json), and [`hooks/claude-band.json`](hooks/claude-band.json), which activates:
- **`SessionStart` & `SubagentStart`:** injects the active level's ruleset from [`skills/neckbeard/SKILL.md`](skills/neckbeard/SKILL.md), the persisted project load default and concise internal/external trust-boundary map from `.neckbeard.json` (when present or when `NECKBEARD_SURFACE=1`), and the `.ai-audit/` VIBES summary (when present).
- **`UserPromptSubmit`:** switches the session level (`/neckbeard lite|full|paranoid|ultra|off`, where `ultra` is an alias for `paranoid`, or `"stop neckbeard"`), updates the project load default (`/neckbeard load <value>`), refreshes the trust-boundary map (`/neckbeard map`), toggles Git sharing of `.neckbeard.json` (`/neckbeard share on|off`), and controls the Claude Code banner and local HTML telemetry board (`/neckbeard band on|off|import|board`).
- **`PreToolUse` secret, config-censor & command guard:** at `full` (default), blocks hardcoded secrets in `Write`, `Edit`, `MultiEdit`, `NotebookEdit`, and `Bash`, blocks direct agent tampering with immutable `.ai-audit/` VIBES provenance files, and enforces strict censorship on `.neckbeard.json`; at `paranoid`, also blocks `curl … | sh`, disabled TLS verification, `chmod 777`, `--no-verify`, and literal credentials.
- **Claude Code `AbovePrompt` HUD (`hooks/claude-band.json`):** displays live session cost, tokens, turn time, definition reuse %, refactor line delta, open callers, `PreToolUse` guard blocks, security issues found/fixed, and VIBES PRISM risk score, and writes the local NeckBeard Security & Engineering Command Center to `~/.config/neckbeard/telemetry/dashboard.html`.

## Project Config (`.neckbeard.json`) & Git Sharing

By default, when NeckBeard saves your project's load parameters or trust-boundary map, **sharing is enabled (`"shared": true`)** and stored in `.neckbeard.json` at the repository root:
- **What sharing means:** `.neckbeard.json` is designed to be committed to Git so teammates, subagents, git worktrees, and CI workflows share the same load target and concise internal/external trust-boundary map. It is automatically censored so only numeric load targets and repo-relative file paths with closed sink tags (`http-in`, `cli-in`, `webhook-in`, `http-out`, `ci`, `auth`, `sql`, `fs`, `proc`, `serde`, `crypto`, `env`, `ai`) can ever be stored.
- **How to disable sharing (`/neckbeard share off`):** Moves the configuration to `~/.config/neckbeard/projects/<repo>.json`, removes `.neckbeard.json` from the repository (and runs `git rm --cached`), and adds `.neckbeard.json` to `.git/info/exclude` so it is never committed.
- **How to re-enable sharing (`/neckbeard share on`):** Writes the sanitized `.neckbeard.json` back to the repository root and removes it from `.git/info/exclude`.

## Codex

```bash
codex plugin marketplace add openasocket/NeckBeard
codex plugin add neckbeard@neckbeard
```

Codex loads [`.codex-plugin/plugin.json`](.codex-plugin/plugin.json), registers the five skills (`$neckbeard`, `$neckbeard-review`, `$neckbeard-audit`, `$neckbeard-debt`, `$neckbeard-gain`), and loads [`hooks/claude-hooks.json`](hooks/claude-hooks.json) for session activation and `$neckbeard` commands.

## GitHub Copilot CLI

```bash
copilot plugin marketplace add openasocket/NeckBeard
copilot plugin install neckbeard@neckbeard
```

Copilot CLI loads [`.github/plugin/plugin.json`](.github/plugin/plugin.json) (which registers the five skills in `skills/` without hooks) and reads [`AGENTS.md`](AGENTS.md) / [`.github/copilot-instructions.md`](.github/copilot-instructions.md).

## Antigravity CLI & Antigravity IDE

```bash
agy plugin install https://github.com/openasocket/NeckBeard
```

- **Antigravity CLI:** reads the root [`plugin.json`](plugin.json) and loads the five skills (`neckbeard`, `neckbeard-review`, `neckbeard-audit`, `neckbeard-debt`, `neckbeard-gain`) without hooks.
- **Antigravity IDE & GitHub Copilot Editor:** automatically read [`AGENTS.md`](AGENTS.md) (and [`.github/copilot-instructions.md`](.github/copilot-instructions.md)) from the open project root.

## Grok CLI / Grok Build

```bash
grok plugin install openasocket/NeckBeard --trust
```

Plugins in Grok are disabled by default after installation. Enable `neckbeard` interactively via `/plugins` → **Plugins** → press `Space` on `neckbeard`, or enable it in `~/.grok/config.toml`:

```toml
[plugins]
enabled = ["neckbeard"]
```

Start a new session (or reload plugins) and verify with `grok inspect`. Grok loads [`.grok-plugin/marketplace.json`](.grok-plugin/marketplace.json) (`source: "./skills"`), registering `/neckbeard`, `/neckbeard-review`, `/neckbeard-audit`, `/neckbeard-debt`, and `/neckbeard-gain`. For always-on workspace rules without explicit skill invocation, copy [`AGENTS.md`](AGENTS.md) into your project root.

## Pi (`pi`) & Oh My Pi (`omp`)

Pi and Oh My Pi read the `"pi"` entry in [`package.json`](package.json) ([`pi-extension/index.js`](pi-extension/index.js)), which renders a live TUI status bar (`● 🧔 neckbeard: 🛡️ FULL`), injects the active ruleset + `.neckbeard.json` load/boundary map + `.ai-audit/` VIBES summary on every turn, and registers `/neckbeard`, `/neckbeard-review`, `/neckbeard-audit`, `/neckbeard-debt`, and `/neckbeard-gain`.

## OpenCode & Kilo Code

Reference [`.opencode/plugins/neckbeard.mjs`](.opencode/plugins/neckbeard.mjs) in your `opencode.json` or `kilo.jsonc` `plugins` array to inject the active ruleset, load target, and trust-boundary map every turn and register the five skills.

## Gemini CLI

```bash
gemini extensions install https://github.com/openasocket/NeckBeard
```

Loads [`gemini-extension.json`](gemini-extension.json), which sets `contextFileName` to [`AGENTS.md`](AGENTS.md) and discovers `skills/` without auto-loading Claude/Codex hooks (`hooks/hooks.json` is intentionally absent).

## Any Other Host (Cursor, Windsurf, Kiro, OpenCode, Cline, Zed, Amp, Droid)

Copy `AGENTS.md` into the root of a project whose host does not load this plugin. Cursor, Windsurf, and Kiro do not read `AGENTS.md` unless their own rules file includes it (for example, reference `@AGENTS.md` from `.cursor/rules/`, `.windsurf/rules/`, or `.kiro/steering/`).

## Configuration & Environment Variables

No configuration file is required. Optional environment variables and user config:

| Setting | Default | What it does |
|---|---|---|
| `NECKBEARD_LEVEL` | `full` | Default level for new sessions (`lite`, `full`, `paranoid` / `ultra`, `off`; `ultra` is an alias for `paranoid`). Overrides `~/.config/neckbeard/config.json`. |
| `~/.config/neckbeard/config.json` | `{"defaultLevel":"full"}` | Persistent default level when `NECKBEARD_LEVEL` is unset. |
| `NECKBEARD_SURFACE=1` | `0` (off) | Opts into the regex attack-surface file map on `SessionStart`. |
| `NECKBEARD_SUBAGENTS=0` | `1` (on) | Disables injecting the ruleset into subagents on `SubagentStart`. |
| `NECKBEARD_GUARD=0` | `1` (on) | Disables the `PreToolUse` secret and unsafe-command guard. |
