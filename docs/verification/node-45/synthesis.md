# Synthesis note: parseDuration arena

Artifact: [synthesis/duration.ts](synthesis/duration.ts) with [synthesis/duration.test.ts](synthesis/duration.test.ts). Task: [task.md](task.md). Rubric: [rubric.md](rubric.md), which the candidates did not see.

## Base

candidate-1 (sub-agent on `opus`). It meets every rubric criterion: it rejects repeated and out-of-order units (R2), has one export in 45 lines (R4), and each error quotes the bad text and the expected units (R3). candidate-2 (sub-agent on `fable`) accepts `1h2h` and `30m1h`, which R2 forbids, and adds a default export (R4). My scores: candidate-1 10/10, candidate-2 8/10.

## Cross-judge

judged by gpt-6.1-sol through `codex exec --sandbox read-only` (the parent is Claude; session header in [judge-session.txt](judge-session.txt)). Verdict in [judge-verdict.md](judge-verdict.md): candidate-1 10/10, candidate-2 8/10, base candidate-1. The judge agreed with my pick and my scores.

We disagreed on the graft. The judge advised keeping candidate-1's arithmetic because candidate-2's integer scaling "can underflow long fractions". I had grafted that scaling. I reproduced the judge's case: with the plain graft, `"1." + "0".repeat(400) + "1s"` threw "too large to represent" instead of returning about 1000. Both of us were partly right, so the graft stays with a guard.

## Grafts

- From candidate-2: exact decimal scaling. The digits are read as one integer, multiplied by the unit and divided by `10 ** fractionDigits`, so `4.35m` is `261000` where candidate-1 returned `260999.99999999997`. Folded in by hand with a guard from the judge's finding: past 15 digits the integer is no longer exact, so the code multiplies directly. Regression cases for `4.35m`, `1.005s` and the 400-digit fraction were added to the base's tests.

## Rejected

- candidate-2's case-insensitive units: `M` reads as months, so units stay lowercase, as candidate-1 argued.
- candidate-2's tolerance of repeated and unordered units: R2 forbids it.
- candidate-2's separate "missing unit" and "unknown unit" messages, which the judge proposed grafting. candidate-1's single message already names the text and lists the valid units; three more branches would cost R4 for no new information.
- candidate-2's decimal tests (`1.1s`, `0.3s`), which the judge also proposed. Both pass on candidate-1's plain multiplication too, so they do not test the scaling they claim to. The base now carries cases that do.

## Convergence and dropouts

No dropouts. Both candidates converged on a sticky-regex scanner that reads one number-unit segment at a time, and both rejected a whole-string regex for the same reason (it cannot say where input went wrong). They diverged only on policy (unit order, case) and arithmetic, so no reframe was needed.

## Verification

- [verify.test.ts](verify.test.ts) runs the rubric's cases, which no candidate saw, against both candidates and the synthesis. Result in [verify-output.txt](verify-output.txt): 50 pass, 4 fail. The four failures are the candidates' known gaps (candidate-1 on `4.35m`, candidate-2 on the long fraction, `1h2h` and `30m1h`); the synthesis passes every case.
- The synthesis's own suite: 30 pass, 0 fail ([synthesis-tests.txt](synthesis-tests.txt)). `synthesis/duration.ts` is 51 lines with one export and no dependencies.
