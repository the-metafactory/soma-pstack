# Node #44 verification

Verified on the host on 2026-10-28. The port is `skills/maintain-verification-skill`, from `pstack/skills/maintain-verification-skill/SKILL.md` at `cursor/plugins` `c742dd6` (full SHA in the member manifest).

## What changed from upstream

- Frontmatter: `triggers` for `/maintain-verification-skill` and the added keyword "audit the verify skill". There is no `route:` line: Soma lists a routed member in the always-loaded Triggers table with "read that SKILL.md in full and follow it", which would start a five-subagent wave and a live pass unasked. `disable-model-invocation: true` stays, as in upstream and in `create-verification-skill`, so the pass starts only when the principal asks.
- Step 0 keeps upstream's criterion (launch and drive sections and a feature map), and looks first where `create-verification-skill` writes (`<repo>/.claude/skills/verify-<app>/` or `<repo>/.agents/skills/verify-<app>/`, map at `features/README.md`), then in any other project skill directory the repo has, instead of upstream's `.cursor/skills/verify-*/`.
- Step 1 creates the run's branch in a worktree under `/tmp/maintain-verification-skill/` before the first edit. Steps 1 to 5 run there, so no edit lands in the principal's checkout and the live pass drives the worktree's copy.
- Step 2 keeps one read-only subagent per feature and adds a fallback for a substrate that cannot spawn one.
- Step 4 drives through the target skill's own Launch, Doctor, Drive, Evidence and Cleanup sections. The pinned upstream text has no `/drive` command to map.
- Step 4 adds the `gated` verdict: the target skill's own hard rules (for example verify-ranger's "never click Approve") win over "exercise every feature", and a gated feature cites its rule and counts as a live verdict, distinct from `verified-unreachable`.
- Step 6 pushes only under the principal's approval or a covering grant and follows the playbooks member's `opening-a-pr` card. Without approval the branch stays local and the outcome is still `changed`, as the outcome definition says. A `clean` run removes its worktree and branch.
- Added: an unattended run's `show-me-your-work` decision trail.
- The outcomes (`clean`, `changed`, `blocked`), the edit scope and the three live-pass invariants are upstream's, reworded without em dashes.

## Probe

The target is `verify-ranger` in `~/work/mf/ranger`, on `main` at `492581f8f4ccab86813bc15edd4ef1fd958318be` with a clean tree. Only steps 0 to 3 ran, all read-only. The live pass (step 4) did not run, so this probe does not show any feature working or failing live, and the run's outcome would be `blocked` on coverage. No file in the ranger repo was changed, and no branch or PR was made there.

- [locate.txt](locate.txt), step 0: the commands and output. The repo has one candidate, `.claude/skills/verify-ranger/`, with all five sections and a `features/README.md`. There is no `.agents/skills/`.
- [index-hygiene.txt](index-hygiene.txt), step 1: the five indexed entries match the five sibling files, with no missing, extra, duplicate or dead entry. Each file has the four H2s of the entry contract.
- [source-wave/](source-wave/), step 2: one read-only `Explore` subagent per feature file, five in parallel, each with the four-part return shape. The files are lightly condensed from the reports, and paths are relative to the ranger checkout.

### Reconcile (step 3)

I spot-checked one cited drift per feature at its citation, with `sed -n` on the cited lines. All five held:

| Feature | Drift | Confirmed at |
| --- | --- | --- |
| journal | The field is `workerLog`, not `log`, and it points under the journal's directory, not `~/.config/ranger/logs/` | `src/cli.ts:611`, `src/worker-log.ts:8` |
| jobs | `#current` lists workers only, so a running job never appears there | `src/serve.ts:532`, `:1154-1156` |
| approve-node | A non-approvable node gets a different 409 text from a stale version | `src/serve-approve.ts:16-17` |
| scout | There is no "walk" route group | `src/route.ts:118-126` |
| dashboard-overview | `#needsyou` can hold an "unchecked" notice and then omits the empty line | `src/serve.ts:1407-1413` |

The churn sweep (`git log 312d4f1..HEAD -- src/`, from the commit that added the map) shows nine commits. The `bus-run`, `bus-retry` and `bus-status` subcommands of the `remote-test` group (`ranger remote-test bus-run` and so on, `src/cli.ts:724-750`, changed in `9b6943d`) are neither mapped nor named in the skill's exclusions. Whether they are a user surface this map should cover is the principal's call, so they are reported here and not called missing.

The run would end in triage: all five drifts are doc drift in the map, and none is a product gap. A real run would fix them in one branch of the ranger repo after the live pass. That branch was not made.

## Gate

`bun scripts/check-pack.ts` output: see [pack-check.txt](pack-check.txt). `test/maintain-verification-skill.test.ts` checks the member's structure, its contract with `create-verification-skill` and the playbooks card, and the shape of this probe.
