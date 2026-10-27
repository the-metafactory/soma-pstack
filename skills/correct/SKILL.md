---
name: correct
description: "Find mistake classes agents keep repeating in a repo and make each impossible: architecture, then types, then a lint naming the fix, then a test, docs last. Prove each check fails on a past mistake; keep a rule-to-enforcer table in AGENTS.md. Use for /correct."
route: "The same agent mistake recurs in a repo, or a correction is given a second time, and a check could make it impossible."
disable-model-invocation: true
triggers:
  - pattern: "/correct"
    type: command
    priority: 100
---

# Correct

The principal keeps correcting agents in this repo for the same mistakes. Change the repo so the next agent cannot make them.

Assume every contributor is an agent that sees only the files it opened, copies the nearest example and takes the shortest path that compiles. Design the repo so a change that looks right from one file is right for the whole repo.

This is the SelfHealing doctrine applied to one repo: a recurring miss becomes structure, not a note.

## Mode: dry-run first

Default to **dry-run**: steps 1 and 2 only, then the **Reply** at the end, in the reply itself (no file), and stop. Dry-run writes nothing anywhere: no edits, commits, comments, or `--write-baseline` flags. Write, commit or open a PR only after the principal says yes to named classes. A yes covers the classes it names, nothing else.

## 1. Find the mistake classes

Read, for the repo and a window (default 90 days, `--since="90 days ago"`). Check counts against `git rev-list --count` so a truncating shell proxy cannot shrink the sample.

- commits: `git log --since=<window>` with bodies, not `--oneline`. Squash merges hide reverts and fixups inside the body, and subjects may be plain sentences without a `fix:` prefix; read for "fix", "regression", "again", "follow-up";
- review feedback on PRs merged in the window: `gh pr list --state merged --search "merged:>=<date>" --limit 200`, then per PR `gh api repos/<o>/<r>/pulls/<n>/comments` (inline), `…/pulls/<n>/reviews` (review bodies) and `…/issues/<n>/comments`;
- agent instruction files that exist (`AGENTS.md`, `CLAUDE.md`, `GLOSSARY.md`, `CONTEXT.md`) and workaround comments: `git grep -nE "workaround|HACK|XXX|do not|don't" -- <src dirs>`;
- Soma's record: `soma errata list`; `soma memory search --query "<repo>"`; the substrate's project memory for this repo (Claude Code: `~/.claude/projects/<slug>/memory/`). `bun run harness-eval` aggregates every run in `~/.soma`, not this repo; read it only as background.

Group mistakes into classes. A class counts once it has happened in two separate incidents (different PRs or days); several commits fixing one incident count once. Each class carries its evidence: at least two commit SHAs, PR comments or memory ids.

## 2. Pick the highest level that works

1. **Eliminate it with architecture.** One owner per piece of state, one supported way per task. Hide internals so the wrong import fails. Replace hand-synced lists with one source of truth. Delete old ways and dead code an agent would copy.
2. **Enforce it with types** so the bad state cannot be written. If bad code still compiles, add a lint or CI check whose error names the file, type or function to use instead. If the pattern is already common, fail only when a change adds more (a ratchet baseline).
3. **Test the behavior.** Fix or delete any test that still passes when the behavior it checks breaks, or fails when only internals change.
4. **Docs or agent rules last**, only for judgment calls. Nothing fails when an agent skips them.

For each class, say why the level above did not work.

## 3. Fix and prove (after the yes)

Fix the most frequent approved classes, one commit each. Prove each new check fails on a real past mistake: check out or re-apply the offending commit and show the check red, then green on the fix. Run the same command locally and in CI. Exceptions go on the offending line with a reason, an expiry date and the principal's approval.

## 4. Keep the rule table

Keep a table in the repo's `AGENTS.md` (create the section if missing) pairing each rule with what enforces it:

| Rule | Enforced by | Proven on |
| --- | --- | --- |
| one sentence | lint rule, type, test file or "docs only" | commit SHA the check fails on |

When the principal corrects you, fix the mistake and add the rule. If the rule was already there and nothing enforces it, that is a repeat: fix it at the highest level in the same change. Drop a rule once its mistake can no longer happen.

**Reply:** each class with its evidence, the level picked, and why a higher level did not work. In dry-run, end with the question which classes to fix.

Source: ported from pstack (MIT, © 2026 Lauren Tan); upstream pin in arc-manifest.yaml.
