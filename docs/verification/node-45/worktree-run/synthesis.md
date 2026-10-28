# Synthesis: parseRange, worktree run

## Base

candidate-1 (sub-agent on `opus`, in a harness-picked worktree). It meets every rubric criterion: it rejects all five R2 inputs with the token named, and it drops pages above `max` by one documented rule. See [rubric-probe.txt](rubric-probe.txt).

## Cross-judge

Judged by gpt-6.1-sol (provider openai) through `codex exec --sandbox read-only --skip-git-repo-check -C /tmp/arena-clamp-range`, so codex read the labeled copies, not the worktrees. The model is named in [judge-session.txt](judge-session.txt). Verdict: [judge-verdict.md](judge-verdict.md), candidate-1 10/10 and candidate-2 8/10. My own scores match: candidate-2 returns `[]` for `""` (R2), and it clamps `8-20` but throws on `11` (R3, a mixed rule).

## Grafts

- From candidate-2: tests for a single page, a single-page range (`3-3`) and leading zeros (`007`). The judge proposed these too. The base already handled them, so they only add coverage.

## Rejected

- candidate-2's whitespace around the hyphen (`1 - 3`). The task allows whitespace around tokens, not inside them.
- candidate-2's empty input returning `[]`. The rubric requires a throw.

## Convergence and dropouts

No dropouts. Both candidates converged on one regex per token, a `Set` and a numeric sort; they differ only in the bounds and empty-input rules. Both worktrees and their branches are left in place for the principal to remove: see [handoff.txt](handoff.txt).

## Verification

[synthesis-tests.txt](synthesis-tests.txt): 20 tests, 0 fail. [rubric-probe.txt](rubric-probe.txt): the synthesis passes R1 to R3. One weakness remains and is not fixed: for `1,,2` the message names the empty token `""`, not its position.
