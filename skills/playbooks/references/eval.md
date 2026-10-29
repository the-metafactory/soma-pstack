# Playbook: Eval

**Task shape:** testing whether a variant (a prompt, a skill, a model, doctrine) changes behavior.
**You own:** the experiment design. Blind it, run it, explain the result.

## Steps

1. Frame: name the variant under test and the behavior that counts as success. Write a rubric of 3 to 6 concrete criteria for the judge only.
2. Record the baseline and the variant as reproducible states (a tag, a commit, a config).
3. Write one organic task prompt, as a user would type it. It names no eval, rubric or comparison, does not say other candidates exist, and asks for design notes in general, never for a list of the skills, principles or files it applied.
4. Run the candidates on the same prompt, each in its own working directory with a project-shaped name, on models picked by `arena` Phase A (Frame) step 3. No directory, file or prompt a candidate sees holds `eval`, `test`, `judge`, `experiment`, `rubric`, `score`, `compare`, `benchmark`, `candidate` or `arena`.
5. Score with one judge that is not the producer, on a model family picked by `arena` Phase C (Cross-judge). It sees outputs by sanitized label only and scores both sets on one scale (the registry's `JudgeOutput`).
6. Check what each candidate actually did from its transcript or trail, not from its own report: grade chain-following from the files it opened and the shape of its code.
7. Read every output yourself and compare to the judge. A disagreement means bias or an ambiguous rubric.
8. Explain the number: run count, spread, and what else it could be measuring.

## Criteria

- C1: Baseline and variant are named, reproducible states (probe: the tag or commit resolves).
- C2: No directory, file or prompt a candidate sees holds a word step 4 bans (probe: grep the candidate's tree and prompt).
- C3: Each result carries run count and spread (probe: the results table).
- Anti: The judge never saw a model or variant name (probe: the judge's input).

## Principles

`the-algorithm/references/principles/explain-the-number.md`, `the-algorithm/references/principles/surface-conflicts.md`.

**Reply:** the variant under test, the rubric, the per-candidate notes, the judge's verdict, your synthesis, and whether to promote the variant.
