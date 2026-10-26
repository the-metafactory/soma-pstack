# Node #6 verification

The member ports [pstack's blast-radius skill](https://github.com/cursor/plugins/blob/b6375f1c3a8600fa8907d2214ed9f8aad0028dde/pstack/skills/blast-radius/SKILL.md).
Its manifest pins that full commit. The pack's root NOTICE.md carries the MIT notice.
The five rungs, decisive-fact focus, six investigation steps and library/wire/timing
boundaries are preserved. Portable PR/reviewer lookup replaces upstream skill
dependencies. The report explicitly lists every fact's evidence and stopping reason.
Upstream's explicit-invocation setting is carried in Codex's `agents/openai.yaml`;
other substrates retain their own invocation behavior.

## Live invocation

A separate worker read the new skill and assessed the parent-selected PR using exact
raw before/after snapshots. Its forked context included the startup/FFI premise, so
this proves skill use and separate execution rather than blind fact discovery. It applied the skill to
merged [Soma PR #1076](https://github.com/the-metafactory/soma/pull/1076).
The task was read-only assessment; scripts and projections used disposable state
on this host. No containers, production mutation or model-backed Pi turn were used.

Read [live-report.md](live-report.md) for each safety fact's rung, evidence and
remaining gap. [live-transcript.txt](live-transcript.txt) preserves actual commands,
outputs and exit statuses. The final runner and supplemental script reproduce the
checks; the original transcript also contains exploratory commands. The report
explains setup, the corrected buffered-pipe harness, and bounded coverage. Paths in the captured artifacts
identify the original host environment and are not installation instructions for the
skill. These probes assess the historical merged change; they add no new merge gate
to Soma.

## Member validation and projection

On 2026-10-26, on the host:

- `arc validate skills/blast-radius`: exit 0, valid arc/v1 manifest.
- Skill Creator's `quick_validate.py skills/blast-radius`: exit 0, `Skill is valid!`.
  Its initial rejection of upstream's `disable-model-invocation` frontmatter led to
  the supported Codex policy file; validation then passed.
- Local Markdown pointers to the manifest, invocation policy and root notice resolve.
- `bun test test/check-pack.test.ts`: exit 0; 31 pass, 0 fail, 84 assertions.
  [pack-targeted-tests.txt](pack-targeted-tests.txt) contains the full output. An
  earlier run's completion was not captured; the recorded repeat ran in the foreground.
- `soma init --apply` bootstrapped a disposable home under
  `/tmp/soma-pstack-node-6/projection-soma`, with substrate home
  `/tmp/soma-pstack-node-6/projection-user`. `soma project-skill` applied the member to
  `codex,pi-dev,claude-code,cursor,grok,dsh,anthropic-cowork` using those explicit homes.
  Readback compared SKILL.md, arc-manifest.yaml and agents/openai.yaml byte for byte
  on all six full-body projections; every comparison passed. Pi's frontmatter-only
  stub names the skill and points to the complete, matching registry body. This proves
  projection content, not each substrate's runtime invocation policy enforcement.

No wording-matching tests were added for the prose. Existing pack tests cover member
structure; the independent invocation checks whether the instructions lead to real
evidence. The final full gate runs once immediately before committing; its result is
saved in [pack-gate.txt](pack-gate.txt).

The [invocation provenance](invocation-provenance.md) preserves skill-read evidence
and the inherited-context limitation. [member-checks.txt](member-checks.txt) records
individual validator exit codes and fresh readback comparisons, rather than deriving
those results from grouped shell commands. [additional-checks.txt](additional-checks.txt)
records the audit-driven base guard failure and focused boundary pass. The two
`check-pack.test.ts` runs are targeted fixture tests; neither is the full
`bun scripts/check-pack.ts` gate. No full pack gate had run at the time of audit.

The manifest declares repository read/write access and shell execution for disposable
probe scripts and fixtures; it does not authorize production changes. The explicit
projection commands, their exits and comparison implementation are saved in
[projection-check.py](projection-check.py) and [projection-check.txt](projection-check.txt).
Copy that script to scratch and set `BLAST_RADIUS_SKILL` to the source member path
before running it to reproduce the seven projections.

[skill-read-comparison.md](skill-read-comparison.md) confirms identical operating
instructions between the worker's first read and final source; only compatibility
metadata and attribution-footer wording differ. A projection-script replay against
the old synthetic home hit Soma's symlink-migration refusal (captured in
[projection-reused-home-failure.txt](projection-reused-home-failure.txt)). The saved
script now allocates a fresh disposable home on every run; that version passed.

Claude Sonnet 5.5's [final audit](completion-review-final.md) returned **pass**, with no
material blocker. The [initial audit](completion-review-initial.md) and the final
audit's author dispositions retain the evidence refinements. The probe keeps external
consumers unproven and bounds app reproduction to offline startup/RPC.

Captured text normalizes trailing whitespace and redacts commit-author email fields;
commands, exit statuses and substantive results are retained.
