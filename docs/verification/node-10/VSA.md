---
task: Port reflect as a pinned three-lens Soma skill
effort: E4
mode: headless
---

## Problem

The pack has no session-wide reflect workflow. Upstream depends on Cursor-specific transcript, model and skill-edit routing.

## Vision

A principal can request reflection and inspect three independent lenses followed by a synthesis. Lessons become either approved skill changes or testable structural backlog proposals.

## Out of Scope

Sibling deep-check findings stay outside node #10. This worker does not change graph state, publish, push or apply reflection proposals to other skills.

## Principles

Encode enforceable lessons as structure rather than adding duplicate prose. Preserve principal control over changes to future agent behavior.

## Constraints

Use the assigned branch and full upstream pin; retain the root MIT notice. Run checks on this host and the full pack gate once immediately before the final commit.

## Goal

Ship reflect as a standalone Arc library member. Prove its three-lens sequence, structural backlog routing and approval boundary on a finished captured session.

## Checkpoints

- [x] ISC-1: Member validates with Arc.
- [x] ISC-2: Bundled reference graph resolves.
- [x] ISC-3: Isolated projections resolve to matching source.
- [x] ISC-4: Live probe contains three independent reviewer outputs followed by synthesis.
- [x] ISC-5: Live probe produces a structural backlog proposal with a concrete check and regression probe.
- [x] ISC-6: Anti: Reflection probe changes no reviewed skill without principal approval.
- [ ] ISC-7: Final host pack gate exits zero.
- [ ] ISC-8: Assigned branch contains the implementation commit and has a clean worktree.

## Test Strategy

ISC-1 uses `arc validate skills/reflect`; ISC-2 uses `bun test test/reflect.test.ts`. ISC-3 uses `project.py`; ISC-4 and ISC-5 use saved actual subagent responses and their synthesis. ISC-6 compares the reviewed skill to HEAD. ISC-7 uses the prescribed final command, and ISC-8 uses git branch, log and porcelain status.

## Features

P1 ports the entry point and prompts, covering ISC-1 and ISC-2. P2 checks isolated projections for ISC-3. P3 runs the completed-session probe for ISC-4 through ISC-6. P4 verifies the gate and commits for ISC-7 and ISC-8.

## Decisions

Standalone reflect preserves a workflow absent from the other members. Findings requiring external writes remain local proposals under this worker's restricted authority. Eight atomic probes are appropriate for this bounded prose port; expanding to the E4 soft floor would manufacture redundant checks. Upstream's unsupported frontmatter invocation flag is replaced by Codex policy metadata and explicit skill-body routing.

## Changelog

Conjecture: upstream invocation metadata could pass the local validator. Refuted by: quick_validate rejects disable-model-invocation. Learned: keep invocation policy in supported substrate metadata. Criterion now: ISC-1 and the separate skill validator check the portable member.

## Verification

Arc validation and quick_validate pass. The focused tests cover resolving references and Codex invocation policy, and all seven projections match their source routing. report.md and probe-provenance.json preserve the actual lens/synthesis responses; backlog.md qualifies the structural proposal. approval-probe.json records the unchanged scratch source under an unapproved Accepted row. Final gate and commit remain pending at this snapshot.
