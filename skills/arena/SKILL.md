---
name: arena
description: "Spawn N parallel candidates at the same task, pick a base, graft the strongest parts of the losers into it. Use for /arena, 'arena this', 'throw it in the arena', or when one attempt at a non-trivial artifact would lock in the wrong shape."
disable-model-invocation: true
triggers:
  - pattern: "/arena"
    type: command
    priority: 100
  - pattern: "arena this"
    type: keyword
    priority: 60
  - pattern: "throw it in the arena"
    type: keyword
    priority: 60
---

# Arena

Open a todolist with one entry per phase (Frame, Fan out, Cross-judge, Pick, Graft, Verify) before launching anything.

## Phase A: Frame

Every candidate gets the same prompt, so the prompt is the contract.

1. State the artifact each candidate is producing.
2. Derive the rubric, 3-6 concrete gradeable criteria for what success looks like on *this* task. It is the picker's tool in Phase D. Candidates only see the task.
3. Pick the runners. A roster the principal names in the request (models, a count, or a model CLI) is the roster; use it as given. Otherwise run two candidates as sub-agents in parallel, one on model `opus` and one on model `fable`. On Claude Code that is the Agent tool's `model` parameter. On a substrate whose sub-agent tool cannot pick a model, run each seat as its own model CLI process (`claude -p --model <model>`, `codex exec -m <model>`) instead. If the tool or CLI rejects a model, use the closest valid model of the same tier from its error message, or drop the seat and say so when there is none. If dropped seats leave fewer than two runners, add runners on a remaining runner's model until there are two, or on the parent model when none remain, and say so. Spawn more runners when the arena covers multiple design directions. Use the same model N times when the work is generation-bound rather than judgment-sensitive. Pick each runner's reasoning effort for the job: raise it for judgment-heavy design work and leave it at the default for generation. Never write a candidate yourself in this conversation, since each would see the one before it. With no sub-agent tool and no model CLI, stop and say the arena cannot run here.
4. Give each candidate its own output location (a git worktree where possible, otherwise `/tmp/arena-<slug>/candidate-<n>/`), per the **separate-before-serializing-shared-state** principle (`references/principles/separate-before-serializing-shared-state.md` in the Soma `the-algorithm` skill). On Claude Code, the Agent tool's `isolation: "worktree"` gives each sub-agent its own worktree.

## Phase B: Fan out

Spawn all N candidates in one message so they run in parallel in the background, each with the task, the path to the shared grounding, its own output path, and instructions to produce the artifact and a short rationale naming the alternatives it considered and what it rejected.

If a candidate produces no output, proceed with N-1 and note the dropout.

## Phase C: Cross-judge

After all Phase B candidates complete, spawn one read-only judge on a model family other than the parent's, through an available sub-agent or model CLI. A family is the model's vendor: Claude models (`opus`, `sonnet`, `fable`, `haiku`) are one family, OpenAI's GPT models behind `codex` are another. The judge is never from the parent's family. A Claude parent gets `codex exec --sandbox read-only`. A parent from any other family gets a Claude judge on `opus`, as a sub-agent or `claude -p --model opus`. A remote judge must use a host declared in [arc-manifest.yaml](arc-manifest.yaml), currently `api.anthropic.com` or `api.openai.com`, through an already authenticated CLI. If the CLI rejects a model, use the closest valid model of the same family from its error message. If no judge from another family runs, skip the judge, pick the base alone in Phase D, and say so. Never label a judge from the parent's family as cross-family. If you do not know the parent's model, use the Claude-parent route and say that the family check did not run. The judge sees the rubric and the candidates by path label, scores each criterion, and recommends a base with rationale. Save its verdict with the judge's model identity. It runs in parallel with your reading in Phase D. Don't spawn it while candidates are still writing.

## Phase D: Pick a base

Read every candidate end to end before picking. A candidate's rationale is a claim about its artifact; read the artifact. Score each against the rubric criterion by criterion, not on holistic feel, and compare with the cross-judge when Phase C ran one. Agreement on the base confirms the pick. Disagreement means one of you is biased or the rubric was ambiguous. Read both rationales before deciding.

Pick the base a future maintainer can extend most easily without breaking invariants. When two feel tied, prefer the cleaner boundary or smaller API, per the **laziness-protocol** principle (`references/principles/laziness-protocol.md`).

## Phase E: Graft

Walk each losing candidate once more for what is worth porting into the base, usually one or two things per candidate, not most of it. Fold each graft in by hand, per the **redesign-from-first-principles** principle (`references/principles/redesign-from-first-principles.md`), so the result stays coherent under one mental model. Don't paste mechanically.

If the candidates converge on one shape, that is strong agreement. Note it and ship the consensus shape. No graft is needed. If they wildly diverge, Phase A was under-specified. Reframe and re-run rather than averaging the divergence.

## Phase F: Verify

Verify the synthesized artifact like any other output, per the **verify-before-claiming** principle (`references/principles/verify-before-claiming.md`). If verification finds a problem the arena missed, either Phase A was wrong (re-frame and re-run) or a candidate caught it and you missed the graft (go back to Phase E). Don't paper over it.

## Outputs

One synthesized artifact, with a short synthesis note alongside naming the base and why, the cross-judge's verdict or that Phase C skipped the judge, each graft with its source candidate, what was rejected and why, any convergence or dropouts, and the verification result.

Source: ported from pstack `pstack/skills/arena/SKILL.md` at commit c742dd61706fbacc1b95f1a20b7b988cf096ce6c (MIT, © 2026 Lauren Tan). Changed: triggers added; Phase A step 3 picks runners from the principal's roster or a Soma default instead of the pstack models rule; Phase C picks the judge by model family through a sub-agent or model CLI, as `show-me-your-work` picks its reviewer; principle names point at Soma's `the-algorithm` skill (`prove-it-works` is `verify-before-claiming`); Phase D says a rationale is a claim. Phase letters and names are upstream's, since other skills cite them.
