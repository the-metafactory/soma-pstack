# End-of-run audit follow-up

Transcript: transcript.jsonl; same run node-5-scratch-sort. Read alongside the original audit.md and review.md, which remain unchanged.

Rechecked rows 2-8 and their evidence. Row 7 supersedes row 3 to clarify that default refers to the sort comparator, with LC_ALL=C explicitly set. Transcript line 3 proves both the comparator invocation and locale. The original audit's default-sort wording has the same qualification. Row 8 points to the actual cross-model review; transcript line 8 records the response to it. Row 9 records this follow-up audit. All pointers resolve. The initial TSV bytes remain unchanged.

The missing locale fork was deliberately planted in this scripted fixture: the probe demonstrates append-only repair, not automatic discovery in arbitrary conversations. Independent review checked the actual claims against transcript outputs. Timestamp precision is one second; row number plus timestamp identifies superseded rows, so a timestamp alone is never treated as unique.

The separate 12-test host run also exercises pickup and return start rows. projection.md records all seven isolated substrate checks. Pack validation is deliberately deferred until immediately before the commit.
