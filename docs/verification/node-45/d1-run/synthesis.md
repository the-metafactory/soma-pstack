# Synthesis note: parseDuration arena, default roster with a codex runner

Artifact: [synthesis/duration.ts](synthesis/duration.ts) with [synthesis/duration.test.ts](synthesis/duration.test.ts). Task: [../task.md](../task.md). Rubric: [../rubric.md](../rubric.md), which the candidates did not see.

Roster: candidate-1 is an Agent-tool sub-agent on `opus`, candidate-2 one on `fable`, candidate-3 a `codex exec` runner on gpt-6.1-sol under the confined profile from Phase B. All three ran in parallel, each in `/tmp/arena-d1-duration/candidate-<n>/`.

## Base

candidate-1. It meets R2 to R5 fully: it rejects repeated and out-of-order units, quotes the input in every error, has one export in 50 lines, and tests every documented form and many rejection classes. It loses one point on R1: `4.35m` throws "not a whole number of milliseconds", because `4.35 * 60000` is `260999.99999999997`. candidate-2 does the decimal arithmetic exactly but is 66 lines (R4) and throws on a 400-digit fraction. candidate-3 accepts `1h2h` and `30m1h` (R2), its overflow error names neither the input nor the part (R3), and it returns `260999.99999999997` for `4.35m`. My scores: candidate-1 9/10, candidate-2 8/10, candidate-3 7/10.

## Cross-judge

judged by gpt-6.1-sol through `codex exec --sandbox read-only -C /tmp/arena-d1-duration` (the parent is Claude; session header in [judge-session.txt](judge-session.txt)). Verdict in [judge-verdict.md](judge-verdict.md): candidate-1 10/10, candidate-2 9/10, candidate-3 8/10, base candidate-1. The judge agreed with my pick and my order. It gave every candidate 2 on R1 from their own tests; my hidden cases cost each of them a point there.

The judge shared a family with candidate-3, the codex runner. It saw the candidates only by label: the codex prompt, report and session log stayed in `/tmp/arena-d1-duration-codex/`, outside its tree. It ranked candidate-3 last, as I did, so this run shows no bias toward its own family.

## Grafts

- From candidate-2: exact decimal scaling. The digits are read as one integer, multiplied by the unit and divided by `10 ** fractionDigits`, so `1.001s` is `1001` and `4.35m` is `261000`. The judge warned that candidate-2's arithmetic rejects `1.0000000000000000s`, so past 15 digits the code multiplies directly. Folded in by hand, with candidate-2's `1.001s` and `0.7h` cases, a `4.35m` case and the judge's `1.0000000000000000s` case.
- From candidate-3: its numeric overflow case, adapted to candidate-1's policy: `"9".repeat(400) + "ms"` throws "exceeds the largest safe millisecond value".

## Rejected

- candidate-3's other overflow cases, which the judge proposed. They assert that a 308-digit millisecond count is a finite result, but candidate-1 rejects anything past `Number.MAX_SAFE_INTEGER`, which R2's non-finite rule allows and which avoids returning an imprecise number.
- candidate-3's acceptance of repeated and unordered units: R2 forbids it.
- candidate-2's separate "given twice" and "out of order" messages: candidate-1's one message already names the unit and the rule; two branches would cost R4.

## Convergence and dropouts

No dropouts; the codex runner started, kept `approval: never` and `sandbox: workspace-write [workdir]` ([codex-runner-session.txt](codex-runner-session.txt)) and wrote its three files. All three candidates converged on a sticky-regex scanner over number-unit segments. They diverged on policy (unit order, fractional milliseconds) and arithmetic, so no reframe was needed.

## Verification

- [verify.test.ts](verify.test.ts) runs the rubric's hidden cases against the three candidates and the synthesis. Result in [verify-output.txt](verify-output.txt): 64 pass, 8 fail. The failures are the candidates' gaps (candidate-1 and candidate-3 on `4.35m`, candidate-2 on the long fraction, candidate-3 on `5w`, `1hx`, `1h2h`, `30m1h` and the 400-digit day count); the synthesis passes every case.
- The synthesis's own suite: 35 pass, 0 fail ([synthesis-tests.txt](synthesis-tests.txt)). `synthesis/duration.ts` is 56 lines with one export and no dependencies.
