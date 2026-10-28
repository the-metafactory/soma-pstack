# End-of-run audit

- Transcript: this run's Claude Code subagent session, `<claude-projects>/<project>/<session>/subagents/agent-<id>.jsonl` (host path replaced with placeholders). Only this file was read; it holds 58 Bash calls up to this audit.
- Rows checked: lines 2 to 15 of `decisions.tsv`, against the Bash calls and their output in that transcript.
- Evidence checks: every pointer resolves to a file in this directory, except line 10, whose `97e6ea4` is a commit in the scratch copy only. Line 23 supersedes it with the patch file that holds that commit. `test/figure-it-out.test.ts` reruns the check against this repo.

## Forks the log had missed

1. The first scratch commit was refused by the host's gitleaks pre-commit hook, on personal paths in the existing `docs/verification/node-8` and `node-17` files. The scratch copy drops `docs/` instead. That is why the baseline gate has 3 failures. Added as line 16.
2. The Algorithm-run mapping in `SKILL.md` was not exercised. `soma algorithm new` with a scratch `--soma-home` stops with "Soma CLI runtime is missing-state", and the brief forbids writing under `~/.soma`. Added as line 17, INCONCLUSIVE.

## Other findings

- Lines 9 and 15 supersede by line number but leave out the `(<ts>)` that show-me-your-work asks for. The line numbers are right: line 7 is the first baseline, line 14 the sharpen claim.
- The first baseline (line 7) was captured during grounding, before the frame rows were written. The row says so.
- The negative control (line 8) ran in the shared scratch directory before the move. The manifests there were the same as `origin/main`; only another agent's untracked files differed.
- Gate output has host paths replaced with `<scratch>` and `~`, so the host's gitleaks hook accepts the files.
- The patch's author line is replaced with `<author> <<email>>`, so the committed evidence carries no personal address.

## Corrections

A later run, the PR #55 review fix round, appended lines 20 to 24 through the helper. The rows above them are left as written.

- Line 21: the first `start` row (line 2) should have said `new log`.
- Lines 22 and 24: lines 9 and 15 supersede by line number without the `(<ts>)`; the correcting rows name both.
- Line 23: line 10's evidence `97e6ea4` does not resolve in this repo. The patch file is the pointer that does.
