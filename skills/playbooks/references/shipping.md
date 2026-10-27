# Playbook: Shipping

**Task shape:** landing reviewed PRs, one PR or a stack, under a grant to merge after Sage review.
**You own:** what lands. Only a head that Sage reviewed, with green checks, merges, and only bottom-up.

## Steps

1. Confirm the grant: the principal asked to merge, or the brief says to merge once Sage is clean. Without one, stop at merge-ready and report.
2. Get a Sage verdict on each PR's current head per `pilot-review-loop`. `changes-requested` blocks the merge; `approved`, or `commented` with no blockers, passes. Your own review is not a verdict.
3. Check that the verdict still covers the code. Compare `git patch-id` at the reviewed head with the current head; a patch that differs needs a fresh review.
4. Check that the head's CI is green and that the change passed on its real surface. Green CI alone is not a verdict.
5. Escalate instead of merging when a finding you would dismiss touches security, auth, secrets, data deletion or a migration.
6. Land the lowest unmerged PR (`gh pr merge <pr> --squash`), then read it back (`gh pr view <pr> --json state,mergedAt,baseRefName`). A queued or auto-merge request is not a merge.
7. Retarget the next PR to trunk, move its patch onto the merge result and push with `--force-with-lease`. Step 3 decides whether its verdict survives; wait for its CI.
8. Change nothing else in the stack while it lands. Diagnose a stalled merge before you touch it. Stop at the first PR without a passing verdict.

## Criteria

- C1: Every merged PR has a passing Sage verdict whose patch-id matches the merged head (probe: the verdict SHA and `git patch-id` at both).
- C2: Every merged PR reads merged into trunk (probe: `gh pr view --json state,baseRefName`).
- Anti: No PR above the first unverified one merged (probe: the stack's PR states, bottom-up).

## Principles

`the-algorithm/references/principles/verify-before-claiming.md`, `the-algorithm/references/principles/weigh-review-findings-on-merit.md`, `the-algorithm/references/principles/ask-before-irreversible.md`.

**Reply:** what landed, each PR's verdict and the head it covered, how you confirmed each merge, and where the run stopped and why.
