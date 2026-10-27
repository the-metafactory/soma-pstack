# Playbook: Perf issue

**Task shape:** something is too slow or uses too much memory, CPU or I/O, and a target can be measured.
**You own:** the measurement. Every change is tied to a number, not to reading the source.

## Steps

1. Name the metric, the workload that shows the complaint, and the target. Use the principal's numbers when given.
2. Capture a baseline on the real surface, as the median of several runs, and vet it with `benchmark-checklist`.
3. Find where the cost goes from a profile or trace, not from the source. A large capture goes through the Forensics card.
4. Order the hypotheses by the performance mantras, cheapest first: don't do it; do it, but not again; do it less; do it later; do it when they're not looking; do it concurrently; do it cheaper. Stop at the first that meets the target.
5. Make one change per measurement. Keep a change only when the metric moves past noise and the suites stay green; revert the rest.
6. Measure again with the same harness and compare the captured artifacts.
7. Cite the baseline, the result and the delta in the PR, then follow the Opening a PR card. For sustained improvement against a metric, switch to the Hillclimb card.

## Criteria

- C1: The baseline was measured before any change (probe: the baseline artifact and its timestamp).
- C2: The metric meets the target, past noise, with the same harness (probe: the harness, rerun).
- Anti: No kept change lacks its own before-and-after measurement (probe: the commits against the measurements).

## Principles

`the-algorithm/references/principles/explain-the-number.md`, `the-algorithm/references/principles/ship-what-the-evidence-justifies.md`, `the-algorithm/references/principles/sequence-verifiable-units.md`.

**Reply:** the metric, the baseline, the result and the delta with units, what limits the number, and the artifact paths.
