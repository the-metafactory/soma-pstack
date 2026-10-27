# Playbook: Hillclimb

**Task shape:** sustained improvement of one measurable thing against a target, over many attempts.
**You own:** the metric and the experiment's integrity. One change, one measurement, keep or revert.

## Steps

1. Read the target's architecture, name the workload dimensions that move the result, and pick a case that reproduces the complaint. Fix one metric, its better direction, and a stop predicate that pairs a target with a minimum number of attempts.
2. Build the measurement harness, show that it separates a hard case from an easy one, vet it with `benchmark-checklist`, then freeze it. One command prints the metric as a median of several runs.
3. Record the baseline and a green run of the regression gate before any change.
4. Open the decision trail with `show-me-your-work`: one row per attempt with hypothesis, change, before, after, delta, gate result and verdict.
5. Ground each hypothesis in a named mechanism from step 1. For a performance metric, order them by the mantras in the Perf issue card.
6. Per attempt: make the change, measure with the frozen harness, run the gate. Keep it only when the metric moves past noise and the gate stays green; otherwise revert it in full. Log the row either way.
7. On a plateau, change category, combine near misses or try something bolder before you conclude. Correctness and simplicity outrank the number.
8. Stop when the predicate holds, or when the remaining ideas cost more than they could gain. Never relax the predicate. Open the PR with the kept commits in landing order.

## Criteria

- C1: The harness was frozen before the first attempt (probe: its commit precedes the first trail row).
- C2: The predicate holds on the frozen harness (probe: the harness, rerun).
- Anti: No kept commit lacks a trail row with its measured delta (probe: the commits against the trail).

## Principles

`the-algorithm/references/principles/build-the-lever.md`, `the-algorithm/references/principles/explain-the-number.md`, `the-algorithm/references/principles/sequence-verifiable-units.md`. When the goal is to match a reference answer rather than move a metric, use the `agentic-loop` skill.

**Reply:** the metric and target, baseline to final with the percent delta, attempts kept and reverted, each kept change in one line, the trail path, and the next idea worth trying.
