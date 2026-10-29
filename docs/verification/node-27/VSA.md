---
task: Address node 10 review findings on node 27
effort: E4
mode: headless
---

## Problem

PR #26 merged with four review findings at reviewed head `0fdd1d05948771186ffaa5cbf9c70a0a7fd6e26e`. The runner could overwrite historical evidence, its test lived in the shared test directory, and two bundle descriptions were inaccurate.

## Vision

Readers can distinguish recorded review inputs from the current runner configuration. Reusing the runner preserves the evidence already present.

## Out of Scope

This change addresses only the four findings supplied on node #27. The supervisor owns publication, review, and principal merge; this worker does not change graph state.

## Principles

Historical inputs and responses remain evidence of what happened. Correct inaccurate descriptions explicitly rather than rewriting recorded reviewer inputs or verdicts.

## Constraints

Use the assigned branch and run tests on this host. Run the full pack gate once immediately before the final commit, and leave the worktree clean.

## Goal

Address each supplied finding in a committed change ready for supervisor review. All four are accepted; none is declined.

## Checkpoints

- [x] C1: Existing review artifacts survive rejected reruns byte for byte.
- [x] C2: The CLI rejects invocation without an explicit round before calling the reviewer.
- [x] C3: The runner test passes from beside the node-10 evidence script.
- [x] C4: The trail documentation identifies the runner's absence from the recorded bundle.
- [x] C5: Round-3 documentation and current instructions disclose included prior conclusions.
- [x] C6: Anti: Recorded review input, response, and verdict artifacts remain unchanged.
- [x] C7: The final host pack gate passes.
- [ ] C8: The assigned branch contains the repair with a clean worktree.

## Test Strategy

C1 and C2 use the Python runner test, with a mock provider for artifact cases and an isolated CLI process for argument handling. C3 uses its documented direct host command; C4 and C5 use the recorded input hash maps and corrected prose. C6 compares historical artifacts byte for byte against base `f0459a5`. C7 uses `bun scripts/check-pack.ts`; C8 uses the post-commit branch, log, and porcelain status probes in Algorithm run `ranger-soma-pstack-node-27`.

## Features

P1 guards the runner output boundary and requires an explicit round, covering C1 and C2. P2 relocates the one-off test and corrects provenance, covering C3 through C5. P3 checks preservation, runs the final gate, and commits, covering C6 through C8.

## Decisions

D1: Reject a round when any input, response, stderr, or Markdown output already exists. Protect partial runs as well as completed ones. Retain all four historical configurations; the CLI provides no output-directory or retry option. Tests exercise creation only in isolated output directories.

D2: Move the Python check beside `review.py` rather than add this one-off evidence tooling to the permanent pack gate. Update the round-3 bundled test path with the move.

D3: Disclose indirect inclusion of earlier conclusions instead of constructing another historical audit. Preserve all recorded input hashes and reviewer responses.

D4: Eight criteria cover this bounded four-finding task. Expanding to the E4 soft floor would duplicate the same probes; the full twelve-section structure is retained.

## Changelog

Conjecture: The runner permits historical overwrites and a bare invocation reaches the reviewer. Refuted by: no contrary evidence; the pre-fix regression produced 17 failures, including `AssertionError: FileExistsError not raised` and a bare CLI reaching the provider launch. Learned: protect outputs before bundle construction and require the positional argument. Criterion now: C1 and C2 pass with the same regression cases.

## Verification

The failing regression was committed first as `db929fa`. Before repair, `PYTHONDONTWRITEBYTECODE=1 python3 test/reflect_review_test.py` exited 1: four tests ran with 17 failures (16 existing-artifact cases and the missing-round case). After repair and relocation, `PYTHONDONTWRITEBYTECODE=1 python3 docs/verification/node-10/review_test.py` ran four tests and returned OK. The successful fresh-output and provider-failure cases also still pass. These tests use isolated output directories and do not contact a provider.

The actual CLI rejects a bare invocation with exit 2 and rejects the saved `review` round with exit 1, naming its preserved artifact. All 15 historical review artifacts match base `f0459a5` byte for byte before and after those probes. The saved trail inputs omit `review.py`; the saved round-3 inputs include both the README and finish-pass record. Their hashes do not match the committed versions in the reviewed head's local history, so the exact input snapshots are not reconstructed here. The supplied PR finding identifies the earlier verdict and F1–F6 dispositions; no claim is made that the later R1–R8 dispositions were supplied to round 3. `git diff --check` passes.

F1 (artifact overwrites): Addressed by the output preflight and required round argument. F2 (trail bundle drift): Addressed in the node-10 finish-pass provenance correction. F3 (one-off test placement): Addressed by moving the test beside the runner and documenting its direct command. F4 (round-3 omission claim): Addressed in the README, finish-pass record, and current round instruction. No finding is declined. Merge and node-close acceptance remain with the supervisor and principal.

The prescribed `bun scripts/check-pack.ts` ran once on this host immediately before repair commit `d4d8283` and passed for all 28 members. The earlier claim about two tool-free audit rounds is withdrawn: their prompts, input hashes, and responses were not retained with this change. Those rounds are not verification evidence. Race-safe creation and retry controls are outside this node.

Post-commit status is pending at this precommit evidence snapshot. C8's readback belongs to the worker report and Algorithm run; no future commit or merge is claimed here.

### Node #27 finish pass, round 1

Both findings are accepted. `review.py` defines `ARTIFACT_SUFFIXES` once; the runner guard and preservation test iterate that declaration. The unsupported audit claim above is withdrawn rather than reconstructed. No finding is declined.

`PYTHONDONTWRITEBYTECODE=1 python3 docs/verification/node-10/review_test.py` passed all four tests on this host before and after the refactor. All 15 historical review artifacts remain byte-for-byte identical to `d4d8283`, and `git diff --check` passes. The final pack gate and commit readback belong to Algorithm run `ranger-soma-pstack-node-27-finish-1`; they are pending in this snapshot.
