---
name: figure-it-out
description: "Design an auditable playbook when no playbook card fits: a large migration, an ambitious multi-part change, or work the principal reviews after stepping away. Scales rigor to the task, runs a hypothesis loop, and logs decisions. Use for /figure-it-out or 'figure it out'."
disable-model-invocation: true
route: "A multi-phase task that no playbook card matches, such as a large migration or an ambitious multi-part change."
triggers:
  - pattern: "/figure-it-out"
    type: command
    priority: 100
---

# Figure it out

When the task matches no playbook card, design one. The deliverable before any code is the workflow itself: a sequence of phases that scales rigor to the task, runs the scientific method, and leaves a decision trail the principal can audit after stepping away.

## Start

Check the playbooks index in your working method first. If a card matches the task shape, use that card and stop here; a designed playbook does not compete with an existing one.

Otherwise open a todo list whose first item is to read the principles index, `the-algorithm/references/principles.md` under the Soma skills directory, and `principles.local.md` beside it when it exists. Read each principle's file before you apply it. Then add the phases below as todos.

## Phase A: Frame

Ground first, then commit. Do not start the run until you can state:

- The definition of done as a falsifiable predicate: one or more binary claims, each with a probe that could fail (`the-algorithm/references/principles/verify-before-claiming.md`, `the-algorithm/references/principles/one-probe-per-criterion.md`).
- Scope, quantified: rough units and effort, plus the blockers grounding surfaced.
- The rigor level, biased high. One-way doors and a wide blast radius get more. Reversible low-stakes steps get less. Rigor is gates and artifacts, not "try harder".

Present the framing and tradeoffs before committing to a long run. Reversible work proceeds (`the-algorithm/references/principles/build-over-ask-when-reversible.md`), but a multi-hour run earns one checkpoint.

## Phase B: Design the workflow

Decompose into atomic, independently landable units. Sequence the riskiest unknown first. Scaffold and verification come before features (`the-algorithm/references/principles/foundational-thinking.md`).

- Build the verification harness before the work, with the baseline captured from the pre-change state, so each check reads as "old value vs new value".
- For a one-way-door design decision, run the `arena` skill. Skip it for mechanical work whose shape is already concrete. A second arena over a settled design is over-engineering (`the-algorithm/references/principles/laziness-protocol.md`).
- Decide what fans out. Parallelize only across seams, and give each worker its own worktree or branch (`the-algorithm/references/principles/separate-before-serializing-shared-state.md`). Do not over-fan. Pick each subagent's model and reasoning effort for its job: a mechanical lookup runs a step cheaper than a design judgment.
- Write the designed phase list down. That list is what the principal reviews.

Then execute the design. Add its steps to the todo list as concrete items between the Phase C and Phase D entries. Run each under the Phase C loop discipline, and log a Phase D row as each step lands rather than saving the whole trail for the end.

## Phase C: Run the loop

Each unit is an experiment. State the hypothesis, make the smallest change, measure against the predicate on the real artifact, keep it if it advanced, and revert it if it did not. Verify each unit before starting the next instead of batching checks at the end (`the-algorithm/references/principles/sequence-verifiable-units.md`).

- Verify by inspecting the artifact, never a self-report. When something passes too easily, suspect the observation method before the system.
- Pair delegated work with a judge, and read its diff yourself (`the-algorithm/references/principles/own-delegated-work.md`). If a worker games the gate, reset and harden the contract. If the gate itself is wrong, fix the gate in its own change rather than routing around it.
- A verdict is VERIFIED, NOT VERIFIED, or INCONCLUSIVE. Inconclusive is not a pass. Do not hide a negative.

## Phase D: Keep the audit trail

Log the run with the `show-me-your-work` skill: one `decisions.tsv` row per fork, revert or verified unit, written through its helper. The first rows after `start` record the predicate and the rigor level under phase `frame`. This work is usually ambitious enough to commit the trail so the reviewer can read it in the PR. The trail plus the diff is what lets the principal come back and trust the work.

## Phase E: Verify and hand back

Check the whole against the Phase A predicate on the real product, not just the harness. Encode any recurring correction as a gate, a lint rule, a check or a script (`the-algorithm/references/principles/encode-lessons-in-structure.md`). Run `show-me-your-work`'s end-of-run audit and cross-model review before you reply.

**Reply:** the playbook you designed, the rigor level and why, the decision-trail path, what is verified against the predicate, what is still open, and `show-me-your-work`'s Attention section.

## Inside an Algorithm run

The phases above work on their own. Inside an Algorithm run they map onto the run's records, so nothing is kept twice:

- The no-card call, the rigor level and the trail path each go in with `algorithm decision --id <run-id> --text "..."`. The working method's rule "No card matches: run without one and record that in the run's decisions" is satisfied by that first decision.
- The Phase A predicate becomes the run's criteria: each binary claim is one `--criterion "C1:..."` on `algorithm new`, plus at least one `Anti:` criterion for the failure the run must not cause.
- The rigor level shapes gates and artifacts inside the tier the classifier set. When it shows the work is larger than that tier, escalate the tier as a context override and record why; never lower the rigor to fit the tier.
- The Phase B phase list becomes plan steps: `algorithm plan --id <run-id> --step "P1:C1,C2:<step>"`, one per unit, each naming the criteria it advances. Close each with `algorithm step` as it lands.
- Each Phase C verdict on a criterion goes in with `algorithm verify` as it happens. VERIFIED is `passed` with the probe output as evidence, NOT VERIFIED is `failed`, and an INCONCLUSIVE criterion stays open.
- The per-unit trail stays in `show-me-your-work`'s `decisions.tsv`. The run's decisions hold the commitments; the TSV holds every fork, revert and verified unit, with evidence pointers.

Source: ported from pstack `pstack/skills/figure-it-out/SKILL.md` at commit c742dd61706fbacc1b95f1a20b7b988cf096ce6c. Changed: pstack's principle skills map to Soma's principle files, `architect` to `arena`, and pstack's subagent rules to `own-delegated-work`; added a playbook-card check before designing, the Algorithm run mapping, a `route:` line and a command trigger.
