---
name: automate-me
description: "Turn the principal's working style into proposed edits to their Soma home: the communication contract, the behavior policy, local principles and memory notes. Mines this workspace's transcripts, asks a few questions, and applies nothing without approval. Use for /automate-me, \"automate me\", \"capture how I work\", \"refresh my working style\"."
disable-model-invocation: true
triggers:
  - pattern: "/automate-me"
    type: command
    priority: 100
---

# Automate me

Turn the principal's working conventions into rules agents will follow. In Soma the working style is not one `<handle>-mode` skill. It lives in the Soma home (`SOMA_HOME`, otherwise `~/.soma`), on four surfaces:

| Surface | File in the Soma home | What belongs there |
| --- | --- | --- |
| Communication contract | `profile/communication.md` | How the assistant talks: patterns, banned phrases, aliases, and `Do` / `Do not` example pairs |
| Behavior policy | `policy/behavior.md` | Operational boundaries: autonomy, permissions, scope, verification, working habits |
| Local principles | `skills/the-algorithm/references/principles.local.md`, each row pointing at a file in `principles-local/` | An engineering heuristic that changes a decision; the row format is in the Principles section of the working method |
| Memory note | written by `soma memory write` | A narrow convention with a recall condition: one tool, one repo, one recurring request |

All four are principal-trust surfaces. This skill writes proposals. It applies a proposal only after the principal approves that row. Invoking `/automate-me` is not approval.

## 1. Check what is already there

Read the four surfaces in full before mining, so you can tell a new rule from one that already exists. When the Soma home is a git repository and the principal asked to refresh rather than start over, run `git -C <soma-home> log -1 --format=%cI -- profile/communication.md policy/behavior.md skills/the-algorithm/references/principles.local.md` and mine only history newer than that date. Step 2 then asks what changed or is missing, not what to capture from zero.

## 2. Mine this workspace's history

Mine only the active workspace: the directory the session runs in. Never glob across projects; that reads private chats from unrelated work. A worktree of the same repo is a separate workspace and stays out unless the principal names it.

| Substrate | Store for workspace `<cwd>` |
| --- | --- |
| Claude Code | `~/.claude/projects/<slug>/*.jsonl`, where `<slug>` is `<cwd>` with every `/` and `.` replaced by `-`. Skip the `subagents/` directories. |
| Codex | `~/.codex/sessions/YYYY/MM/DD/*.jsonl` is not split by workspace. Read only the first line of each file and keep the files whose `session_meta` `payload.cwd` equals `<cwd>`. |
| pi | `~/.pi/agent/sessions/--<path>--/`, where `<path>` is `<cwd>` without its leading `/` and with every `/` replaced by `-`. |
| Cursor | `~/.cursor/projects/<path>/agent-transcripts/`, with `<path>` formed as for pi but without the `--` fences. |

On any other substrate, say that transcript mining is unsupported there and continue with step 3 alone.

Keep only turns the principal wrote. Drop tool results, notifications, teammate and subagent messages, system reminders, shell output and compaction summaries. A terse turn ("yes", "O1") means only what the agent asked just before it, so a miner reads that context in the source file.

Split the history into three time slices with enough material each, and give each slice to its own subagent, in parallel where the substrate supports it. Pick a cheaper model for this; it is reading and pattern matching. Each miner reads only its slice and returns at most eight patterns, each with how many turns support it and pointers as `<file>:<line>` or a message id. Miners paraphrase. They quote no more than a few words and copy no paths, hosts, tokens or other secrets. Signals to hunt:

- Response preferences: length, tone, format, "say it simpler" corrections.
- Delegation: subagents, models, parallelism, standing procedures.
- Verification: what done means, which reviewers, live checks.
- Prose and code discipline: style, principles cited, lint tools.
- Process: worktrees, commits, PRs, review, merge, release and install steps.
- Meta: fixing skills mid-task, filing follow-up work, proposing new skills.
- Corrections the principal gave an agent, with what was corrected.

Check two or three pointers per miner against the source before you use its report.

## 3. Ask the principal

Mining misses intent that has not come up yet. Ask with the substrate's structured question tool (`AskUserQuestion` on Claude Code); without one, ask the same thing as one short numbered list in chat. Ask one or two multiple-choice questions with four to six options each, allowing several answers for the area question. Start broad ("Which areas matter most?"), then follow up on the areas picked. End with one free-form question for anything the options missed. Ask a few questions, not twenty. In a headless run, put the questions in the proposal and leave them unanswered.

## 4. Cluster and route

A signal seen in two or more slices, or confirmed by the principal in step 3, is a candidate. A lone signal is usually dropped; list it under `Lone signals` so the principal can promote it. For each candidate, decide in this order:

1. An existing rule already covers it and agents followed it: drop it as covered, and name the rule.
2. An existing rule covers it but agents missed it: that is an execution miss, not a new rule. Propose a sharper wording or an example pair at that rule, not a second rule.
3. A lint, test, hook or schema could enforce it: propose it as a structural backlog item, per Soma's encode-lessons-in-structure principle, not as prose.
4. Otherwise route it to the surface in the table above whose "What belongs there" column fits.

A task-specific workflow is a skill, not working style. Route it to the playbooks `authoring-a-skill` card and the `writing-for-agents` skill instead.

## 5. Write the proposal

Write one proposal file in the work directory (the Algorithm run's directory, or a scratch directory), never inside the Soma home. Give it:

- Scope: the substrate, the store path, the window, the slice boundaries and the number of turns mined.
- A table of every candidate, with a stable code (`A1`, `A2`, …), the slices it appeared in, its pointers, the decision from step 4 and the target surface.
- For each proposed file edit, a unified diff against the current file in the Soma home source, never against a projection under `~/.claude/rules/soma/` or another substrate's copy.
- For each proposed memory note, the exact `soma memory write --trigger principal-correction --principal-authority …` command with its `--id`, `--type`, `--body` and `--recall-trigger`. Do not run it.
- The step 3 questions and answers, and the lone signals.

Write the rule text in the voice of the target surface. Run it through the `humanizer` skill and the communication contract, and keep each rule operational: "Short paragraphs. Tables when comparing options." is a rule; "communicate clearly" is not.

## 6. Present and wait

Show the principal each row with its diff or command. Take feedback and revise; expect more than one round. The principal may approve a subset. Apply only approved rows:

- Edit the Soma home source files with the approved hunks.
- Run each approved `soma memory write` command.
- Re-project with `soma install <substrate> --apply` for each installed substrate, then read one projected copy to confirm the edit landed.

Commit or push the Soma home only when the principal asks. Report what was applied, what is still pending and what was dropped, with the reason for each.

## Guardrails

- Do not overfit to one conversation. A preference stated once and contradicted another time is noise.
- Reference, do not inline. Point at the skill or doc the principal relies on by path instead of pasting it.
- Add a rule only where the principal has a specific, non-default rule. Skip a surface that has nothing new.
- Write imperatives about "the principal", not their name.
- Do not restate what another surface already says; each rule lives in one place.

## When not to use

- The principal wants a task-specific skill: use the `authoring-a-skill` card and `writing-for-agents`, with no mining.
- The principal wants one narrow workflow captured, such as how they write commit messages: that is a regular skill or one memory note.
- The principal wants a finished session reviewed for skill fixes: that is `reflect`.

Source: ported from pstack `pstack/skills/automate-me/SKILL.md` at commit c742dd61706fbacc1b95f1a20b7b988cf096ce6c (MIT, © 2026 Lauren Tan); changed: the `-mode` skill output is replaced by approval-gated proposals to the four Soma home surfaces, mining is scoped per substrate store, the authoring and prose skills are replaced by `authoring-a-skill`, `writing-for-agents` and `humanizer`, and the land step re-projects instead of opening a PR.
