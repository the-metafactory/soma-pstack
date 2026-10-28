# Interrogate output: duplicate artifact paths

Scope: `scratch/duplicate-artifacts` in the throwaway clone `/tmp/interrogate-probe-repo2`, from merge base `48eb39e`: one commit to `scripts/check-pack.ts` and no uncommitted changes, so the patch step applied an empty patch ([scope.diff](scope.diff)). Roster as named for this probe: an `opus` sub-agent, a `haiku` sub-agent and `codex exec` (`gpt-6.1-sol`, [session head](adversary-3-session-head.txt)).

## Intent

`bun scripts/check-pack.ts` must fail, naming the path, whenever the root `arc-manifest.yaml` lists the same member path more than once in `artifacts`. Everything else the checker does stays as it was.

## Findings

### A duplicate that is not directly after its first copy passes

Found by all three adversaries. The new check compares each path only with `previous`, the entry before it, so `[A, B, A]` passes.

My reruns ([rerun.txt](rerun.txt)), one per adversary worktree:

```text
# adversary-1: real manifest with skills/recall appended at line 57
Pack checks passed (23 members).
exit=0

# adversary-2: repro/nonadjacent lists skills/recall, skills/correct, skills/recall
Pack checks passed (3 members).
exit=0

# adversary-3: bun repro-duplicates.mjs separated
Pack checks passed (23 members).
exit code: 0
```

The adjacent controls in adversary 2's and adversary 3's worktrees print `listed more than once in artifacts` and exit 1, so the check works only for neighbours. It breaks the intent, which asks for a failure whenever a path appears more than once.

## Dropped

- Adversary 1 (`opus`): 0 dropped. Its note that the pass message counts duplicates as members (23 instead of 22) has the same root cause and is merged into the finding.
- Adversary 2 (`haiku`): 1 dropped. Its Finding 2, "the commit adds no test", cites `bun test test/check-pack.test.ts`. My rerun printed `0 fail` across 31 tests, so the output shows no failure. A missing test is a risk that needs a future change to matter, which the brief excludes.
- Adversary 3 (`codex`): 0 dropped.

## Worktrees

`/tmp/interrogate-dup-artifacts/adversary-1`, `/tmp/interrogate-dup-artifacts/adversary-2`, `/tmp/interrogate-dup-artifacts/adversary-3`.
