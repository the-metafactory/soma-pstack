Brief as sent; WORKTREE was /tmp/interrogate-hex40/adversary-1 (opus sub-agent) or /tmp/interrogate-hex40/adversary-2 (codex).

Scope: the branch `scratch/shared-hex40` from its merge base 48eb39e through the working tree. That is one commit (README note) plus uncommitted changes: `scripts/check-pack.ts` (modified) and `scripts/patterns.ts` (new, untracked). See them with `git diff 48eb39e` and `cat scripts/patterns.ts`.

Intent: move the 40-hex upstream-commit check in `scripts/check-pack.ts` into a shared pattern in `scripts/patterns.ts`, with the pack checker's behaviour unchanged: `upstream.commit` must still be exactly a 40-character hex SHA.

Worktree: WORKTREE (yours alone; `node_modules` is linked in; run `bun test` and `bun scripts/check-pack.ts` there).

Break this change. Prove each finding with a run against the real code, such as a failing test, a repro script, or command output that shows the wrong behavior. For a design or plan, run a prototype or probe the current tree. Keep repros in your own worktree. Report each finding with a title, the exact command, the output it printed, and the output the intent requires. Leave out anything you did not run. That covers style, naming, structure, and risks that need a future change to matter. No findings is a valid result.
