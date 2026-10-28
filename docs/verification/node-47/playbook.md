# Designed playbook: upstream pins that resolve and say what they name

Scratch task, run on 2026-10-28 by following `skills/figure-it-out/SKILL.md` in a scratch copy of this pack (`origin/main` without `docs/`): make every member's `upstream.path` resolve at its pinned commit in `cursor/plugins`, and make its form say whether it names a file or a directory.

## Card check

No card matches. Refactor ("the structure changes, the behavior does not") is the closest, but no code structure changes: this is metadata checked against an outside source. Feature, bug fix and planning do not fit either. Recorded as the first `frame` row of the trail.

## Predicate

- C1: Every member's `upstream.path` resolves at its pinned commit. Probe: `harness.ts` reports no `does not resolve` failure.
- C2: A path that names a directory ends in `/`, and a path that names a file does not. Probe: `harness.ts` reports no failures at all.
- C3: The gate adds no failure over the baseline. Probe: `bun test test/` and `bun scripts/check-pack.ts` output against `gate-baseline.txt`. The baseline already has 3 failures, all from tests that read the `docs/` evidence the scratch copy leaves out.
- Anti: No member's `upstream.repo` or `upstream.commit` changes. Probe: the `pins` block of `harness-baseline.json` against `harness-after.json`.

## Scope

21 members, one manifest field each, plus any test that pins a path (`how`, `sharpen`, `technical-writing`, `statechart`, `explain`). About 30 minutes. Blocker found while grounding: none; `gh` is authenticated and the upstream API answers.

## Rigor

Medium. Every edit is one reversible line, which argues for less. But the pin is what a reviewer trusts for provenance, and an existence check against a remote API is the kind that can pass for the wrong reason. So the harness gets a negative control before its baseline is trusted, and every unit reruns both the harness and the gate. No `arena`: the design has no one-way door. No fan-out: the units are one-line edits, and the gate shares test files across them.

## Designed phases

1. P1 (scaffold): write `harness.ts`; capture `harness-baseline.json` and `gate-baseline.txt` from the pre-change state.
2. P2 (riskiest unknown): prove the harness can fail. Point one pin at a path that does not exist, expect a `does not resolve` failure, then revert.
3. P3 (unit per failing member): fix each member the baseline lists, rerunning the harness and the gate after each.
4. P4 (whole): rerun the harness into `harness-after.json` and the gate into `gate-after.txt`; compare pins and failure counts with the baseline.
5. P5 (hand back): audit the trail against the transcript, then ask a reviewer from another model family about it.
