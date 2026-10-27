# Upstream playbook review

pstack's `skills/poteto-mode/playbooks/` has 23 cards. Each was read in full on
2026-10-27 against the mirror of `cursor/plugins` used for the principles port.
This page records which ones the `playbooks` member carries and why.

## Already ported

These 11 upstream cards had an adapted card in `skills/playbooks/references/`.
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

## Ported in a second pass

These cards were written on 2026-10-27 after the first review, adapted to Soma.

| Upstream | Card here | Adaptation |
| --- | --- | --- |
| `opening-a-pr.md` | `opening-a-pr.md` | Origin, the built-in PR tool, `deslop`, `unslop` and `interrogate` are dropped. Prose goes through `technical-writing` and `humanizer`, Blast Radius through `blast-radius`. A push needs the principal's approval or a covering grant. |
| `shipping.md` | `shipping.md` | The principal decided that agents may merge after Sage reviews. A Sage verdict on the current head, checked by `git patch-id`, replaces the independent cloud verifiers. A finding the agent would dismiss on security, auth, secrets, data deletion or a migration escalates. |
| `perf-issue.md` | `perf-issue.md` | The control-skill, `architect` and model defaults are dropped. The baseline, the mantras and the post-fix measurement stay. |
| `hillclimb.md` | `hillclimb.md` | The trail is `show-me-your-work`. Matching a reference answer goes to `agentic-loop`. |
| `runtime-forensics.md` and `trace-forensics.md` | `forensics.md` | One card. Step 1 forks on whether a capture already exists. |
| `worktree-cleanup.md` | `cleanup.md` | The `worktree-audit` member's TypeScript script replaces `worktree-audit.sh`, so the playbooks member keeps no shell or network access. It reads Claude Code transcripts under `~/.claude/projects` and ignores the gitignore that hides them. Removal waits for the principal's approval of the list, per Soma's policy, instead of proceeding on clean worktrees. Simulator steps are dropped. |

## Not ported

| Upstream | Why |
| --- | --- |
| `babysit.md` | Soma's `pilot-review-loop` skill owns the PR review loop with its cortex reviewers. This card depends on `scripts/watch-pr` and Bugbot. Its rules on the merge frontier, one babysitter per stack, no topology changes, classifying CI before a retry and stopping at the principal's line belong in `pilot-review-loop` as a separate change. |
| `autopilot-full.md` and `autopilot-stack.md` | Both are built on many parallel cloud agents, the unported `swarm` skill and merge authority. Revisit when more machines are available (clawbox and the new Mac mini). |
| `orchestrate.md` | It needs the `orch.ts` runtime and dozens to hundreds of agents. `orienteer` and ranger fill this role. Its brief template could sharpen the own-delegated-work principle later. |
| `visual-parity.md` | Pixel-exact migration against a frozen baseline has not come up as a recurring task shape. Revisit when one does. |
