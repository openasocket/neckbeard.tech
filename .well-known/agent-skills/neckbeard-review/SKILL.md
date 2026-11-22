---
name: neckbeard-review
description: >
  Review a change for correctness, the trust boundary, speed and scale at the
  named load, whether internal complexity is hidden behind a simple user
  experience, and whether the change is finished. Use for "review this",
  "security review", "review my PR", "review the last commit", or
  /neckbeard-review. Reports only; changes no code.
argument-hint: "[--ci]"
---

# Neckbeard review

Review a change against the gates in `skills/neckbeard/SKILL.md` without restating them. Reports only; changes no code.

## Steps

1. **Scope.** Review what the user names, or the uncommitted changes, or the last commit.
2. **Context.** Read the diff and the callers, callees, and tests it connects to. If `.neckbeard.json` exists, compare the diff against its `boundaries` map and flag any unreviewed trust-boundary expansion (`+new` external ingress/egress/supply or internal auth/data/exec/ai sinks) for explicit gate verification. If `.ai-audit/` (VIBES protocol) exists, check high-risk PRISM annotations (`risk_score >= 0.60` in `.ai-audit/annotations.jsonl`) on changed files, and flag any direct edit or deletion of immutable `.ai-audit/` provenance artifacts (`manifest.json`, `annotations.jsonl`, `blobs/`, `attestations/`, `incidents/`, `evidence/`) as **Must fix**.
3. **Gates.** Read the three gates (`Safe`, `Fast and scalable at the named number`, `Done`), the question ladder, and the accepted-risk rules from `skills/neckbeard/SKILL.md` rather than copying them. Say the load you assumed.
4. **Prove every finding.** A finding needs a concrete case:
   - **Security:** who sends what and what they get.
   - **Correctness or UX failure:** this input or action, this wrong result or leaked internal error.
   - **Performance or scale:** this input size or concurrency at the named load, this bottleneck or race.
   No case, no finding. Confirm the check is really missing, including middleware and framework defaults.
5. **Accepted risk.** A `risk:` comment that names its limit is a decision, not a finding, unless it illegally defers a trust check or data-loss write, or the current load already crosses it.
6. **Variant search.** For every **Must fix** finding, search the repo for the same pattern elsewhere and list any variants under that finding.
7. **Fix shape.** Propose the smallest fix at the root, preferring fixes that delete code and hide necessary complexity inside the module.

## Output

Plain English, short sentences; explain a technical term the first time you use it.

Start with:
- `What this change does:` in two or three sentences.
- `Trust boundary:` on one line.
- `Load assumed:` on one line.

Number findings across three groups only (no other severity taxonomy or vulnerability IDs):
- **Must fix:** exploitable hole, data loss, wrong result on a normal path, or a Fast rule broken at the named load. A Fast miss belongs in one group only, Must fix, and only when it breaks the named load.
- **Should fix:** a gate with no test, a failure path that drops data or leaks raw internals to the user, a duplicate source of truth, or internal complexity pushed onto the end user or caller.
- **Nice to have:** the ladder, not a gate—dead code to delete, an existing repo helper to reuse by path, near-copies to merge, a new abstraction, or a knob nobody asked for.

Each finding has a title, a `file:line` location (plus any variant locations), **What this is**, **Problem**, **Fix**, and **If we skip it**.

End with `Verdict: Ship.` or `Verdict: fix N first.` and `Not checked:` when something mattered and could not be seen. Nothing found: `No findings. Ship.` and one line on what was checked.

## Gate mode (`--ci`)

When invoked with `--ci`, print the findings in the format above, then one last line and nothing after it: `{"verdict":"pass|fail","mustFix":N}`, with `pass` only when `mustFix` is 0. This skill does not set the process exit code. A pipeline that needs a real failure reads that last line in its own wrapper.
