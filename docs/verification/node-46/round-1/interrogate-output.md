# Interrogate output: shared 40-hex pattern

Scope: `scratch/shared-hex40` in the throwaway clone `/tmp/interrogate-probe-repo`, from merge base `48eb39e` through the working tree: one committed README line, an unstaged edit to `scripts/check-pack.ts` and an untracked `scripts/patterns.ts` ([scope.diff](scope.diff)). Roster: the default, an `opus` sub-agent and `codex exec` (`gpt-6.1-sol`, [session head](adversary-2-session-head.txt)).

## Intent

Move the 40-hex upstream-commit check in `scripts/check-pack.ts` into a shared pattern in `scripts/patterns.ts`, with the checker's behaviour unchanged: `upstream.commit` must still be exactly a 40-character hex SHA.

## Findings

### The shared pattern has no anchors, so a commit that only contains 40 hex characters passes

Found by adversary 1 (`opus`) and adversary 2 (`codex`). Both traced it to `scripts/patterns.ts:1`, `/[a-f0-9]{40}/i`, which lost the `^` and `$` of the original `/^[a-f0-9]{40}$/i`. Adversary 1's failing suite test has the same root cause, so the two reports are merged.

My rerun in adversary 2's worktree ([rerun.txt](rerun.txt)):

```text
$ cd /tmp/interrogate-hex40/adversary-2 && bun .review-repro/hex40.ts
41 hex characters: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
  original: exit=1; skills/benchmark-checklist: upstream.commit must be a 40-hex commit
  current: exit=0; Pack checks passed (1 members).
non-hex prefix: "gaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
  original: exit=1; skills/benchmark-checklist: upstream.commit must be a 40-hex commit
  current: exit=0; Pack checks passed (1 members).
```

My rerun in adversary 1's worktree:

```text
$ bun test
(fail) invalid upstream.commit (aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa) names the member and field
 104 pass
 1 fail
```

It breaks the intent because the base checker rejects these values and the refactored one accepts them, so behaviour changed.

## Dropped

- Adversary 1 (`opus`): 0 dropped.
- Adversary 2 (`codex`): 0 dropped.

## Worktrees

`/tmp/interrogate-hex40/adversary-1`, `/tmp/interrogate-hex40/adversary-2`.
