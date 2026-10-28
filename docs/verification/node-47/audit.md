# End-of-run audit

- Transcript: this run's Claude Code subagent session, `~/.claude/projects/-Users-fischer-work-mf-soma-pstack/02a23a26-a569-40ea-8b78-8d072f956db8/subagents/agent-aport-fio-9ba832ded631eb9f.jsonl`. Only this file was read; it holds 58 Bash calls up to this audit.
- Rows checked: lines 2 to 15 of `decisions.tsv`, against the Bash calls and their output in that transcript.
- Evidence checks: every pointer resolves to a file in this directory or to a commit in the scratch copy (`97e6ea4`). `test/figure-it-out.test.ts` reruns that check.

## Forks the log had missed

1. The first scratch commit was refused by the host's gitleaks pre-commit hook, on personal paths in the existing `docs/verification/node-8` and `node-17` files. The scratch copy drops `docs/` instead. That is why the baseline gate has 3 failures. Added as line 16.
2. The Algorithm-run mapping in `SKILL.md` was not exercised. `soma algorithm new` with a scratch `--soma-home` stops with "Soma CLI runtime is missing-state", and the brief forbids writing under `~/.soma`. Added as line 17, INCONCLUSIVE.

## Other findings

- Lines 9 and 15 supersede by line number but leave out the `(<ts>)` that show-me-your-work asks for. The line numbers are right: line 7 is the first baseline, line 14 the sharpen claim.
- The first baseline (line 7) was captured during grounding, before the frame rows were written. The row says so.
- The negative control (line 8) ran in the shared scratch directory before the move. The manifests there were the same as `origin/main`; only another agent's untracked files differed.
- Gate output has host paths replaced with `<scratch>` and `~`, so the host's gitleaks hook accepts the files.
