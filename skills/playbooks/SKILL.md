---
name: playbooks
description: "Playbook cards: one numbered step list per task shape (bug fix, investigation, feature, prototype, planning, refactor, session pickup, pause, autonomous run, skill authoring, eval, opening a PR, shipping, perf issue, hillclimb, forensics, cleanup). Soma projects this index into every substrate's always-loaded working method, so pick a card from there."
disable-model-invocation: true
---

# Playbooks

A playbook card is the step list for one task shape. Cards apply in every mode: `soma install` projects this index into each substrate's always-loaded rules, so a NATIVE turn routes to a card too. Route in this order:

1. In an Algorithm run, mode and effort tier first, from the classifier (`algorithm classify`; `the-algorithm/references/mode-detection.md` for overrides).
2. Then the card whose task shape matches, from the table below. One card per run; when a task changes shape mid-run (an investigation that turns into a fix), switch cards and record the switch as a decision.
3. No card matches: run without one and record that in the run's decisions. A shape that keeps recurring without a card is a candidate for a new one.

| Card | Task shape |
| --- | --- |
| `references/bug-fix.md` | something that worked is broken, throws or regressed |
| `references/investigation.md` | a how or why question, or a choice between alternatives; no change asked |
| `references/feature.md` | new behavior, a new command or surface |
| `references/prototype.md` | a design choice with several plausible answers that a run can settle |
| `references/planning.md` | an accepted design that needs more than one PR |
| `references/refactor.md` | the structure changes, the behavior does not |
| `references/session-pickup.md` | resuming what a prior session or handoff left |
| `references/pause-safely.md` | the principal says stop, or the substrate signals the context is about to run out |
| `references/autonomous-run.md` | work the principal walks away from |
| `references/authoring-a-skill.md` | creating or changing a skill or doctrine file |
| `references/eval.md` | testing whether a variant changes behavior |
| `references/opening-a-pr.md` | a change is ready for review |
| `references/shipping.md` | landing reviewed PRs under a grant to merge after Sage review |
| `references/perf-issue.md` | something is too slow or uses too much, against a measurable target |
| `references/hillclimb.md` | sustained improvement of one metric over many attempts |
| `references/forensics.md` | a diagnosis from a profile, heap snapshot, trace or other runtime signal |
| `references/cleanup.md` | reclaiming disk from stale worktrees, agent scratch and caches |

Using a card:

- Copy its steps, verbatim and numbered, as the first items of your substrate's todo list. A step you choose not to do stays in the list as `skip: <reason>`; never drop one silently.
- In an Algorithm run, its **Criteria** are templates: rewrite each for the task and pass them to `algorithm new --criterion "C1:…"`.
- Its **Principles** are the ones that most often decide that shape. They live in the-algorithm skill, so a card names each as `the-algorithm/references/principles/<name>.md`, relative to the Soma skills directory; the full vocabulary is `the-algorithm/references/principles.md`.
- Its **Reply** line lists what the final message must contain.

Adapted in part from pstack (MIT, © 2026 Lauren Tan); notice in the pack's `NOTICE.md`.
