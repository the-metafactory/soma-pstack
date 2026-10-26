# Decision-trail audit

Run: `ranger-soma-pstack-node-8`. One writer, the node #8 worker.

Audited `decisions.tsv` rows 2–9 against the scripted scratch-task transcript
`probe-transcript.jsonl`, `validation.jsonl`, source/diff snapshots and the
independent investigator/reviewer reports. Row 10 records this audit. Those
artifacts capture this run's relevant probe commands and actual outputs, not
other sessions. No full worker-session transcript was exposed to this run;
the audit of activity outside the captured probe/validation material is
**incomplete**.

- Rows 2–4 map to the Algorithm run, original/updated skill and the worker SOP's
  prohibition on graph edits. The external status update remains pending.
- Row 5's existing tests are present and passed in the baseline transcript.
- Row 6 prematurely treated exit 1 as two lint hits even though the JSON
  attempt failed with a Bun temp-directory error. Row 7 explicitly supersedes
  it, preserves the mistake, and points to the actual read-only replay with
  two JSON diagnostics. The missing Bun-to-Node tooling choice is recorded in
  that replay's transcript and row 7's evidence.
- Row 8 maps to the investigator report, two-comment-only source diff, expected
  mutation failures, successful final checks and independent reviewer verdict.
- Row 9 maps to successful isolated projection and byte comparison.

Missing forks captured here: the first temporary-home projection failed because
the runtime/profile did not exist; a synthetic profile and repo-local CLI
supplied the required fixture, without touching the live home. ESLint formatter
and Bun resolution failures remain in the transcript. No source workaround or
host configuration change was introduced.

Evidence pointers were read and checked. The Algorithm run id in row 2 resolves
via `soma algorithm show --id ranger-soma-pstack-node-8`; all repository-local
paths resolve. The GitHub link in row 4 was read this session, and remains an
external action handoff rather than completion evidence.

Before commit, a different-family reviewer receives this audit, decision log,
probe/validation transcripts, the skill diff and reports. Its actual model
identity and output are saved separately. The final pack gate is intentionally
not run until immediately before the worker commit.

## Final addendum

Rows 11–15 were added after the initial rows 2–9 audit. They record the actual
cross-model review rounds, the contract clarifications they motivated, fresh
projection of the final text, the reviewed scratch commit, and the final
independent skill verdict. The source diff, two raw cross-model results,
dispositions, final reviewer report, final validation records, and
`scratch-commit.txt` support those rows. The scratch commit and clean status are
also captured in the probe transcript. Row 16 records this addendum.

The final pack gate's actual command/output and log row are appended immediately
before commit. All artifacts are staged for the final whitespace check. This
extends the captured-artifact audit; it does not remove the explicitly reported
absence of a full worker-session transcript. The external #1068 item remains
pending supervisor action in every report.
