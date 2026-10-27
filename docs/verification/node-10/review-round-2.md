**Verdict: pass** (with documented non-gating limits). No supported defect blocks acceptance. The final gate and commit are pending and I do not treat them as achieved.

## First-audit concerns: disposition

- **F1 (invocation guard):** Addressed as scoped. `test/reflect.test.ts` now pins `allow_implicit_invocation: false`. README and the disposition state that other substrates have only a procedural instruction. The SKILL.md body also says "Run only when the principal requests reflection." This matches the node's stated scope.
- **F2 (approval boundary):** Addressed. `approval-probe.json` has identical before/after SHA-256 values. `probe-provenance.json` (line 416 onward) has the controller's actual response: "Accepted A1 — pending approval… `/reflect` invocation does not approve this edit." It is a synthetic fixture and is labelled as such. It tests the pending branch only, not runtime enforcement.
- **F3 (independence/sequencing):** Largely addressed. `probe-provenance.json` has timestamps, raw final messages and null model fields. The three spawns (03:21:38–03:21:50) precede the first final (03:22:18). The synthesizer spawn (03:23:08) follows all three finals. The raw outputs match the Payload text in `lenses.md` and `synthesis.md`. See Residual 1 for what remains.
- **F4 (B1):** Addressed. `backlog.md` names concrete target paths, labels them non-existent and unimplemented, and states the evidence limits. B1 remains "proposed — not filed".
- **F5 (fidelity):** Addressed. `upstream/` holds the five pinned files. The diff against `skills/reflect` is visible: the frontmatter flag, Cursor slugs and automatic tracker filing were adapted. The README now discloses that the prompts were rewritten and the contract added.
- **F6/F7/F8:** Acceptable. The trail is append-only and the audit is not presented as independent. `validation.jsonl` now records `arc validate` (exit 0), `quick_validate` and the no-comments diff. The root manifest, README and test edits are authorized.

## Residual acceptance defects

1. **Low: raw-output provenance is slightly weaker than the disposition says.** The disposition says reviewers returned "provenance-only follow-ups". The `probe-provenance.json` entries at lines 403–407 are labelled `FINAL_ANSWER` but contain the task prompts, not findings. The matching of lens outputs is therefore supported by the earlier entries (lines 199, 201 and 219), not the follow-ups. That is sufficient, but the file is easy to misread. Pointer: `docs/verification/node-10/probe-provenance.json`.
2. **Low: reflect-specific README line about the probe is stale.** The README still says "Accepted: none" for the real probe, which is accurate. It also correctly adds the synthetic fixture. No action beyond keeping the two probes distinct in the final summary.
3. **Low: stale artifact sizes.** The README says the test "follows the entry point's local references through all five reference documents", but `visited.size === 6` is hard-coded. Adding a reference will break it. This is intentional drift protection, not a defect.

## Documented non-gating limits

- Codex-only machine metadata for explicit invocation. No other substrate guard is claimed.
- Manifest read/write globs are access declarations. Exact-session scoping is procedural.
- The model identity of the reviewers is unknown.
- The probe covers one scripted session. Its three lenses converge on one B1 proposal and do not corroborate it independently.
- No approved-edit application, fallback or digest path is exercised.
- The reviewer message bodies at spawn are encrypted. The reviewers' own prompt readbacks stand in for them.

## Unsupported suspicions (not findings)

- The null `model` fields might hide a non-default model. Nothing shows this.
- The single-finding convergence may reflect anchoring on one log. The prompts shown do not suggest it.

## Attention list for the principal

1. After the pack gate and commit, confirm `pack-check.txt` exists and tick ISC-7 and ISC-8 in the VSA.
2. Treat the approval probe as a pending-branch test only.
3. Keep B1 as an unfiled proposal. Triage it separately.
4. Accept that implicit-invocation protection exists only on Codex.
