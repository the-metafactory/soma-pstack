---
name: worktree-audit
description: "Read-only audit of a repo's git worktrees for the Cleanup playbook card: size, age, merge state, uncommitted work, remote and PR state, and the newest Claude Code session that touched each one, with a suggested bucket. Never fetches, writes or deletes."
disable-model-invocation: true
---

# Worktree audit

Run it from the Cleanup card, once per repo:

```sh
bun <skills>/worktree-audit/scripts/worktree-audit.ts [-b <base-ref>] [repo-path]
```

It prints one tab-separated row per worktree except the main one, largest first.

| Column | Meaning |
| --- | --- |
| `MERGED` | `YES` when HEAD is an ancestor of the base ref. A squash merge reads `no`; the `PR` column catches it. |
| `DIRTY` | `clean`, `wip:N` for N tracked edits, or `scratch:N` for N untracked files only. |
| `REMOTE` | `pushed`, `aheadN`, `behindN`, `diverged+A-B`, `no-remote` or `detached`. |
| `PR` | `#N/state` for the principal's PR from that branch, through `gh`. |
| `LAST_SESSION` | The day of the newest transcript that names the worktree path, from the session directories under `~/.claude/projects` named after the repo or any of its worktrees. |
| `BUCKET` | `hold-wip`, `hold-open-pr`, `verify-recent-session` (a session within four days), `safe` or `review`. `safe` needs the work landed with nothing on top: HEAD an ancestor of the base, or HEAD within a merged PR's head commit, which still holds after GitHub deletes the remote branch. A closed, unmerged PR, an `ahead` or `diverged` branch, or commits after a merge read `review`. Without `gh` the PR column is empty and only the base check counts. |

The bucket is advice. The Cleanup card decides, and the principal approves every removal.

The base ref is read as it is locally; run `git fetch` first when it may be stale. `SOMA_AUDIT_SESSIONS_DIR` points the session scan at another directory.
