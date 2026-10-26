# Node #8 verification

The pack's no-comments workflow restores independent per-slice review,
investigation before deciding on emphatic comments, and architect sketches
before implementing new shapes. The upstream pin remains
`cursor/plugins@99743e9c151c8537cbbf1f98bb38f34ef3368453`,
`pstack/skills/no-comments/SKILL.md` (upstream steps 1–3).

## Live slice

This is a synthetic scratch fixture, not a production-code claim. The worker's
assigned worktree stayed on its existing node branch. The separate temporary
repository used branch `scratch/no-comments-node-8`; its location is recorded
in `scratch-path.txt`.

Scope: `messages.js`. Two comments: original line 2 is **encode**, checked by
the independent investigator before removal; original line 5 is **meat**.
There are zero reshapes and zero keeps. No architect invocation was needed.
`how-check.md` records the symbol trace and the existing tests that enforce
array separation. The mutation replacing `messages.slice()` with `messages`
fails both tests. `slice.diff` contains only the two comment deletions and a
suppression entry pruned from 2 to zero. The final source is otherwise unchanged.

`probe-transcript.jsonl` contains actual commands, outputs, exit codes, the
mutation failure, and the removal decision. Initial tool failures are retained:
Bun's dependency resolution intermittently could not write its temp directory,
and ESLint's stylish formatter failed in `chalk.underline`. The fixture then
used Node to run the already installed ESLint/TypeScript CLIs and ESLint's JSON
formatter. Bun continued to run the tests. No host configuration was changed.
`fixture-package.json` records the final tooling commands; `before-package.json`
records the earlier commands.

The first inventory attempts failed before producing diagnostics; an exit code
of 1 was prematurely counted as lint evidence. Independent review caught this.
The reviewer and worker then replayed the original source read-only through
ESLint stdin and confirmed both hits without suppressions. The log correction
preserves this ordering rather than presenting the initial attempts as success.

The final slice passes suppression pruning, lint, two tests, typechecking and
lint with the baseline ignored. The reviewer checks the final diff separately;
its identity, verdict and findings are recorded in `reviewer.md`.

To repeat the fixture checks in a fresh directory, copy `before-messages.js`
as `messages.js`, `before-messages.test.js` as `messages.test.js`,
`before-eslint.config.mjs` as `eslint.config.mjs`, `before-tsconfig.json` as
`tsconfig.json`, `fixture-package.json` as `package.json`, and the before
suppression file as `eslint-suppressions.json`. The package script paths point
to the host's installed CLIs; replace those paths if running elsewhere.
Use `bun run lint --suppressions-location <empty-JSON-file>` to expose the two
hits. After an independent investigation, replace the source with
`after-messages.js`, then run:

```sh
bun run lint --prune-suppressions
bun run lint
bun run test
bun run check-types
```

This replays the deterministic checks; it does not replay or fabricate the
independent agent's investigation or reviewer verdict.

Coverage boundary: the fixture uses a custom ESLint `slice/no-comments` rule,
not the production `ranger/no-comments` rule. Its tests were authored as part of
the fixture before the removal task. The investigator fallback and independent
slice reviewer were actually invoked. Architect routing was described in the
reviewer's written empty-catch scenario; no architect reshape, keep path, or missing
reviewer path was executed. These are workflow probes, not proof of every
project-specific lint command or every substrate.

## Skill validation

`validation.jsonl` records frontmatter validation and actual
`soma project-skill --substrate codex --apply` into isolated temporary Soma and
substrate homes, followed by byte-for-byte comparison and reading the projected
skill. A synthetic profile was used, leaving the live home untouched. The
global CLI wrapper could not run with a nonexistent temporary runtime; invoking
the installed runtime's repo-local CLI and supplying the fixture profile made
projection succeed. This is a Codex projection probe only.

The pack gate result is recorded in `validation.jsonl` before the final commit.

## Supervisor action: member-list status

Read-only inspection on 2026-10-27 confirmed that
[soma#1068](https://github.com/the-metafactory/soma/issues/1068) still groups
`no-comments` with the skills described as ported under #923.

Required correction: remove `no-comments` from that ported group and list it
separately as **adaptation incomplete; reviewer, how/why and architect safeguards
tracked by [pack node #8](https://github.com/the-metafactory/soma-pstack/issues/8)**
until this change lands. Other members and settled decisions need no changes.

This external acceptance item is **pending**, not verified or completed here.
The worker SOP forbids editing graph nodes and forbids GitHub writes. This
document is a concrete handoff to the supervisor/principal; it is not an edit
to the issue or the map. The code/skill work has no dependency on that status
edit, so the worker can deliver the implementation for review without claiming
the external correction happened.

Sequence the status correction before landing this change; after merge,
`no-comments` can return to the ported group with the restored safeguards.
The supervisor must use the supported graph workflow for the completed
decision node and preserve its completion receipt; this handoff does not
authorize a raw body edit that invalidates its gate metadata. A comment alone
does not satisfy the requested member-list correction. Re-read the live node
before acting. The captured issue read is in `soma-1068-read.json` and its
timestamp/command in `validation.jsonl`.
