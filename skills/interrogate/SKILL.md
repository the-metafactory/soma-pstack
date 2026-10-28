---
name: interrogate
description: "Use for /interrogate, \"interrogate\", \"adversarial review\", \"multi-model review\", \"challenge this\", \"stress test this code\", \"find blind spots\", or \"tear this apart\". Adversaries try to break a change or design, and only findings proven by a run survive."
disable-model-invocation: true
triggers:
  - pattern: "/interrogate"
    type: command
    priority: 100
  - pattern: "interrogate this"
    type: keyword
    priority: 60
  - pattern: "adversarial review"
    type: keyword
    priority: 60
  - pattern: "tear this apart"
    type: keyword
    priority: 60
---

# Interrogate

Adversaries try to break a change or a design. A finding survives only when a run proves it. Report the findings. Do not apply fixes.

Soma's `code-review` reads a pull request through fixed lenses and reports what it sees; interrogate reports only breaks that a rerun reproduces against the real code.

## Frame

The scope is what the principal names. Otherwise it is the branch diff from its merge base with the base branch, through the working tree. Restate the intent in one or two sentences: what the principal wants and what the change is meant to do, taken from the principal's message, the commits and the PR description. When those leave the intent unclear, ask the principal before fanning out (on Claude Code, with AskUserQuestion).

## Fan out

Run arena Phase A (Frame) steps 3 and 4 and arena Phase B (Fan out), with four changes.

1. Pick adversaries where arena picks runners. A roster the principal names in the request is the roster. Otherwise run two adversaries from different model families, since the point is that they find different failures: a general-purpose sub-agent on model `opus`, and a `codex exec --sandbox workspace-write --skip-git-repo-check -C /tmp/interrogate-<slug>/adversary-<n>` process, which runs codex in its worktree on its configured default model. If `codex` is missing or fails to start, replace that seat with a sub-agent on `fable` and say the roster lost its second family. Arena's rules for a rejected model and for fewer than two seats apply.
2. Label the adversaries `adversary-1` to `adversary-N` in spawn order, and give each its own worktree with the scope's uncommitted changes in it, per the **separate-before-serializing-shared-state** principle (`the-algorithm/references/principles/separate-before-serializing-shared-state.md` in the Soma skills directory). This is in place of the harness-picked worktree in arena's step 4, so the uncommitted changes are in place before the adversary starts. From the scope's repository root, for adversary `<n>`:

   ```sh
   mkdir -p /tmp/interrogate-<slug>
   git diff --binary HEAD > /tmp/interrogate-<slug>/uncommitted.patch
   git worktree add --detach /tmp/interrogate-<slug>/adversary-<n> HEAD
   git -C /tmp/interrogate-<slug>/adversary-<n> apply --allow-empty /tmp/interrogate-<slug>/uncommitted.patch
   git ls-files --others --exclude-standard -z | rsync -a --from0 --files-from=- ./ /tmp/interrogate-<slug>/adversary-<n>/
   ```

   The patch carries staged and unstaged edits to tracked files; the `rsync` line carries untracked files. Run `git -C /tmp/interrogate-<slug>/adversary-<n> status --short` and compare it with the scope's own `git status --short` before you spawn. When the scope's checks need installed dependencies, install them in each worktree or link the scope's own (`node_modules` for a Bun project) first. Create these worktrees yourself, for sub-agents too, so every adversary starts from the same tree. Each worktree is a directory you named, so per arena Phase B (Fan out) the adversary gets that path and nothing is copied out: its repros stay where it ran them.
3. Spawn each sub-agent seat as the substrate's general sub-agent (on Claude Code, the Agent tool's `general-purpose` type with the seat's `model`), and point it at its worktree path.
4. In place of the arena task and rationale, give each adversary the scope, the intent, its worktree path, and the brief below. Each adversary ends its report with its worktree path and the repro files it added, as `git status --short` lines, or says it added none.

> Break this change. Prove each finding with a run against the real code, such as a failing test, a repro script, or command output that shows the wrong behavior. For a design or plan, run a prototype or probe the current tree. Keep repros in your own worktree. Report each finding with a title, the exact command, the output it printed, and the output the intent requires. Leave out anything you did not run. That covers style, naming, structure, and risks that need a future change to matter. No findings is a valid result.

## Verify

Verify each finding per arena Phase F (Verify) and the **verify-before-claiming** principle (`the-algorithm/references/principles/verify-before-claiming.md`) by rerunning its command yourself, in the worktree of the adversary that reported it. First check that the reported worktree is the path you assigned and that `git -C /tmp/interrogate-<slug>/adversary-<n> status --short` lists the repro files it named. A command that is self-contained needs no file. A finding whose command needs a file that is missing there cannot be rerun and is dropped. Keep a finding when the output shows the failure and the failure breaks the intent. Drop the rest. Merge findings that share a root cause.

Skip arena Phase C (Cross-judge), arena Phase D (Pick a base) and arena Phase E (Graft). Adversaries find different failures, so the verdict keeps every verified finding, not one adversary's list.

Leave the worktrees in place and name their paths in the report, since they hold the repros. Remove them only when the principal says so.

## Output

- Intent: the restatement.
- Findings: for each verified finding, the command, its output from your rerun, how it breaks the intent, and the adversaries that found it. Say "no verified findings" when none survive.
- Dropped: for each adversary, the count of dropped findings and why.
- Worktrees: the path of each adversary's worktree.

Source: ported from pstack `pstack/skills/interrogate/SKILL.md` at commit c742dd61706fbacc1b95f1a20b7b988cf096ce6c (MIT, © 2026 Lauren Tan). Changed: triggers added; the intent is restated inline instead of through an unported skill; adversaries come from the principal's roster or a two-family Soma default instead of the pstack models rule's `interrogate reviewers` line; copying uncommitted changes into each worktree is spelled out as git commands; each sub-agent seat is the substrate's general sub-agent rather than a host-specific agent type; the adversary hand-off is arena Phase B's rule for a directory the parent named, plus a report of the repro files; the verify step says who reruns, where, and what is checked first; the `code-review` line, the Worktrees output and the cleanup rule are added. Arena phases are cited by letter and name.
