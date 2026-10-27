---
name: how
description: "Explore the codebase and explain how a subsystem works, with file:line citations: architecture, runtime flow, onboarding mental models, code walkthroughs before a change, and placement, ownership or layering questions (where should this live, which package owns this, is this the right layer). Use for how does X work, walk me through X, explain the flow of X. Use a history or motivation investigation for why questions."
triggers:
  - pattern: "/how"
    type: command
    priority: 100
  - pattern: "how does"
    type: keyword
    priority: 60
  - pattern: "walk me through"
    type: keyword
    priority: 60
  - pattern: "where should this live"
    type: keyword
    priority: 60
  - pattern: "which package owns"
    type: keyword
    priority: 60
---

# How

Explore the codebase to answer "how does X work?" questions. Produce architectural explanations at the level of a senior engineer onboarding onto a subsystem, enough to build a working mental model, not so much that it reads like annotated source code.

Every spawn is a read-only sub-agent: it may read, search and run read-only commands, and it never edits, writes or files anything. Spawn each explorer with model `haiku` and every explainer with model `opus`. If the sub-agent tool rejects a model, use the closest valid model of the same tier from its error message and say so. With no sub-agent mechanism, run the same prompts one after another in this conversation and disclose that fallback.

Cite every claim about the code as `file:line`, and read the cited line before you cite it. A claim you could not trace is not a finding; it goes under Gotchas or Open Questions.

Paste this paragraph and the two sections at the end of this file ("When the subject is not there", "Where a trace stopped") into every explorer and explainer prompt you build; the reference templates do not carry them.

## 1. Assess complexity

If the scope is ambiguous, state your interpretation and explore. The user can redirect.

- **Simple** (a single module, a small utility, a narrow question such as "how does function X work"): no explorers. Spawn one explainer that explores and explains in one pass, built from `references/explainer-prompt.md` without the explorer-findings section; tell it there are no explorers, so it traces the code itself and skips the reconcile instruction. Go to step 4.
- **Complex** (a subsystem spanning multiple files or services, a cross-cutting feature, a full architectural overview): go to step 2.

When in doubt, take the simple path.

## 2. Explore (complex only)

Decompose the question into 2 to 4 angles, each a distinct slice of the subsystem. Spawn all explorers in a single message, each with `references/explorer-prompt.md` and its angle filled in.

## 3. Synthesize (complex only)

Once all explorers have returned, spawn one explainer with `references/explainer-prompt.md` and every explorer's findings filled in.

## 4. Present

Present the explainer's output. Light edits for clarity or context from the conversation are fine. Do not substantially rewrite it.

## Output format

The explanation uses the sections defined in `references/explainer-prompt.md`, dropping any that do not apply: Overview, Key Concepts, How It Works, Where Things Live, Gotchas.

## When the subject is not there

If the question names a subsystem, command or file that a search of the repository does not find, state your interpretation of the question, say that nothing was found and what you searched, and stop. Do not infer a flow from the name, from similar code or from memory. Offer the nearest real candidates you did find, labeled as candidates.

## Where a trace stopped

An explanation that stops short says so. Put each place a trace stopped (an explorer's Open Questions, a dynamic dispatch you could not resolve, code outside the repository) under Gotchas, naming the last `file:line` reached.

Source: ported from pstack `pstack/skills/how/SKILL.md` at commit 99743e9c151c8537cbbf1f98bb38f34ef3368453 (MIT, © 2026 Lauren Tan); pin in arc-manifest.yaml.
