---
name: bug-fix-test
description: "Use for bug-fix-test or a focused bug-fix regression check: add a test only with a cheap local path, otherwise explain why it is skipped. Capture failing-before output. Do not select for requests naming tdd, TDD, red-green-refactor, or general test-first development; those belong to Soma's tdd skill."
route: "After fixing a bug and before calling it fixed: add a regression test when a cheap local path exists, or say why there is none."
---

# Bug-fix Test

When fixing a bug with a clear, cheap test path, make the broken behavior executable before changing production code. The goal is a focused regression test that fails before the fix and passes after it. This is pstack's gated bug-fix check, ported under a distinct name; Soma's `tdd` owns the general test-driven development loop.

Do not force a test when it would be impractical, even when a regression test is requested. If the available test would require broad harness setup, brittle mocks, slow end-to-end infrastructure, production-only state, vague reproduction steps, or large unrelated fixture churn, skip adding a new test and use the closest useful verification instead.

## Workflow

1. **Understand the bug.** Identify the intended behavior, current behavior, affected path, and smallest observable reproduction.
2. **Gate the test.** Inspect the closest unit, component, integration, or regression tests already used for that codepath. Add a test only if a clear, cheap path exists. If none is practical, take the fallback below; do not build a harness just to satisfy the workflow.
3. **Write the failing test first.** Add the smallest focused test that would have caught the bug. Encode intended behavior through its observable interface, not the current implementation.
4. **Run the new test before fixing.** Capture the command, exit status, and actual failing output. Confirm it fails for the intended reason. If it passes or fails for an unrelated reason, correct the test or reproduction before editing the implementation. An import, setup, or infrastructure failure is not evidence of the bug.
5. **Fix the bug.** Make the smallest production change that satisfies the intended behavior while preserving nearby contracts.
6. **Rerun the regression test.** Confirm it now passes with the same command and capture the result.

## If a Failing Test Is Impractical

Prefer no new test over a bad test. A bad test is one that mostly tests mocks, encodes current implementation details, depends on timing or unrelated global state, needs expensive infrastructure for a small fix, or would be deleted immediately after proving the fix.

Add no test. Explain which constraint makes the path impractical and use the closest useful verification: a targeted script, manual reproduction command, browser automation, snapshot comparison, log assertion, or focused integration check. Capture before/after evidence where available. If the necessary environment is unavailable, state what remains unverified; do not invent failing-before evidence or create a test that only inspects source text.

## Guardrails

- Do not change tests merely to match a wrong implementation.
- Do not weaken existing assertions unless the expected behavior has genuinely changed and the reason is clear.
- Keep the regression test focused on the bug. Avoid broad fixture churn or unrelated coverage expansion.
- If the bug is flaky, make the test deterministic where possible and document the signal being locked down. If that cannot be done cheaply, use the fallback.
- If the bug exposes a broader class of failures, first land the focused regression path, then consider additional sibling coverage within the authorized scope.

## Report

Report the evidence, not just the outcome:

- State the cheap-path decision and name the test or fallback check.
- Include the failing-before command and exit status, fence the actual failure output, and explain why it demonstrates the intended bug. A paraphrase of the expected failure is insufficient.
- Include the passing-after command and result, plus any nearby validation performed.
- If no test was added, say why and report the closest verification actually performed. If failing-before evidence could not be demonstrated, say why and identify the remaining verification gap.

Source: ported from pstack (MIT, © 2026 Lauren Tan); upstream pin in arc-manifest.yaml. Attribution: ../../NOTICE.md.
