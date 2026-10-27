# Playbook: Cleanup

**Task shape:** reclaiming disk from stale git worktrees, agent scratch directories and caches.
**You own:** that nothing in use or unsaved is lost. Removal is irreversible, so the audit and the principal's approval are the review.

## Steps

1. Record `df -h /`. For each repo, run the `worktree-audit` skill's script on it, after a `git fetch` when the base ref may be stale. It reads paths from `git worktree list`, never by hand, and suggests a bucket per worktree.
2. Treat the bucket as advice. Cross-check every candidate against what is live: running agent sessions, ranger workers and open PRs. A live session wins over `safe`.
3. For each `verify-recent-session` row, or any doubt, read that session's transcript in a subagent and report whether it is still going and which worktrees it uses.
4. Show the principal the prune list with each path, its size and its bucket. A `wip:N` row shows its diff; a `scratch:N` row names its files. Remove nothing before approval.
5. Remove each approved worktree with `git worktree remove <path>`, then run `git worktree prune`. Use `--force` only for ignored build output. Branches survive; delete one only when asked.
6. For other reclaimers, name each with its size before removing it and skip any the principal keeps: old agent scratch directories under the temp root, the bun cache (`bun pm cache rm`), Docker images, Xcode `DerivedData`.
7. Record `df -h /` again and list the worktrees again.

## Criteria

- C1: Every removed path was on the approved list (probe: the removal log against the list).
- C2: No removed worktree had uncommitted tracked changes (probe: the audit's DIRTY column for each removed path).
- Anti: No branch was deleted unless asked (probe: `git branch` before and after).

## Principles

`the-algorithm/references/principles/ask-before-irreversible.md`, `the-algorithm/references/principles/build-the-lever.md`, `the-algorithm/references/principles/guard-the-context-window.md`.

**Reply:** `df -h /` before and after with the space reclaimed, the worktrees removed, and a one-line reason for each one held back.
