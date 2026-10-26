# Node #5 validation

Upstream: `cursor/plugins`, `pstack/skills/show-me-your-work/`, commit `b6375f1c3a8600fa8907d2214ed9f8aad0028dde` (the full SHA resolved from the requested `b6375f1`). Root NOTICE.md carries the MIT notice. POLICY.md points at the new member.

- `bun test test/show-me-your-work.test.ts`: 12 pass, 0 fail, 39 assertions on this host. Covers append-only history, supersession, initial/pickup/return starts, every formula prefix in every supplied cell, whitespace normalization, header reuse, paths with spaces, invalid arguments, and the real sort probe.
- `bash -n skills/show-me-your-work/scripts/log.sh`: passed.
- `python3 ~/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/show-me-your-work`: passed. The entry uses portable name/description frontmatter; its description retains the command trigger.
- `arc validate skills/show-me-your-work`: passed.
- `soma project-skill`: all seven substrates checked in an isolated temporary home. See [projection.md](projection.md). Six full projections match source; Pi's metadata stub resolves to the complete source. The projected helper ran outside the repository.
- The single final `bun scripts/check-pack.ts` invocation is captured in [pack-check.txt](pack-check.txt).

Reproduce the scratch task with `bun test/probes/show-me-your-work.ts <fresh-output-directory>`. It captures actual sort commands and outputs in transcript.jsonl, starts decisions.tsv with a start row, appends a superseding row and an audit that adds a deliberately missed fork. Never reuse an existing output directory.

The checked-in run is a scripted acceptance probe, not a claim that the logger automatically discovers decisions or audits arbitrary conversations. Those judgments belong to the skill's agent and its independent reviewer. Row numbers include the header; timestamps alone need not be unique.

[review.md](review.md) contains the cross-model review by Claude Sonnet 5.5; [review.json](review.json) preserves the CLI response with the actual model identity. The reviewer received only the listed repo artifacts and scratch transcript, with tools disabled. Its snapshot preceded the added start-boundary test and final projection checks. [audit-follow-up.md](audit-follow-up.md) records the response without rewriting history.

## Attention

reviewed by claude-sonnet-5-5

The scratch probe demonstrates append-only gap repair. It deliberately plants the missing fork and does not prove automatic gap discovery. The skill requires the agent to audit the actual run transcript and obtain a different-family review. The first review's pending-check notes are superseded by the validation evidence above and the final pack-check output.
