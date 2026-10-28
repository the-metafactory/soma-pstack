---
name: show-me-your-work
description: "Keep a reviewable decision trail for long-running or unattended work: a TSV log with one row per decision, a transcript audit and cross-model review. Use for /show-me-your-work, autonomous or multi-phase runs, or work a human reviews after stepping away. Local by default; commit only when a reviewer needs the trail to trust the result."
route: "Long, autonomous or multi-phase work, or any task the principal steps away from and reviews later."
---

# Show me your work

Keep one canonical log. Other skills route their decision trail here instead of inventing a format.

## The format

A single TSV file, one row per decision. Cells stay single-line. Evidence is a pointer, not prose. The helper creates the header automatically; [references/decision-log-template.tsv](references/decision-log-template.tsv) is the same header for readers and tooling.

- **ts:** ISO8601 timestamp.
- **phase:** the phase or workstream. Reserve `start` for run boundaries.
- **decision:** what was chosen or done, one line.
- **why:** the reason in plain words. If a principle drove it, say it plainly.
- **evidence:** a link or path that proves it: commit SHA, PR number, `file:line`, artifact, trace or screenshot. Never a paragraph.
- **result:** the outcome or predicate state, such as `tests green`, `reverted`, `INCONCLUSIVE` or `open`.

## Logging a row

Use [scripts/log.sh](scripts/log.sh):

```sh
bash <installed-skill-dir>/scripts/log.sh <logfile> <phase> <decision> <why> <evidence> <result>
```

Resolve the helper relative to this installed skill directory, not the work directory. It stamps `ts`, creates the header on first use, replaces tabs/newlines/CR with spaces, and strips leading whitespace and formula-prefix bytes (`=`, `+`, `-`, `@`) from cells. Use the helper for every row.

Prefix stripping is lossy: write signed values after a label (for example `result: -1`) so their meaning survives.

Write each entry the way you would tell a teammate what you did. Log forks, completed units with their verification results, pivots, reverts and their triggers, blockers and repaired gates. For loops, log one row per iteration. Skip trivial actions.

A run is one agent conversation, including its later turns and summaries. A pickup, replacement agent or new chat starts a new run. **Every run's first row has phase `start`, even in a new log.** Its evidence names the run (session/agent id or an artifact path). Its decision names the timestamp range of preceding rows it did not write, or says `new log` when there are none.

A returning run first reads the last rows. If another run wrote since, append another `start` row before continuing. Each stretch of a run's rows starts at its `start` row and ends at the next run's `start`. Use one writer per log; concurrent efforts use separate `.audit/<task-slug>.tsv` files.

## Where it lives

Keep `decisions.tsv` in the work directory, or `.audit/<task-slug>.tsv` when several efforts run at once. The log is a local working artifact by default; leave it out of git. Commit it only when the work is ambitious enough that a reviewer needs the trail to trust the result.

## Rules

- Append-only. A wrong or changed call gets a new row explicitly saying `supersedes row <line number> (<ts>)`. Never edit or delete history, including during the audit.
- Prefer evidence produced by committed scripts over hand-made one-offs.

## Audit the log against the transcript

At run end, before handing back, read only this run's transcript from the active substrate's session store using its exact session id/path within the read paths declared in [arc-manifest.yaml](arc-manifest.yaml). Never glob across other projects or private chats. For another store location, have the caller supply this run's transcript in the work directory or update the declaration before reading it. For a scripted scratch task, capture actual decisions, commands and outputs as its transcript while executing it. If the transcript is inaccessible, record the audit as incomplete and flag it in Attention; do not invent evidence.

Walk this run's row stretches against what actually happened:

- Check that every row maps to a real decision or action.
- Resolve each evidence pointer and check that it supports the claim.
- Add missing forks, pivots and abandoned approaches that shaped the work.

Correct the log, not the story. Even an invented row stays: append a superseding row with what actually happened and an evidence pointer that resolves. Do not audit other runs' stretches; if this run's work proves an older row wrong, supersede it like any wrong call.

Save an end-of-run audit artifact identifying the transcript, row ranges checked, evidence checks and missing forks added. Append an `audit` row pointing at it.

## Cross-model review of the trail

Before handing back, ask a reviewer on a different model family from the one that did the work, through an available subagent or model CLI. Give it the log, audit artifact, this run's transcript and referenced evidence. Self-review is not a substitute. Ask what the principal should pay attention to, rather than asking it to redo the work:

- Decisions with weak or absent evidence.
- Verification skipped or claimed without proof in the transcript.
- Choices that look risky in hindsight: premature decisions, scope creep or symptom fixes.
- Gaps the principal could miss on a casual skim.

When the reviewer is `codex`, write the request to a file first, with the Write tool on Claude Code, and give it to codex on stdin:

```sh
codex exec --sandbox read-only --skip-git-repo-check -C <work-dir> \
  -o <work-dir>/review.md - < <work-dir>/review-prompt.md
```

`-` makes codex read its prompt from stdin, and the redirect closes stdin when the file ends. With the prompt as an argument, codex also reads any stdin it inherits: an agent's shell keeps stdin open, so codex prints `Reading additional input from stdin...` and waits without end. `-o` writes the final message to a known file. The session header that codex prints on stderr names the model; keep it with the review.

Use only authorized session paths and reviewer services; pass only this run's relevant material and redact secrets before the hand-off. Remote review must use a host declared in [arc-manifest.yaml](arc-manifest.yaml), currently `api.anthropic.com` or `api.openai.com`, through an already authenticated tool or CLI. A proxy, another provider or a custom endpoint needs a matching declaration before use. These capabilities disclose access; they do not grant authorization or permission to read credential files.

Save the review with the reviewer's model identity. If no different-family reviewer is available, retain the artifacts and report the review as incomplete in Attention; never label self-review as cross-model review.

Every reply for a run that produced a trail ends with an **Attention** section. Lead with the reviewer's model on its own line (`reviewed by <model>`), then list flags pointing at specific rows or transcript moments. `No flags` is a valid value. The model name alone is not.

## Reviewing the trail

Read top to bottom, follow evidence pointers, and spot-check. GitHub renders committed TSV as a table; `column -s$'\t' -t decisions.tsv` renders it in a terminal.

Source: ported from pstack (MIT, © 2026 Lauren Tan); upstream pin in arc-manifest.yaml. Soma adaptations: portable transcript and reviewer routing, every-run start rows, explicit supersession pointers, saved audit evidence, and formula-prefix stripping. Decision source: [soma#1084](https://github.com/the-metafactory/soma/issues/1084), moved to pack node #5.
