# Node 16 verification: explain

## Grep gate

```sh
grep -rilE 'cursor|Task\(|subagent_type|generalPurpose|readonly|pstack-models\.mdc|poteto-mode|unslop|mcps/' skills/explain
```

The only hit is `skills/explain/arc-manifest.yaml`, for the mandated `upstream: {repo: cursor/plugins}` pin. `SKILL.md` has none.
`test/explain.test.ts` runs the same gate with that one string removed.

## Acceptance run

A sub-agent was given only `skills/explain/SKILL.md` and asked to run `/explain node #812's change` (the-metafactory/soma), doing the
`how` and `why` steps inline from their files, with `why` narrowed to git plus the work-graph node.

What the reply did, against the criteria:

- The reply was the explanation itself. The sub-agent's own notes on what it ran came after a `=====` line it was asked to add.
- It opened with what the change was: node #812 moved the `substrates` install and projection code into `src/substrates/` and changed nothing else. It then said what `substrates` is.
- It cited `how` findings (`src/components.ts`, `src/substrates/index.ts`, `scripts/check-boundaries.ts`, `test/boundaries.test.ts`) and `why` findings (soma#610 decisions, PR #980, the Sage round, #800's ruling), with a separate "Inferred, not stated" paragraph.
- It ended with threads to chase with `how` and `why`.

Gaps the run showed, not fixed because the text is upstream's:

- The lead sentence states the change, not a general definition of the thing.
- The sub-agent did not run `humanizer` or `art`; it applied the style by hand and drew two mermaid diagrams.
- It did not itemise which `why` categories it skipped, because the reply must be only the explanation.

## Not run here

The live probe (`soma install claude-code --apply`, then `~/.claude/skills/explain/` exists and `soma doctor` is ok) needs the pack
installed from a pushed branch, and it rewrites the principal's home. It was not run. `~/.claude/skills/teach` is a symlink to
`~/.soma/skills/teach`, which this change does not touch.
