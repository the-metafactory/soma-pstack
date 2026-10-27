# Node #17 verification

Verified on the host on 2026-10-27. The node ports three pstack skills, none ruled out: `statechart`, `create-formal-verification-skill` and `maintain-formal-verification-skill`. All three come from `cursor/plugins` at `519d36a` (full SHA in each member manifest). That commit is upstream's head when I ported; for these three paths it only changed `statechart`'s own test file.

## What changed from upstream

- All three `SKILL.md` files keep the upstream text verbatim. Frontmatter drops `disable-model-invocation: true` and gains `triggers`. A source line names the file and commit.
- `statechart` gains a short `## Running without mise` section: with `TLA2TOOLS` and `JAVA` set, `scripts/run.ts` skips the mise install (`run.ts:194-195`), so the skill runs offline.
- `skills/statechart/scripts/` is upstream's directory without `test/` (3.6 MB of stored TLC output and a fast-check corpus), `package.json` and `tsconfig.json`, which belong to that test suite. Upstream's own tests were not run here.
- `skills/statechart/references/render.md` is verbatim. Pele rendering was not exercised.

## Acceptance criteria

| Criterion | Where it is met |
| --- | --- |
| statechart draws Mermaid charts, turns each agreed rule into a TLA+ invariant checked by TLC, and replays each bug against the real code | `SKILL.md` (Write the spec, Show the chart, Hand off) asserted by `test/statechart.test.ts`; exercised by the probe below |
| Live probe: statechart on a small state machine in a soma repo; TLC runs and reports the invariants | The probe below |

## Live probe

The model is the phase lifecycle of a Soma Algorithm run, read from the soma repo at `3bff58d`: `advanceAlgorithmRun` (`src/algorithm/algorithm.ts:694`), `completeAlgorithmRun` and `abandonAlgorithmRun` (`src/algorithm/algorithm-lifecycle.ts`). The `assertGate` checks before an advance are left out of the model.

- [AlgorithmPhase.tla](AlgorithmPhase.tla), [AlgorithmPhase.cfg](AlgorithmPhase.cfg) and [view.mjs](view.mjs) are the spec, the config and the reader's words.
- TLC reached 11 states and 29 steps and checked three rules: [report.md](report.md), [tlc.out](tlc.out), [chart.mmd](chart.mmd).
- `NoDeadlock` holds. `AbandonedStaysAbandoned` (the code's own comment, `algorithm.ts:689`: "abandoned is terminal") breaks in two steps: abandon, then complete. `CompleteIsNeverAbandoned` breaks in two steps: complete, then abandon.
- [replay.ts](replay.ts) replays both paths against the real functions, with the soma checkout left unchanged: [replay.txt](replay.txt) shows `abandon -> abandoned -> complete -> complete` and `complete -> complete -> abandon -> abandoned`. Both bugs occur in the code: `setRunPhase` takes no guard on the phase it starts from, while `advanceAlgorithmRun` does refuse to leave `abandoned` or `complete`. I did not check whether any caller in soma's service layer guards these calls, so this is a finding about the two helpers, not about a user-visible run.
- The command exits 1 when a rule breaks and still writes its output; `test/statechart.test.ts` asserts that.

How the tools were provided: this host had no Java and no mise, so I downloaded `tla2tools.jar` v1.7.4 (sha256 `936a2620…050e88`, the checksum `run.ts` pins) and a Temurin 21 JRE into `/tmp`, and ran with `TLA2TOOLS` and `JAVA` set. Upstream's mise path installs `temurin-25`, which I did not exercise. `test/statechart.test.ts` runs the TLC test only when both variables are set and skips otherwise, so the supervisor's gate does not need Java.

I followed `create-formal-verification-skill` and `maintain-formal-verification-skill` by reading only; I did not run either against a project, and no substrate invoked any of the three. The probe shows what `statechart` does, not how a substrate's model drives it.

## Gate

`bun scripts/check-pack.ts` output: see [pack-check.txt](pack-check.txt). `bun test test/` passes.
