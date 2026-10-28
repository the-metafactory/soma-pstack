━━━ 📃 SUMMARY ━━━ 7/7

Scores: **2 = fully meets**, **1 = partially meets**, **0 = does not meet**. Paths below use the candidate directory labels.

| Criterion | candidate-1 | candidate-2 | candidate-3 |
|---|---|---|---|
| **R1: Documented forms** | **2** — All seven tested: `duration.test.ts:6–12`. | **2** — All seven tested: `duration.test.ts:6–32`. | **2** — All seven tested: `duration.test.ts:6–12`. |
| **R2: Malformed input** | **2** — Direct probes reject all nine rubric cases with `RangeError`, including overflow. | **2** — Direct probes reject all nine rubric cases with `RangeError`, including overflow. | **1** — Probes return `10800000` for `1h2h` and `5400000` for `30m1h`; other required rejections pass. |
| **R3: Diagnostic specificity** | **2** — Errors identify input, remaining text, unit, or empty input: `duration.ts:13,23,31,45–46`. | **2** — Errors identify input, offset, or offending component: `duration.ts:19,31,37,41,49,53,63`. | **1** — Syntax/unit errors identify offending parts, but overflow names neither input nor part: `duration.ts:30,37,43`. |
| **R4: Small surface** | **2** — One export, no dependencies, readable 50-line implementation: `duration.ts:1–50`. | **1** — One export and no dependencies, but 66 lines exceeds the limit: `duration.ts:1–66`. | **2** — One export, no dependencies, readable 49-line implementation: `duration.ts:1–49`. |
| **R5: Test coverage** | **2** — Seven forms and well over four rejection classes: `duration.test.ts:5–43`. | **2** — Seven forms and well over four rejection classes: `duration.test.ts:5–64`. | **2** — Seven forms and over four rejection classes: `duration.test.ts:5–49`; repeat/order acceptance is penalized under R2. |
| **Total** | **10/10** | **9/10** | **8/10** |

`bun test`: **30/30**, **36/36**, and **42/42** pass respectively.

## Recommended base

**candidate-1** best meets the rubric: compact, strict about ordering and repeats, and informative on errors.

It still has a decimal edge case: probing `1.001s` throws because multiplication produces `1000.9999999999999`.

Two grafts worth taking:

- **candidate-2’s decimal regression cases**, especially `1.001s` (`duration.test.ts:30–43`). Avoid copying its arithmetic unchanged: it rejects the equivalent `1.0000000000000000s`.
- **candidate-3’s numeric and multiplication overflow cases** (`duration.test.ts:44–46`), adapted to candidate-1’s error wording.

No files were modified.