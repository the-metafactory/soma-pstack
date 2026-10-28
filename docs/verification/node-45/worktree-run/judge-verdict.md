Scores: **0 = unmet, 1 = partial, 2 = met**.

| Criterion | candidate-1 | candidate-2 |
|---|---|---|
| **R1: Spec cases** | **2** — Example, overlaps, and surrounding whitespace covered in `candidate-1/range.test.ts:5–14`; tests pass. | **2** — Example, overlaps, and whitespace covered in `candidate-2/range.test.ts:5–30`; tests pass. |
| **R2: Named-token rejection** | **2** — Probe: all five required inputs throw and name the offending token, including `""`. | **1** — Probe: four required inputs throw with the token named; `""` returns `[]` (`candidate-2/range.ts:7`). |
| **R3: Consistent bounds policy** | **2** — Consistently drops pages above `max` (`candidate-1/range.ts:23`); documented in `candidate-1/RATIONALE.md:7`. | **1** — Documented mixed policy: `"8-20"` clamps, while `"11"` throws at max 10 (`candidate-2/RATIONALE.md:9`; confirmed by probe). |
| **R4: Behavioral/error tests** | **2** — Tests cover syntax, zero, reversed ranges, unsafe numbers, and invalid max (`candidate-1/range.test.ts:30–48`). | **2** — Tests cover each implemented error kind (`candidate-2/range.test.ts:46–86`), although the empty-input expectation violates R2. |
| **R5: Small, readable API** | **2** — One exported function; per-call `Set`; no hidden mutable state (`candidate-1/range.ts:1–25`). | **2** — One exported function; per-call `Set`; no hidden mutable state (`candidate-2/range.ts:1–28`). |
| **Total** | **10/10** | **8/10** |

Both suites pass: **18 tests** for candidate-1, **24 tests** for candidate-2.

## Recommended base

**candidate-1** meets the rubric with consistent clamping, required empty-input rejection, and safe-integer validation.

Graft candidate-2’s explicit single-page, single-page-range, and leading-zero test cases (`candidate-2/range.test.ts:9–18,42–43`). No implementation graft is necessary.