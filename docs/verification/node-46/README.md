# Node #46 verification

Run on the host on 2026-10-28. The port is `skills/interrogate`, from `pstack/skills/interrogate/SKILL.md` at `cursor/plugins` `c742dd6` (full SHA in the member manifest). It depends on `skills/arena` from PR #50.

## What changed from upstream

- Frontmatter: `disable-model-invocation: true` stays, and `triggers` are added. There is no `route:`, since the skill runs only when asked.
- Frame: upstream's `in-your-own-words` skill is not ported. The intent is restated in one or two sentences from the message, commits and PR body, with AskUserQuestion on Claude Code when it is unclear.
- Fan out, adversaries: upstream reads an `interrogate reviewers` line that `setup-pstack` writes into the generated pstack models rule (its example pairs a Claude and a Grok model). Here a roster the principal names wins; otherwise the default is an `opus` sub-agent and a `codex exec` process, two model families. Without `codex`, the second seat is a `fable` sub-agent and the report says the roster lost its second family.
- Fan out, worktrees: "copy the scope's uncommitted changes into each worktree" is five git and rsync commands. The parent creates and names every worktree, for sub-agents too, in place of arena's harness-picked worktree. Per arena Phase B (after `afd3b49`), a candidate in a directory the parent named gets that path, so nothing is copied out with `git archive`: the repros stay where they ran. Each adversary ends its report with its worktree path and the repro files it added. The codex seat runs as `codex exec --sandbox workspace-write --skip-git-repo-check -C /tmp/interrogate-<slug>/adversary-<n>`, the same flags as arena's judge except the sandbox.
- Fan out, agent type: each sub-agent seat is the substrate's general sub-agent (`general-purpose` on Claude Code).
- Verify: before the rerun, the parent checks that the reported worktree is the one it assigned and that `git status --short` there lists the named repro files. A self-contained command needs no file. Then it reruns each command in that worktree. The worktrees stay until the principal says to remove them, and the output lists them.
- One line says how this differs from Soma's `code-review`.
- Principles are cited as `the-algorithm/references/principles/<name>.md`, as arena now does, and a host-only test checks that each one exists in the installed Soma.

The arena phases it cites (A steps 3 and 4, B and F run; C, D and E skipped) are checked against `skills/arena/SKILL.md` by `test/interrogate.test.ts`.

## Live probe

Two real interrogate runs, each on a seeded bug in a throwaway clone of this repository. I ran the skill as the parent, following `SKILL.md` in this session. Each round has its [scope.diff](round-1/scope.diff), the brief as sent, each adversary's report, my Phase F reruns in `rerun.txt`, and the skill's output in `interrogate-output.md`.

- [Round 1](round-1/interrogate-output.md), default roster (`opus` sub-agent and `codex exec`). The change is split across a commit, an unstaged edit and an untracked file, so it tests the worktree commands. Both adversary worktrees had the same `git status --short` as the scope. Both adversaries found the seeded bug (an unanchored regex), and the reruns reproduced it. Nothing was dropped.
- [Round 2](round-2/interrogate-output.md), a named roster of three (`opus`, `haiku`, `codex exec`). The change is fully committed, so it tests the empty-patch path. All three found the seeded bug (only adjacent duplicates are caught), and the reruns reproduced it. The `haiku` seat's second finding, "no test added", was dropped because its own command printed `0 fail` on rerun.

The pre-rerun check was added after both rounds ran. [handoff-check.txt](handoff-check.txt) runs it on the five probe worktrees. The codex and haiku seats left repro files (`.review-repro/`, `repro/`, `repro-duplicates.mjs`). The opus seats ran self-contained commands and left none, which is why the rule allows a self-contained command. The round briefs did not yet ask adversaries to list their repro files, so that report line is untested.

What it does not cover: a Codex or pi parent, a design or plan as scope, and a scope with binary files in the patch.

## Gate

See [pack-check.txt](pack-check.txt) and [bun-test.txt](bun-test.txt).
