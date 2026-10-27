# Upstream playbook review

pstack's `skills/poteto-mode/playbooks/` has 23 cards. Each was read in full on
2026-10-27 against the mirror of `cursor/plugins` used for the principles port.
This page records which ones the `playbooks` member carries and why.

## Already ported

These 11 upstream cards have an adapted card in `skills/playbooks/references/`.
They moved here from Soma's the-algorithm skill unchanged, apart from their
principle pointers.

| Upstream | Card here |
| --- | --- |
| `bug-fix.md` | `bug-fix.md` |
| `feature.md` | `feature.md` |
| `refactoring.md` | `refactor.md` |
| `investigation.md` | `investigation.md` |
| `prototype.md` | `prototype.md` |
| `multi-phase-plan.md` | `planning.md` |
| `session-pickup.md` | `session-pickup.md` |
| `pause-safely.md` | `pause-safely.md` |
| `autonomous-run.md` | `autonomous-run.md` |
| `authoring-a-skill.md` | `authoring-a-skill.md` |
| `eval.md` | `eval.md` |

## Port

| Upstream | Why | Adapt |
| --- | --- | --- |
| `opening-a-pr.md` | Every code card ends by opening the change for review, and no card says how. Upstream covers commit shaping, the PR body sections, ready-not-draft and stacks. It also says that opening a PR does not start a babysit. | Drop Origin, the built-in PR tool, `deslop`, `unslop` and `interrogate`. Route prose to `technical-writing` and `humanizer`, and the Blast Radius section to `blast-radius`. Keep the principal's rule that a push needs approval, and the attribution lines. |
| `perf-issue.md` | `benchmark-checklist` and explain-the-number exist, but no card takes a "this is slow" report. The bug-fix card has no measurement step, and the seven performance mantras are not written down anywhere in Soma. | Drop the control-skill, `architect` and model defaults. Keep baseline, mantras, post-fix trace and the reply. |
| `hillclimb.md` | This is a separate loop: a frozen harness, one change per measurement, keep or revert, and a decision log. Soma's `agentic-loop` matches work against a reference, not a metric. | Log through `show-me-your-work`. Add one line that sends reference matching to `agentic-loop`. |
| `runtime-forensics.md` and `trace-forensics.md` | A diagnosis from a profile, heap snapshot or trace is not the investigation card, which reads code. | Merge into one `forensics` card. Step 1 forks on whether the capture already exists. |

## Do not port

| Upstream | Why |
| --- | --- |
| `babysit.md` | Soma's `pilot-review-loop` skill owns the PR review loop with its cortex reviewers. This card depends on `scripts/watch-pr` and Bugbot. Its rules on the merge frontier, one babysitter per stack, no topology changes, classifying CI before a retry and stopping at the principal's line belong in `pilot-review-loop` as a separate change. |
| `shipping.md` | It assumes landing authority and independent cloud verifiers. Under Soma's policy the principal controls merges. The patch-id rule for stale verdicts is the idea to carry into `pilot-review-loop`. |
| `autopilot-full.md` and `autopilot-stack.md` | Both are built on Cursor cloud agents, the unported `swarm` skill and merge authority. Ranger and `orienteer` cover unattended multi-PR work in Soma. |
| `orchestrate.md` | It needs the `orch.ts` runtime and dozens to hundreds of cloud agents. `orienteer` and ranger fill this role. Its brief template could sharpen the own-delegated-work principle later. |
| `visual-parity.md` | Pixel-exact migration against a frozen baseline has not come up as a recurring task shape. Revisit when one does. |
| `worktree-cleanup.md` | It relies on an unported `worktree-audit.sh` and on Cursor and Xcode paths. Deleting worktrees falls under the ask-before-irreversible principle. Revisit with the script if worktree buildup becomes a recurring chore. |
