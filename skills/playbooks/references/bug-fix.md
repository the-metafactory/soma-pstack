# Playbook: Bug fix

**Task shape:** something that worked is broken, throws, regressed or fails a check.
**You own:** the cause. Every shipped line traces to runtime evidence.

## Steps

1. Restate the report in one plain sentence. If it rests on a wrong premise or chases a red herring, say so before reproducing.
2. Reproduce the failure on the surface the report names, before any edit, through the project's verify skill (`verify-<project>`) when it has one. Capture the output.
3. If it will not reproduce, tighten conditions, synthesize the trigger or instrument until it fires.
4. List candidate causes, seeded with `how` over the affected subsystem and `why` for its regression history, then rule them out one at a time with runtime evidence, taking the split that eliminates the most each pass.
5. Name where the bad state enters the system, and place the fix there if that removes the class.
6. Where a cheap test exists, commit the failing reproduction as one before the fix, so it lands first in history.
7. Make the smallest change the evidence justifies. Revert anything a refuted hypothesis motivated.
8. Rerun the original reproduction on the same surface. Wrong surface or "inconclusive" is not a pass.
9. Run the suites the change can reach, then open the change for review.

## Criteria

Seed `algorithm new` with these, rewritten for the bug:

- C1: The reported failure reproduces before the fix (probe: the captured repro output).
- C2: The same reproduction passes after the fix (probe: the same command, rerun).
- C3: A test fails without the fix and passes with it (probe: the test, both ways, and its commit before the fix's).
- C4: The ingestion point is named in the run's decisions (probe: `algorithm show`).
- Anti: No change ships that no probe in the run asked for (probe: the diff against the evidence list).

## Principles

`the-algorithm/references/principles/reproduce-first.md`, `the-algorithm/references/principles/fix-at-the-ingestion-point.md`, `the-algorithm/references/principles/ship-what-the-evidence-justifies.md`; on a second report, `the-algorithm/references/principles/diagnose-on-recurrence.md`.

**Reply:** what was broken, the root cause, the fix, and the failing-then-passing reproduction output, verbatim.
