---
name: blast-radius
disable-model-invocation: true
description: "Find what a change could break beyond its diff and prove the one or two facts its safety depends on. Use for 'blast radius of X', 'what could this break', or reviewing a small diff you do not trust. Use a mechanics or history investigation for a how/why question without a change to assess."
---

# Blast radius

Find breakage a caller search cannot show. A convincing writeup is not proof: identify the one or two facts the change is safe because of and spend the effort proving those.

## Evidence ladder

For **each** fact the change's safety depends on, climb as far as is cheap and report where you stopped. Keep additional dependencies visible even when one or two facts clear most risks.

| Rung | Evidence reached | What qualifies |
| --- | --- | --- |
| 1 | You said so | An assertion only. Worthless on its own; mark it unproven. |
| 2 | You pointed at the line | A real `file:line` at the inspected revision, including the library's own source where relevant. |
| 3 | You showed the bad case cannot happen | Walk the failure step by step and show exactly where it becomes unreachable, with cited premises and explicit bounds. |
| 4 | You ran it | A script or test calling the real code, with an assertion that fails if the fact is wrong. Save the command, exit status and actual output. |
| 5 | You reproduced it in the running app | Exercise the affected application path; save the revision, setup, actions and observed result or trace. |

A higher number does not erase a coverage gap. A script that imports a library but never exercises the disputed behavior is not rung 4. A passing unit test is not an app reproduction. Do not turn a search with no matches into proof of absence beyond the searched scope.

## Steps

1. **Read the change.** Inspect the diff and the symbols it adds, changes or deletes, including behavior the diff does not spell out. Resolve the base and head commits; for a PR, read its metadata, commits and discussion using available read-only tools. Separate found intent from inference. Do not treat the PR's own verification claims as evidence you produced.
2. **Find the decisive facts.** State the one or two facts that clear most plausible failures if true. For each, name the concrete failure if false. Keep other safety dependencies in the evidence list rather than hiding them in prose.
3. **Look where grep stops.** Follow the relevant boundaries: read the called library's source at the locked version and any local patch; check JSON/API responses, database columns, wire formats and other languages reading the bytes; trace feature flags and code several hops downstream. Work out when things run: microtasks, mount/unmount, teardown and framework scheduling. Investigate the boundaries the change actually crosses; say which are relevant, which you checked and which remain unknown.
4. **Assess the risks honestly.** Keep confirmed risks separate from checked-and-cleared ones. For each retained risk, give the failure mechanism, real `file:line`, likelihood with its basis, impact and cheapest discriminating check. Do not invent callers, APIs or numerical odds. Unknown is an acceptable result.
5. **Prove the facts.** For each safety dependency, climb the ladder while the next check is cheap. Rung 4 is often one small script importing the same locked library the app ships and calling the exact function in question. Exercise the real implementation, not a reimplementation or a mock of the disputed behavior. Where cheap, show the check detects the bad case on the base revision or a controlled counterexample. Run on an isolated fixture or disposable app state; inspection does not authorize deployment or production mutation. If a rung is impractical, name the concrete cost, missing prerequisite or permission and the cheapest next probe. Mark an unsupported fact unproven; never invent a successful run.
6. **Get independent coverage for a wide change.** When the change is big or crosses many boundaries, ask multiple available models the same scoped question through authorized review tools and reconcile their evidence. If unavailable, report the missing coverage. Keep speculation separate from supported findings; model agreement does not advance a fact's rung.

## What to hand back

- **What it does:** the change, base/head revisions and non-obvious effects.
- **The facts it is safe because of:** name the decisive one or two first. List **every** safety dependency as `Fact | Rung reached (1–5) | Evidence | Why stopped / remaining gap`. Include revision-qualified `file:line` pointers and saved command/output artifacts. For rung 3, include the bounded failure walk. For rungs 4–5, paste the actual relevant output. Do not average rungs into a confidence score or label the whole change proven when a dependency is unproven.
- **Risks:** confirmed failures and unresolved dependencies, each with likelihood, impact and a check.
- **Cleared:** what was checked and the evidence that cleared it, bounded to the path exercised.
- **Before merge:** the cheapest remaining test or app reproduction, including the script used. For a merged PR, label these retrospective follow-ups, not new merge gates.

Use plain prose and strip private material before sharing. This skill produces an assessment; it does not approve a merge.

Source: ported from pstack (MIT, © 2026 Lauren Tan); upstream pin in [arc-manifest.yaml](arc-manifest.yaml), notice in [../../NOTICE.md](../../NOTICE.md). Soma adaptations: portable PR/reviewer lookup, explicit per-fact stop reasons and bounded execution evidence; upstream's explicit-invocation key is retained for Claude Code, with Codex policy in [agents/openai.yaml](agents/openai.yaml). Decision source: [soma#1085](https://github.com/the-metafactory/soma/issues/1085), moved to pack node #6.
