Scores: **0 = unmet, 1 = partially met, 2 = fully met.**

| Criterion | candidate-1 | candidate-2 |
|---|---|---|
| R1: Documented forms | **2** — All seven forms pass: `candidate-1/duration.test.ts:6–12`. | **2** — All seven forms pass: `candidate-2/duration.test.ts:6–10,19,32–33`. |
| R2: Malformed input | **2** — Probes reject every listed rejection case with `RangeError`, including overflow. | **1** — Other listed cases reject, but probes return `10800000` for `1h2h` and `5400000` for `30m1h`. |
| R3: Useful errors | **2** — Errors identify remaining text, unit, or oversized input: `candidate-1/duration.ts:25,33,42`; empty input is explicitly named at line 14. | **2** — Errors name missing parts, unknown units, and original input: `candidate-2/duration.ts:30–49`; empty input is identified at line 19. |
| R4: Small surface | **2** — 45 lines, one export, no dependencies: `candidate-1/duration.ts:1–45`. | **1** — Dependency-free, but 62 lines and both named/default exports: `candidate-2/duration.ts:13,62`. |
| R5: Test coverage | **2** — Every documented form and more than four rejection classes: `candidate-1/duration.test.ts:6–41`. | **2** — Every documented form and more than four rejection classes: `candidate-2/duration.test.ts:6–64`. |
| **Total** | **10/10** | **8/10** |

## Recommended base

**candidate-1.** It meets all five criteria, including the required repeated-unit and ordering restrictions. Its suite passes **27/27**; candidate-2 passes **31/31**, but encodes behavior contrary to R2.

Two worthwhile grafts from candidate-2:

- More specific “missing unit” and “unknown unit” diagnostics.
- Decimal and sub-millisecond regression cases at `duration.test.ts:21–26`; retain candidate-1’s arithmetic, since candidate-2’s scaling can underflow long fractions.

No files were modified.
