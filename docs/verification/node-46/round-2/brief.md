Brief as sent; WORKTREE was /tmp/interrogate-dup-artifacts/adversary-<n>: 1 opus sub-agent, 2 haiku sub-agent, 3 codex.

Scope: the branch `scratch/duplicate-artifacts` from its merge base 48eb39e through the working tree: one commit changing `scripts/check-pack.ts` (see `git diff 48eb39e`). No uncommitted changes.

Intent: `bun scripts/check-pack.ts` must fail, naming the path, whenever the root `arc-manifest.yaml` lists the same member path more than once in `artifacts`. Everything else the checker does stays as it was.

Worktree: WORKTREE (yours alone; `node_modules` is linked in; run `bun test` and `bun scripts/check-pack.ts` there).

Break this change. Prove each finding with a run against the real code, such as a failing test, a repro script, or command output that shows the wrong behavior. For a design or plan, run a prototype or probe the current tree. Keep repros in your own worktree. Report each finding with a title, the exact command, the output it printed, and the output the intent requires. Leave out anything you did not run. That covers style, naming, structure, and risks that need a future change to matter. No findings is a valid result.
