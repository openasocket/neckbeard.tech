---
title: "NeckBeard — Get Clean, Safe, Production-Ready Code from Your AI Agent (neckbeard.tech)"
description: "You don't need to know every security hole or scaling trap—NeckBeard knows them for you. Automatically maps your project, audits your repo, remembers your traffic targets, and makes AI agents write half the code with the right protections built in."
url: https://neckbeard.tech/
---

# NeckBeard — Half the code. None of the blind spots. Built for everyday agent users.

You don't need to know every security hole or database scaling trap—NeckBeard knows them for you. He automatically maps your project's risky spots, remembers how much traffic you expect, stops your AI agent from writing 300 lines of bloated code or exposing one user's data to another, and audits your whole repo in plain English.

- **Repository:** https://github.com/openasocket/NeckBeard
- **Agent Manifest:** https://neckbeard.tech/agents.md
- **Drop-In `AGENTS.md`:** https://neckbeard.tech/AGENTS.md
- **Agent Skills Discovery (v0.2.0):** https://neckbeard.tech/.well-known/agent-skills/index.json
- **Install Guide:** https://neckbeard.tech/INSTALL.md

---

## 01. What It Does: You Focus on What to Build. He Handles What Could Go Wrong.

Most people using AI coding agents know what feature they want, not the twenty invisible ways an agent's first draft can leak customer data, crash under real traffic, or rack up a huge token bill. NeckBeard adds a seasoned principal engineer to your agent—combining [Ponytail](https://ponytail.dev)'s code-shrinking checklist with automatic project mapping, plain-English repo audits, and a live safety guard.

### Six Core Capabilities

1. **Automatic Project Risk Map (`/neckbeard map`):** Automatically scans and saves a compact map in `.neckbeard.json` showing where requests enter your app, where external APIs are called, and where logins, database queries, or shell commands happen—and warns you (`⚠ +1 boundary`) whenever your agent quietly adds a new one.
2. **Two-Speed Repo Audit & Fix Plan (`/neckbeard-audit lite | complete`):** Run `/neckbeard-audit lite` (default) to check your main user flows and critical map spots fast, or `/neckbeard-audit complete` to inspect **every single code, config, and documentation file** in your repo—then ask it to generate a step-by-step `SPEC.md` or Maestro Auto Run fix plan.
3. **Plain-English Change Review (`/neckbeard-review [--ci]`):** Reviews your agent's latest changes before you commit. Instead of cryptic security codes, it tells you in plain English what could break, searches the rest of your repo for copy-paste duplicates of the same bug, and supports `--ci` pass/fail output.
4. **Right-Sized Traffic Memory (`/neckbeard load`):** Without guidance, agents either over-engineer complex enterprise systems for a 20-user tool or write slow database loops that freeze at 100 users. NeckBeard asks once for your expected traffic, saves it to `.neckbeard.json`, and right-sizes every feature to your real numbers.
5. **Live Mistake & Secret Guard (`hooks/guard.js`, `<2ms`):** Watches file edits and terminal commands before they run. Stops your agent from accidentally saving API keys into your code, running risky `curl | sudo bash` scripts, leaking private URLs into shared git files, or erasing your audit history.
6. **Shortcut Tracker & Local Dashboard (`/neckbeard-debt` & `/neckbeard-gain`):** `/neckbeard-debt` tracks temporary shortcuts (`risk:` comments) and alerts you when your traffic outgrows them. `/neckbeard-gain` and the live status bar show your token savings, code reuse %, lines removed, and an interactive visual Project Map (100% local).

### Results

| Metric | No Skill | Ponytail | NeckBeard v0.3.0 |
|---|---|---|---|
| **Lines of code written** | 100% | 48% | **44% (-56%)** |
| **Data-ownership & traffic checks** | 38% | 89% | **100%** |
| **Live secret & mistake guard (<2ms)** | 0% | 0% | **100% blocked pre-write** |

| Capability | Ponytail (`ponytail.dev`) | NeckBeard (`neckbeard.tech`) |
|---|---|---|
| **How It Writes Code** | Write the least new code that solves the task. | Write the least code that is **safe with user data**, **fast at your expected traffic**, and **simple to use with zero extra setup**. |
| **Code-Shrinking Checklist** | 6-step minimalist checklist. | Same 6-step checklist—every step must also pass the **Safe**, **Fast**, and **Done** checks. |
| **Project Risk Map (`/neckbeard map`)** | Checked manually during review. | **Automatically mapped before writing** into a compact **Project Map** in `.neckbeard.json`, with live alerts (`⚠ +1 boundary`) when an edit adds a new outside connection or risky action. |
| **Traffic & Scale (`/neckbeard load`)** | General performance review. | **Saved Traffic Targets** in `.neckbeard.json`. Asks once if unset, remembers your numbers across chats, and flags old shortcuts when your traffic grows. |
| **Live Safety Guard** | Prompt instructions only. | Active pre-action guard (`hooks/guard.js`) that blocks hardcoded API keys, dangerous terminal commands, private URLs in shared config, and audit-log tampering before they run. |
| **Repo Audit Modes (`/neckbeard-audit`)** | Single audit pass. | **`/neckbeard-audit lite`** (fast check of your main user flows & map spots) and **`/neckbeard-audit complete`** (reads every single code, config, and doc file, with an upfront time/token warning). |
| **Live Status Bar & Local Board** | Claude Code bar + optional webhook. | **100% local** Claude Code bar, Pi status bar, and visual HTML dashboard with an **Interactive Project Map Graph** and automatic [VIBES](https://www.itsavibe.ai) (`.ai-audit/`) support. |

---

## 02. Before / After: 312 Lines That Leak User Data → 11 Safe Lines

Say you ask your agent: *"Add an endpoint to download an invoice."* A normal agent checks that a user is logged in, forgets to check that the invoice actually belongs to them (so anyone can view anyone else's bill), forgets to cap the database query, and dumps raw database errors to the screen. NeckBeard collapses 312 bloated lines into 11 safe lines:

```javascript
// neckbeard: parse at edge, authorize object on server, right-sized for real traffic (250 rps)
app.get("/api/invoices/:id", requireAuth, async (req, res) => {
  const id = String(req.params.id || "").trim();
  if (!UUID_RE.test(id)) return res.status(400).json({ error: "Invalid invoice id" });
  const { rows } = await db.query(
    "SELECT id, total_cents, status FROM invoices WHERE id = $1 AND owner_id = $2 LIMIT 1",
    [id, req.user.id]
  );
  if (!rows[0]) return res.status(404).json({ error: "Invoice not found" });
  return res.json(rows[0]);
});
```

---

## 03. How It Thinks: Four Automatic Checks, Six Steps to Smaller Code

Before editing a file, NeckBeard reads your saved project map and traffic target from `.neckbeard.json` (defaulting to the safe choice instead of interrupting you with technical questions):
1. **What Files & Tests Are Affected:** Finds every caller, test, config, and export the change touches so nothing breaks unexpectedly.
2. **Where Risk Crosses the Map (Auto-Detected):** Checks `.neckbeard.json` to see if the code handles incoming requests, logins, database writes, external APIs, or shell commands.
3. **Your Saved Traffic Target (`.neckbeard.json`):** Uses your saved traffic number (e.g., `250 requests/sec, 50k rows`) so code is neither over-engineered nor under-powered.
4. **Complexity Handled Quietly Inside:** Absorbs validation, retries, and ownership checks inside the function so your app stays simple with zero extra knobs.

Then it walks through six steps and takes the first one that passes **Safe · Fast · Done**:
1. *Does it even need to exist?* (skip unrequested settings & bloat)
2. *Is there already a helper for it in this project?* (reuse existing code instead of duplicating)
3. *Can the built-in language or browser API do it?* (use standard built-in features)
4. *Can an already-installed package handle it?* (use what you have; don't add new dependencies)
5. *Can it be one clear, readable line?* (one line anyone can understand at a glance)
6. *Otherwise:* write the smallest code that is **Safe, Fast, and Done** (+ 1 test proving bad input is blocked).

---

## 04. Safety Guard: Stops Leaked API Keys & Risky Commands (`<2ms`)

`hooks/guard.js` checks every file edit and terminal command in under 2 milliseconds and blocks mistakes before they happen:
- **Hardcoded API keys & secrets (`full` & `paranoid`):** Stops AWS, GitHub, Slack, Stripe live, Google, Anthropic, OpenAI, npm tokens, and private keys before they are saved to a file.
- **Audit history protection (`full` & `paranoid`):** Stops commands that try to delete or overwrite your `.ai-audit/` provenance records.
- **Shared config privacy (`full` & `paranoid`):** Blocks private URLs, internal hostnames, IP addresses, emails, or secrets from being written into `.neckbeard.json`.
- **Unsafe terminal shortcuts (`paranoid`):** Blocks piping unverified internet scripts into a shell (`curl … | sudo bash`), disabling SSL checks (`-k`), `chmod 777`, and `--no-verify`.

---

## 05. Audit & Review: Inspect Your Key Flows or Every Single File

- **`/neckbeard-review [--ci]` (Check latest changes):** Explains in plain English who could abuse a bug or what breaks at your traffic target, searches the rest of your repo for duplicate copies of the same mistake, flags new unmapped connections (`⚠ +1 boundary`), and outputs `{"verdict":"pass|fail","mustFix":N}` in `--ci` mode.
- **`/neckbeard-audit lite` (Fast default repo audit):** Uses your `.neckbeard.json` map to trace your main user flows and highest-risk files (logins, webhooks, database queries, external API calls) in seconds.
- **`/neckbeard-audit complete` (Every single file & doc):** Reads **every tracked code, config, workflow, and documentation file** in your repo (with an upfront time and token warning)—even catching places where your `README.md` promises a privacy or security guarantee that the code forgot to implement.
- **Automatic Fix Plan:** At the end of any audit, ask NeckBeard and it will draft a step-by-step `SPEC.md` or Maestro Auto Run playbook to fix the confirmed issues.

---

## 06. Project Map & Live Status Bar (`.neckbeard.json` & `board.html`)

- **Shared by default (`/neckbeard share on`):** Saves your traffic target and project risk map in `.neckbeard.json` (automatically scrubbed of private URLs or secrets) so every chat tab, subagent, or teammate starts with full context. Run `/neckbeard share off` anytime to keep it local-only on your machine.
- **Live Status Bar & Local Visual Board (`/neckbeard-gain` & `/neckbeard band`):** Shows session cost, tokens, code reuse %, lines deleted vs. added, blocked mistakes, and an interactive visual **Project Risk Map** at `~/.config/neckbeard/band/board.html` (100% local, zero cloud telemetry).

---

## 07. Official Badge & Seal of Survival

> **THE NECKBEARD BADGE HONOR CODE:** Only display this badge or seal in your project's `README.md` or docs if:
> 1. You **built the project with NeckBeard** turned on (`full` or `paranoid`), **OR**
> 2. You ran **`/neckbeard-audit`** on an existing repository and **actually fixed** the **Must fix** and **Should fix** issues it found.

- **Compact README Pill Badge:**
  ```markdown
  [![NeckBeard Audited: Minimal Code · Boundary Safe · Right-Sized Scale](https://neckbeard.tech/assets/badge.svg)](https://neckbeard.tech)
  ```
- **Engineering Value Seal:**
  ```markdown
  [![Built & Audited with NeckBeard — Principal-Engineer Verified](https://neckbeard.tech/assets/seal.svg)](https://neckbeard.tech)
  ```
- **Prompt to paste into your AI agent:**
  ```text
  Run /neckbeard-audit on this repository, refactor or rewrite every confirmed Must-fix and Should-fix finding, verify all tests pass, and then add the NeckBeard Audited badge ([![NeckBeard Audited: Minimal Code · Boundary Safe · Right-Sized Scale](https://neckbeard.tech/assets/badge.svg)](https://neckbeard.tech)) to README.md.
  ```

---

## 08. Install in Two Lines & Command Guide

- **Claude Code:** `claude plugin marketplace add openasocket/NeckBeard && claude plugin install neckbeard@neckbeard`
- **Codex:** `codex plugin marketplace add openasocket/NeckBeard && codex plugin add neckbeard@neckbeard`
- **GitHub Copilot CLI:** `copilot plugin marketplace add openasocket/NeckBeard && copilot plugin install neckbeard@neckbeard`
- **Grok CLI:** `grok plugin install openasocket/NeckBeard --trust`
- **Antigravity CLI:** `agy plugin install https://github.com/openasocket/NeckBeard`
- **Gemini CLI:** `gemini extensions install https://github.com/openasocket/NeckBeard`
- **Pi / Oh My Pi:** `pi install git:github.com/openasocket/NeckBeard`
- **OpenCode / Kilo Code (`opencode.json` / `kilo.jsonc`):** `{ "plugins": ["github:openasocket/NeckBeard"] }`
- **Cursor, Windsurf, Kiro, Cline, Zed, or any other tool:** Drop [`AGENTS.md`](https://neckbeard.tech/AGENTS.md) into your project folder or see [`INSTALL.md`](https://neckbeard.tech/INSTALL.md).

### Key Commands

- `/neckbeard map` — Automatically scan or refresh your project's risk map in `.neckbeard.json`
- `/neckbeard-audit [lite|complete]` — Audit your key user flows & map spots (`lite`, default) or every single code, config & doc file (`complete`)
- `/neckbeard-review [--ci]` — Review your agent's latest changes in plain English and check for duplicate bugs across the repo
- `/neckbeard load <traffic>` — Save your expected traffic target (e.g. `250 rps, 50k rows` or `webhook-in=2000 rps`) to `.neckbeard.json`
- `/neckbeard-debt` — List temporary shortcuts (`risk:` comments) and flag any that put user data at risk or have been outgrown by your traffic
- `/neckbeard-gain` — Open your local savings & safety report and visual HTML dashboard
- `/neckbeard share on|off` — Toggle whether `.neckbeard.json` is shared in Git (auto-scrubbed) or kept local-only
- `/neckbeard lite|full|paranoid|off` — Switch how strict NeckBeard is during a session (`full` is default; `ultra` is also accepted as an alias for `paranoid`)
- `/neckbeard band [on|off|import|board]` — Control the live Claude Code status bar and local HTML board
