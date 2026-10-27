---
name: recall
description: "Rebuild recent working context on a topic from Algorithm runs, Soma memory, session transcripts and live git/gh state into a tight brief: capsule, tagged threads, problems, one next move. Use for recall my work on X, where did I leave off, pick up where we left off, resume, previous sessions, what did we do."
triggers:
  - pattern: "/recall"
    type: command
    priority: 100
  - pattern: "pick up where we left off"
    type: keyword
    priority: 60
  - pattern: "where did I leave off"
    type: keyword
    priority: 60
  - pattern: "resume"
    type: keyword
    priority: 40
  - pattern: "previous sessions"
    type: keyword
    priority: 40
  - pattern: "what did we do"
    type: keyword
    priority: 40
---

# Recall

**Before you start or resume work, rebuild the principal's recent working context and hand back a tight capsule of where things stand and what to do next.**

Keep it tight and on-topic. Read only what the in-scope threads need, then stop.

Context lives in two records. Your own record holds what you did and decided: Algorithm runs, Soma memory, session transcripts. The shared record holds what happened around the same code under other names: issues users keep reporting, fixes that shipped and were reverted, graph nodes, review comments. A feature with a long bug tail keeps most of its story in the shared record, so do not rebuild it from your own record alone.

## Steps

1. **Classify, then route.** One specific prior session to resume is the `session-pickup` playbook card or a `handoff` document, not this. "What changed since my last message" is the `cup` alias. Turning a habit into a durable skill is `skill-manage`. Recall loads working context across recent sessions before you act. If the principal already gave a full state capsule (paths, branch, the change), use it and skip the mining.
2. **Lock the scope before searching.** Pin the window (default the last 7 days), the topic if named, and the workspace (default the active project; never read another project's transcripts unless asked). Name every repo the topic touches: skill and doctrine work also lives in `~/.soma`. State the scope back. Never quietly turn "all" into "recent N".
3. **Mine your own record.** Sources, in this order:
   - `soma algorithm list` (unfiltered; pick matches by title) then `soma algorithm show --id <run-id>` for runs matching the topic: goal, checkpoints, decisions, verification, learnings.
   - `soma memory search --query "<topic>"` for promoted learnings and knowledge.
   - Session transcripts of the active project. Claude Code keeps them as `~/.claude/projects/<slug>/<session-id>.jsonl`, where `<slug>` is the project path with every `/` turned into `-` (so `/home/you/proj` is `-home-you-proj`); each line is one message. Other substrates: use their session store, or skip and say so. Order candidates by modification time (`ls -t`), never by file name. Grep the topic first, then read only the matching sessions and only their relevant regions. Skip the current session and obvious noise (sub-agent, eval and test sessions). A topic named in the projected rules (`POLICY.md`, `MEMORY.md`) matches every session that loaded them; count only hits outside the injected context.
   For more than two transcripts, fan out: one sub-agent per slice on a cheap, fast model. Each returns one block per session: topic, the principal's goal, decisions, open threads, struggles and corrections, artifacts (PRs, issues, branches, graph nodes), each citing the session id. Raw transcripts stay in the sub-agents; the main thread gets only their findings.
4. **Sweep the shared record** whenever the topic names a feature, file, subsystem, area or bug. This is the default; "my work on X" does not exempt it. Ask "what is the current state, what has been tried and did not hold, what are users still reporting". Sweep these sources:
   - **Git and `gh`:** `gh issue list --search "<topic>"` and `gh pr list --state all --search "<topic>"` in the repos involved; `git log --oneline --since=<window>` with `-- <paths>` or `--grep=<topic>`, and reverts (`git log --grep=Revert`), in each named repo.
   - **Work graph:** `soma graph frontier <map>` and `soma graph decisions <map>` if the topic has a map.
   - **Chat, long-form docs, error tracking:** these use the `why` skill's source playbooks, which sit in the `why` skill's `references/sources/` directory beside this skill's directory. Read the playbook and run its commands read-only; do not restate its commands here. Chat is `chat.md` (Discord). Long-form docs is `long-form-docs.md` (the repository's `docs/`, ADRs and GLOSSARY, plus Confluence for SWITCH work). Error tracking is `observability.md`, which has no source: it is always unreachable, and the brief says so. Take the playbooks' time window from step 2, and read a channel, thread or page only as far as the topic needs. If the `why` skill is not installed, chat and docs are unreachable for that reason; say so and do not write substitute commands.
   Run the sweep in parallel with step 3. Null results are findings. A source that is missing, unauthenticated or unreachable is skipped, not retried in a loop, and recorded with the command and its error. Skip this step only for pure activity recall with no named target ("what did I do this week"); the Sources line then says `not reached: no named target`.
5. **Verify against live state.** Check every PR, branch, issue and node the mining surfaced with `git`, `gh` and `soma graph node`. Recall writes nothing; `git fetch` is the one allowed exception. When the answer hinges on what an agent actually did (tools run, files read, errors hit), read the full transcript, not a summary.
6. **Write the brief** to the contract below. Group by thread. Stay on the named topic.

## Output contract

Capsule, then threads, then problems, then next move, then sources. Deeper detail goes below or is cut.

- **Capsule.** At most 5 bullets: what this work is and where it stands overall.
- **Threads.** One line each, prefixed with exactly one status tag: `[merged #N]`, `[open PR #N]`, `[in flight <branch>]`, `[committed, unpushed <branch>]`, `[verified, uncommitted]`, `[reverted #N]`, `[planned, not started]`. Tag every thread; an untagged thread is not done.
- **Problems.** At most 5, the recurring ones. Include symptoms users keep reporting and any fix that shipped and was reverted, so the next attempt starts where the last one failed.
- **Next move.** The single most useful next action, concrete.
- **Sources.** Last, one line per source: your own record (Algorithm runs, Soma memory, transcripts), git and `gh`, the work graph, chat, long-form docs and error tracking. Each line says `swept` with what was searched and what it found (a null result is a finding), or `not reached` with the reason: the command and its error, "not installed", "not SWITCH work", or "no source in this pack". Never leave a source off the list.

An adjacent feature or ticket stays out unless it blocks this one. When capsule and threads outgrow a screen, cut detail before cutting threads. Cite own-record findings by run id or session id and shared-record findings by source (PR #, issue, node, commit, Discord channel or thread, Confluence page). Follow the communication contract. Before the brief leaves the session (an issue, a PR, a doc), run the `humanizer` skill and strip private context.

**Reply:** the brief, to the contract above, in the reply itself. Write it to a file only when the principal names one.

Source: ported from pstack (MIT, © 2026 Lauren Tan); upstream pin in arc-manifest.yaml.
