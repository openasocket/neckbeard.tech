---
name: neckbeard-debt
description: >
  Ledger of every accepted risk and deliberate shortcut marked with a `risk:`
  comment (and ponytail's `shortcut:` or `ponytail:` markers), enforcing the
  accepted-risk boundary from skills/neckbeard/SKILL.md. Use for "what risks did
  we accept", "list the shortcuts", or /neckbeard-debt. Reports only.
---

## Scan

Scan tracked and untracked non-ignored files for risk markers:

`git grep --no-index --exclude-standard -nE '(#|//|/\*|--) ?(risk|shortcut|ponytail):'`

If the user names a custom marker (`/neckbeard-debt SECURITY`), search for that instead. Skip hits that are not a deferral. Enforce the accepted-risk boundary from `skills/neckbeard/SKILL.md` without restating its writing rules.

## Output

One row per marker, grouped by file, with `illegal-deferral` rows first under **Must fix now**:

`<file>:<line> · <what can go wrong> · safe at current load because: <reason> · revisit when: <trigger>`

Tag rows with:
- `illegal-deferral`: the marker defers a trust check (auth, object authorization, input parsing, secrets, agent tool safety) or a write that can lose data. Flag these first as **Must fix now** because `risk:` may only defer a cache or a queue.
- `expired-load-trigger`: when `.neckbeard.json` (or local project config) defines `"load"` or `"boundaryLoad"`, the marker's revisit threshold (e.g., `revisit at 100 rps` or `> 10k rows`) has already been reached or exceeded by the project's current load target. Flag these under **Must fix now**.
- `no-trigger`: names no load ceiling or condition to revisit. These silently rot.
- `no-reason`: names no reason the current load is safe without it.
- `unrecorded-decision`: when `.ai-audit/manifest.json` (VIBES protocol) exists in the repo, the `risk:` deferral has no matching `decision` record in `.ai-audit/manifest.json`.

End with `<N> markers, <I> illegal-deferral, <E> expired-load-trigger, <T> no-trigger, <R> no-reason.` (Include `<U> unrecorded-decision` when `.ai-audit/manifest.json` is present.) Nothing found: `No recorded risk. Either the code is clean or the risks are not written down.`

Offer to write the ledger to `RISKS.md`; write only if the user says yes.
