# Review of the node-5 repair round (show-me-your-work)

**Verdict:** I found no blockers. The two important findings and the two optional maintainability findings are fixed in the artifacts, not just claimed. One major evidence gap, around redaction before egress, should be closed or recorded before the final commit. Several smaller items are listed below.

## Verification of the claimed fixes

| Claim | What the artifacts show | Status |
|---|---|---|
| Session reads declared | The manifest adds `~/.claude/projects/**`, `~/.codex/sessions/**`, `~/.cursor/projects/*/agent-transcripts/**` and `~/.pi/agent/sessions/**`. SKILL.md now ties transcript reads to those declared paths. | Verified |
| Reviewer egress declared | `network: []` is replaced by `api.anthropic.com` and `api.openai.com` as `{host, reason}` entries. SKILL.md requires remote review to use a declared host and says a proxy or custom endpoint needs a new declaration. | Verified |
| Manifest is valid | The transcript shows `arc validate` returning OK (line 126). | Verified |
| Shared TSV helpers | `test/helpers/decision-trail.ts` holds `rows` and `keepsPrefix`. Both the test file and the probe import them, and the old ad-hoc `split` calls are gone. Empty trailing cells survive. | Verified |
| Audit text derived from observed rows | The probe derives the supersession target, gap row, checked range and audit row from `trail.length`. A single `summary` feeds the transcript event, `audit.md` and the audit row's result. The scratch output (rows 2-5 checked, row 5 the gap, row 6 the audit) is internally consistent. | Verified |
| Tests and checks | 12 pass, 0 fail, 43 assertions (line 126); `quick_validate` passes; the probe ran at line 135. | Verified |
| Append-only discipline | Row 11 supersedes row 8. Counting the header as line 1, row 8 is the 20:31:55 review row, so the pointer is correct. Row 7's `supersedes row 3 (20:28:31Z)` also resolves. The logger itself was not touched. | Verified |

## Remaining blockers

None.

## Remaining majors

1. **Redaction before egress is not evidenced.**
   - SKILL.md requires "redact secrets before the hand-off".
   - `review.py` (line 182) concatenates the full text of eight repo files, the scratch files and the transcript extract, then pipes them to `claude -p`. It has no redaction or secret-scan step.
   - No row or artifact records that a scan was done or that none was needed.
   - The supplied material shows no secrets, only local paths, so the risk looks low. A skill that mandates redaction should still be seen following it on its own run.
   - Fix: add a cheap scan step, or log a row stating what was checked and the result.
   - The decision to invoke `claude -p --model sonnet` in isolation (no tools, no MCP, no settings) and to send only a filtered extract (no reasoning, nothing before the plan) is recorded only in `review.py` and `review-round-1.md`, not in the TSV. It is exactly the kind of egress fork the trail exists to capture.

## Pending items to close before commit

- Append a review row for this round with the model identity, `reviewed by claude-sonnet-5-5`, pointing at `review-round-1-review.md`. That file is written by `review.py` and was not in the supplied pack, and `review.py`'s own output is not in the transcript.
- Append the final audit row covering the review, the extract script and the gate result.
- Confirm the `review.py` assertion that the existing TSV bytes still start with the `252645a` base. `review-round-1.md` describes this check in the future tense, and its result is not visible in the supplied output.
- Row 8's first review was labelled "nonblocking findings addressed". The manifest/capability gap it missed was later rated important. Row 11 corrects this, but neither `review.md` nor Sage's round-1 finding is in the pack, so I could not check what the first reviewer actually said. Treat cross-model review as a useful signal, not a reliable gate.

## Decision-trail assessment

- **Row 10 (start):** The preceding range 20:28:30Z to 20:31:55Z matches rows 2-9, and the run id is named. Its evidence, `review-round-1.md`, did not exist when the row was logged at line 91. It was created at line 166, so the pointer resolves now but did not at the time.
- **Rows 13-15:** These point at `review-round-1.md`, a narrative the same agent wrote afterwards. Raw test and validator output is only in the transcript, not saved as a standalone artifact. That is acceptable but second-hand evidence.
- **Row 12:** Its result, "targeted checks pending", is never explicitly superseded. Row 13 follows it in sequence, which is fine.
- **Unlogged forks (all minor):**
  - The `/tmp/todo.md` checklist deviation, where `soma install` was replaced by isolated `project-skill`.
  - The wording change of the probe's first sort row to "lexical sort with explicit LC_ALL=C". That row text now precedes the supposedly "missing" locale fork, which weakens the fixture's realism, although line 3 does record `env LC_ALL=C`.
- **Projection claims:**
  - Row 14's "init seeded it" is inferred from the later retry. The init output shows only the migration refusal.
  - The retry reports every link as `unchanged`, so links already existed.
  - The projections look like symlinks into the worktree: the refusal message says "symlink target resolves outside $HOME", and the output lists "Links". If so, "match byte for byte" is close to tautological. It proves resolution to the source, not an independent copy.
  - "Active installation untouched" rests only on the `--home-dir` and `--soma-home` flags; no before/after check is shown.
- **Scope:** Five modified files plus one new helper. This is tight and matches the plan, with no creep.

## Optional suggestions

1. Add a test that parses the manifest and checks that the hosts and read globs SKILL.md names match it. SKILL.md hard-codes "currently `api.anthropic.com` or `api.openai.com`", which can drift. The manifest change is the core of this round and has no test of its own, only `arc validate`.
2. The scratch test's audit-row assertions use the same arithmetic as the probe (`trail.length + 1`). They check internal consistency, not independent correctness. A fixed-expectation check on one case would help.
3. The manifest sets `secrets: []`, but an authenticated reviewer CLI needs credentials. The prose says capabilities do not grant credential access, which mostly covers it. Given this finding's history, a one-line manifest comment would remove doubt.
4. The globs `~/.claude/projects/**` and `~/.codex/sessions/**` are broader than "exact session only". This is inherent to glob declarations, and the prose constraint is the only guard. Say so in a manifest comment.
5. Seven substrates are projected but only four session stores are declared. The fallback ("caller supplies the transcript") covers the rest and is consistent, but state it explicitly in the manifest or docs.
6. Save raw command outputs (the test run and validators) as a verification artifact and point the trail at it.

## What I could not verify

- The `review.py` result and its base-bytes assertion.
- The first-round `review.md`.
- The full-pack gate.
- Any claim about Arc enforcement semantics beyond the schema validation shown.

## Attention

reviewed by claude-sonnet-5-5 (Sonnet 5.5, Anthropic family, different from the Codex implementer)

- **Majors:** Row 15 and the `review.py` call (line 182): no redaction step or log row before the payload went to `api.anthropic.com`.
- **Projection claims:** Row 14: "init seeded it" is inferred, "active installation untouched" is unevidenced, and the byte-match likely compares symlinks to their own source.
- **Evidence timing:** Rows 10 and 13-15 cite `review-round-1.md`, which was authored by the same agent and, for row 10, did not exist when the row was written.
- **Pending trail rows:** The review result and the final audit rows are not yet in the trail, so no completion claim should be made before they are appended.
