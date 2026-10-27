# Node 11 verification: `how`

Acceptance runs: a sub-agent followed `skills/how/SKILL.md` as written, in the soma repo,
on the simple path with the disclosed no-nested-spawn fallback (explainer pass run in the
agent's own conversation). Evidence below is a condensed record of each run.

## Real subsystem: "how does `soma graph frontier` compute the frontier"

The run returned Overview, Key Concepts, How It Works (with a mermaid flow), Where Things Live
and Gotchas. Spot-checked citations resolve in soma at `3bff58d`:

- `src/graph/work-graph.ts:1782` is `this.store.readSubtree(root)`, the single subtree read.
- `src/graph/work-graph.ts:1786-1793` is the filter: dedupe, open, no assignee, all blockers closed, split by `writable`.
- `src/cli/graph.ts:967` is the `graph.frontierReport` call in `runFrontier`.
- `src/graph/work-graph-github.ts:381` is `SUBTREE_PAGE_SIZES = [20, 3, 3]`.
- `src/graph/work-graph-gitlab.ts:317` is the GitLab `visit` the run named as the last line it reached.

Where a trace stopped, the run said so under Gotchas: GitLab's `writable` handling was not
traced (last line reached `work-graph-gitlab.ts:317`) and `subtreeSelection` was not opened.

## Nonexistent subsystem: "how does the quantum-sync replication engine work"

The run stated its interpretation, listed what it searched (`quantum`, `quantum-sync`,
`sync engine`, file names, `replicat` in `src/`), reported that nothing by that name exists,
named the nearest real candidates as candidates (`docs/home-replication.md`), and wrote no flow.

## Findings that changed the skill

- The explainer template assumes explorers even on the simple path, and the citation and
  stopped-trace rules were in `SKILL.md` only. `SKILL.md` now tells the simple-path explainer there
  are no explorers and tells the caller to paste the rules into every spawn prompt. The reference
  templates stay verbatim.

## Capability binding

With only `arc-manifest.yaml`, `soma algorithm capabilities --list --soma-home <scratch>` showed
`TraceMechanics [contract] ... ← needs a local binding`: Soma's resolver reads `satisfies` only from
the skill root's `soma-skill.json` (`src/algorithm/algorithm-capabilities.ts:181`). The member now
carries a minimal `soma-skill.json`; the same command then showed `TraceMechanics [skill] observe → how`.
`soma project-skill skills/how --apply` in a scratch home linked the skill into `.claude/skills/how`.
The real-home `soma install claude-code --apply` and `soma doctor` probe is the principal's to run.
