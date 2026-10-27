# Audit: reflect port (node #10)

**Verdict: concerns.** I found no fail-level defect. The member is structurally coherent, and the pending gate and commit are not claimed as passed. Several claims are weaker than they read, though. The invocation guard is Codex-only, the approval boundary is untested in practice, and the independence and sequencing claims cannot be fully checked from this evidence. The probe's only backlog item is also thinner than the report presents it.

I ran nothing. Everything below is from the supplied files, and `transcript-extract.jsonl` is curated by the author.

## What the evidence supports

- **Reviewer routing:** the three `spawn_agent` calls (extract lines 155, 161, 167) set `fork_turns: none` and pass no model parameter. That matches the "inherited/default routing, unknown model identity" disclosure in `README.md`.
- **Sequencing:** `lenses.md` was written (line 222), then the synthesizer was spawned (line 229). Decision row 4 ("synthesis pending") was logged before that spawn.
- **Unchanged skill check:** `git diff --exit-code HEAD -- skills/no-comments` returned exit 0 (line 269).
- **Reference test:** `bun test` passed with 9 expects (line 196). That count matches 8 link targets plus the size check, and `visited.size` of 6 matches SKILL.md plus 5 references.
- **Quick validator:** `quick_validate` returned "valid" after the frontmatter flag was removed (line 196).
- **Projection:** `projection.jsonl` records real commands, with 6 byte-compared projections plus a Pi stub.
- **Citations in the lens outputs:** I checked these against `node-8/probe-transcript.jsonl`.
  - Lines 9 and 12 are the failed inventories.
  - Line 14 is the removal decision.
  - Line 13 is the mutation failure.
  - Line 23 is the first successful inventory, showing hits at lines 2 and 5.
- **Pending items:** the VSA checkboxes are unchecked, `pack-check.txt` is future, and `audit.md` states the gate and commit are pending. None are claimed as successes.

## Findings

**F1 – Medium – Portable routing: the explicit-invocation guard exists only on Codex.**
- The port removed `disable-model-invocation: true` (extract line 187). The stated reason is that the Codex `quick_validate` rejects it. That rejection output is not in the extract, though it is plausible.
- What remains is `agents/openai.yaml`, which covers Codex only. For the other six projected substrates there is only the body sentence "Run only when the principal requests reflection", and the body loads only after the skill has already triggered.
- The description is trigger-shaped ("Use when the principal asks to reflect…"). Auto-triggering would fan out reviewer calls to external model services declared in `skills/reflect/arc-manifest.yaml`.
- `docs/verification/node-10/README.md` ("keeps explicit invocation through agents/openai.yaml… instead") overstates this for non-Codex substrates.
- Pointers: `skills/reflect/SKILL.md` (frontmatter and line 11), `skills/reflect/agents/openai.yaml`, `README.md`.

**F2 – Medium – The approval boundary is prose-only, and the probe exercised it vacuously.**
- Accepted was "None", so there was no tempting edit. The `skills/no-comments` diff check only shows that nothing was edited. `README.md` admits this, but ISC-6 should not be read as forward-tested.
- The manifest grants `write: ./**` and `bash: allowed`.
- `test/reflect.test.ts` pins only link resolution. It does not pin `allow_implicit_invocation: false` or the approval clause. SKILL.md itself says to encode in structure.
- The test hard-codes `visited.size === 6`.
- The claim that it "rejects missing/escaping targets" has no negative run.
- Pointers: `skills/reflect/arc-manifest.yaml`, `test/reflect.test.ts`.

**F3 – Medium – Independence and sequencing evidence is partly unverifiable.**
- Reviewer and synthesizer message bodies are encrypted in the extract. The following claims therefore rest on `README.md` or `audit.md` alone:
  - verbatim role prompts
  - no sharing of conclusions
  - no-writes instructions
  - "concurrently"
- The extract has no wait or completion events, so overlap is not evidenced.
- `lenses.md` and `synthesis.md` were typed into the repo by the parent via `apply_patch` (lines 222 and 260), not copied from raw outputs. "Complete responses retained" cannot be confirmed as verbatim.
- Pointers: `docs/verification/node-10/README.md`, `audit.md`, `transcript-extract.jsonl`.

**F4 – Medium – The probe's backlog item B1 is overstated.**
- The cited facts are accurate, but the lesson is thin.
  - The failures were a formatter crash and a Bun tempdir `EPERM`. The node-8 log itself calls the `EPERM` intermittent (23:08:01). The review contract says to skip transient retries.
  - Line 14 (23:07:36) already names "original lines 2 and 5", so the hits were known by some route before line 23. The baseline suppression count of 2 and the baseline commit also preserve the original.
  - The subject is a scripted fixture, not an agent session.
  - Three lenses reading one log and returning one finding is not independent corroboration.
- B1's "target" is the prose file `skills/no-comments/SKILL.md`, not a concrete script path.
- Its probes cite `before-eslint.config.mjs` and `how-check.md`, which were not supplied, so those are unverified.
- Treat B1 as a weak proposal. Keep it "proposed — not filed". Do not read it as validation of the lens quality.
- Pointers: `docs/verification/node-10/synthesis.md`, `report.md`.

**F5 – Low – Source fidelity cannot be audited, and the adaptation disclosure is incomplete.**
- No upstream diff is supplied.
- `references/review-contract.md` appears new (README says "the new shared contract"). The reviewer prompts and synthesizer reference it, so they are not verbatim upstream.
- All files were authored in one patch (line 148).
- The SKILL.md footer lists "adaptations" but does not say the prompts were rewritten or a contract was added.
- Pointers: `skills/reflect/SKILL.md` (last line), `docs/verification/node-10/README.md`.

**F6 – Low – The trail is retroactive and self-audited.**
- Rows 5 and 6 are both stamped 03:25:16, logged after synthesis, for events that happened earlier (the flag removal at about line 187, the projection failures at line 227).
- The row 6 claims about the validator rejection and the launcher failure are not in the extract. Only the profile `ENOENT` is (line 227).
- `audit.md` was written by the producing agent, so it is not an independent check.
- Pointers: `docs/verification/node-10/decisions.tsv`, `audit.md`.

**F7 – Low – Some README verification claims have no call in the extract.**
- `arc validate skills/reflect` valid is one. The VSA mentions it, but no call appears in the extract.
- "NOTICE.md carries the MIT notice" and "active installation unchanged" are the others. The `git status` listing shows NOTICE.md unmodified.
- The extract is author-curated, so omission is not proof of absence.
- Pointer: `docs/verification/node-10/README.md`.

**F8 – Low – Scope and capability breadth: confirm with the principal.**
- Edits to the root `arc-manifest.yaml`, root `README.md` and `test/reflect.test.ts` go beyond `skills/reflect`. They are plausibly part of "creating the member".
- Read globs for four session stores, plus write `./**`, are broader than the exact-session policy. This is acknowledged as procedural.

## Unsupported suspicions (not findings)

- The near-identical single-finding outputs from three lenses may reflect anchoring on one log rather than independence. The prompt contents are not visible.
- The "Model identity: unknown" lines in the lens outputs may have been added by the parent rather than the reviewers.
- Reviewers may have had write access. Nothing shows it, and nothing shows otherwise.
- The validator rejection may be specific to the Codex validator, which would make dropping the flag unnecessary for other substrates.

## Attention list for the principal

1. Decide how to guard implicit invocation on non-Codex substrates (F1). Consider pinning `agents/openai.yaml` with a test.
2. Treat the approval boundary as procedural, and the probe as non-forward-testing (F2).
3. Do not file B1 as is (F4). It rests on a transient-failure fixture and has no concrete target.
4. Ask for raw reviewer outputs and an upstream diff before relying on the independence and fidelity claims (F3, F5).
5. After the gate and commit run, update the VSA checkboxes and confirm `pack-check.txt` exists. Verify the `arc validate` result directly (F7).
6. Confirm that the root manifest, `README.md` and test edits are within the node's authorization (F8).
