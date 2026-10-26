# Review: node 5 show-me-your-work port

**Verdict: pass with non-blocking findings.** I found no demonstrable defect that breaks an acceptance criterion. This is a read-only review of the supplied text. I executed nothing, so the "11 pass, 0 fail" figure is taken from your report. The test count does match the file: 1 + 1 + 6 prefix cases + 1 + 1 + 1 = 11. Pack gate and projection checks are pending, and I make no claim about them.

## Acceptance check

| Criterion | Status | Pointer |
|---|---|---|
| Append-only superseding rows | Met for the probe. `log.sh` only uses `>>`. Row 4 cites `supersedes row 3 (ts)`, and the probe compares the earlier bytes after every append. | `log.sh:21-33`, probe `append()`, `decisions.tsv` row 4 |
| Every run starts with `start` | Met in the probe only (row 2, `new log: …`, evidence `transcript.jsonl:1`). | `decisions.tsv` row 2 |
| Audit fills missing forks | Met. Transcript line 4 (the locale fork) appears as row 5, and `audit.md` names it. | `transcript.jsonl:4`, `decisions.tsv` row 5 |
| Review ends with Attention | Procedural (SKILL.md). This reply ends with one. | |
| Logger strips `= + - @` prefix bytes | Met. `clean()` runs `tr` first, then `sed` strips leading whitespace and prefix bytes, so `" \t= + - @ "` is covered. The six prefix tests exercise it. | `log.sh:28-30`, test prefix loop |

## Scratch rows against transcript and audit

I checked every pointer by hand, counting the header as line 1, as `audit.md` does:

- Row 2 → `transcript.jsonl:1` (run and task) ✓
- Row 3 → `:3`, stdout `1\n10\n2\n`, matching "1, 10, 2" ✓
- Row 4 → `:6`, stdout `1\n2\n10\n` ✓
- Row 5 → `:4`, the locale fork ✓
- Row 6 → `audit.md` ✓

Row numbering is consistent: row 4 targets row 3, and the audit's "rows 2-5" excludes the audit row itself.

## Demonstrable issues (minor)

1. **Row 3 mislabels the first sort as the default.** `decisions.tsv` row 3 says "tried default sort", but `transcript.jsonl:3` shows `env: {"LC_ALL":"C"}`. The probe forces `LC_ALL=C` for every command (probe `execute`, ~line 25). So the first sort was not a default-locale sort. The "Keep LC_ALL=C" fork (`:4`) is logged after a command that already used it. `audit.md` states "default sort really produced 1,10,2" and did not catch this. Under append-only rules the fix is a superseding row, not an edit.
2. **The supersession timestamp does not identify the row.** Rows 3 to 6 all carry `2026-10-26T20:28:31Z`, so `(ts)` in row 4 matches four rows. Only the line number disambiguates. This is consistent with the spec, but the ts adds no safety here.
3. **Tests never exercise a second `start` row.** Nothing covers a returning run, a pickup, or a `start` naming a preceding timestamp range. The logger does not enforce `start`-first, so that criterion rests on prose plus a single-run probe.

## Limits of the evidence (stated plainly, not defects)

- **The audit is circular.** The probe plants `deliberatelyUnloggedUntilAudit` (probe ~line 38), then "finds" it by checking for that flag (~line 46). This proves that a gap can be filled append-only. It does not show that a gap would be detected.
- **The pointer check is shallow.** The loop (~line 50) only tests that `transcript.jsonl:N` exists. It does not check that the event supports the row's claim. I verified the claims by hand above, and they hold.
- **`audit.md` is a static string.** Its row numbers are hardcoded, and the transcript is identified only by filename, with no hash or session id. Any later change to the probe would leave `audit.md` silently stale.

## Risky or unsupported concerns

- **Prefix stripping is lossy.** A result of `-1` is stored as `1`, and a decision such as `-n chosen` becomes `n chosen`, silently. The spec requires this, so it is a design cost, not a bug. SKILL.md could warn authors to avoid leading signs.
- **The manifest may understate what the skill does.** `arc-manifest.yaml` declares `read: ./**` and `network: []`. The skill reads session stores outside the work directory and sends material to a remote reviewer. Only a comment covers this. I can't tell whether arc enforces these fields, so I can't call it demonstrable. `bash.allowed: true` is also broader than the single helper script needs.
- **SKILL.md has no caution about the reviewer hand-off.** It tells the agent to give the full transcript to an external model, with no secrets or consent note. That is outward-facing, so a one-line confirm-or-redact instruction would fit.
- **`references/decision-log-template.tsv` was not supplied.** Test 1 and test 2 depend on it (a trailing newline, for example). I only know they pass because you report so.
- **Several edge cases are unsupported concerns, not bugs.** There is no file locking, which the single-writer rule covers. A log with no trailing newline would merge rows. Leading Unicode whitespace is not stripped, because the sed runs under `LC_ALL=C`. Trailing newlines become trailing spaces.

## Suggested follow-ups

- Append a superseding row for row 3 noting the sort ran under `LC_ALL=C`.
- Add a test with two `start` rows.
- Have the audit compare each row's `result` to the cited event's `stdout`.

## Attention

reviewed by Sonnet 5.5 (claude-sonnet-5-5)

- `decisions.tsv` row 3 ("tried default sort") conflicts with `transcript.jsonl:3` (`LC_ALL=C` applied). `audit.md` missed this.
- The locale fork (row 5, `transcript.jsonl:4`) was planted by the probe, so the audit shows gap filling, not gap detection.
- Rows 3 to 6 share one timestamp, so `supersedes row 3 (ts)` is ambiguous without the line number.
- No test covers a second-run `start` row, so that acceptance item is only partly evidenced.
- Pack gate and projection checks are pending. This review does not cover them, and I did not execute the tests.
- The manifest capabilities (`read ./**`, `network: []`) may not match the skill's session-store reads and remote-reviewer use.
