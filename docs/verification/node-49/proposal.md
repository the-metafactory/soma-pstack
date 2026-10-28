# automate-me proposal: soma-pstack workspace, 2026-10-28

Status: proposed, nothing applied. Every row waits for the principal's approval.

## Scope

- Substrate: Claude Code. Store: the workspace's own project directory (`<workspace slug>`), six top-level session files, `subagents/` skipped.
- Window: all history, 2026-10-26T09:04Z to 2026-10-28T13:27Z (first pass; no earlier automate-me refresh to start from).
- Turns kept: 25 principal-authored turns, up to 2026-10-28T13:27:29Z. Dropped: tool results, task notifications, teammate messages, system reminders, shell input and output, compaction summaries, `isMeta` rows, slash-command markup and ranger resume prompts.
- Slices: 1 = 9 turns (10-26 09:07 to 10-27 13:23), 2 = 9 turns (10-27 13:28 to 10-27 20:46), 3 = 7 turns (10-27 20:54 to 10-28 13:27). The extractor sorts by timestamp and cuts by count, so slice 1 and slice 2 share session `2aeb5492`, and slice 2 and slice 3 share `9f8f168b`.
- Correction: the first extraction kept 29 turns, 4 of which the principal did not type (three ranger resume prompts and one `/clear` command row). The miners read those 29. No candidate cites one of the 4, and re-slicing the 25 leaves every candidate in the same slices, so the routing below stands.
- Miners: three parallel Sonnet subagents, one per slice, read-only. Five pointers were checked against the source (51d8207c:473, 2aeb5492:1157, 2aeb5492:2530, 2aeb5492:230, 9f8f168b:771); all five match the miners' paraphrase.

## Candidates

| Code | Signal | Slices | Pointers | Decision | Surface |
| --- | --- | --- | --- | --- | --- |
| W1 | One instruction ("push, PR, Sage review, merge") grants the whole ship chain, and the chain continues past the merge: release or version bump, then a local install. | 1, 2, 3 | 51d8207c:473, 2aeb5492:1157, 2aeb5492:2530, 2aeb5492:2625, 9f8f168b:771, 9f8f168b:2730 | New. The playbooks `shipping` card covers push to merge but stops there; the release and install step is the principal's own convention. | Memory note |
| W2 | Answers agent questions with reference codes, in bulk, overriding or deferring some codes in the same reply. | 1, 2, 3 | c2a85102:103, 2aeb5492:279, 9f8f168b:771, 9f8f168b:2502, 02a23a26:175 | Covered by the communication contract's Reference codes section, and agents followed it. Drop. | none |
| W3 | Opens with a status or how-does-it-work question and expects a probed answer before any change. | 1, 2, 3 | 51d8207c:1282, 51d8207c:1365, 2aeb5492:7, 9f8f168b:7, 02a23a26:8 | Covered by the behavior policy's Verification section ("Confidence requires source"). No miss observed. Drop. | none |
| W4 | Follow-up work and deferred problems become work-graph nodes, not prose. | 2 | 2aeb5492:1868, 2aeb5492:2695 | Lone signal. | none |
| W5 | Skills and playbooks stay out of always-loaded context; the principal rejected an always-on option. | 2 | 2aeb5492:230 | Lone signal, but it is a correction against the agent's own recommendation. | none |
| W6 | Independent work runs as parallel subagents under the worktree SOP. | 3 | 02a23a26:175 | Lone signal, and it comes from the session that launched this pass. | none |

## Proposed memory note (W1)

Run only after the principal approves W1 by code ("approve W1"):

```sh
soma memory write --trigger principal-correction --principal-authority \
  --id ship-chain-runs-through-install --type procedural \
  --recall-trigger "the principal says push, PR, sage review, merge, or install, in a MetaFactory repo" \
  --body "A ship instruction such as 'push, PR, Sage review, merge' is a grant for the whole chain in one go: follow the playbooks shipping card through the merge, then release or bump the version when the repo publishes one, then install the result on this host. Report the PR, the Sage verdict, the merge commit, the release and the install as one summary. Ask before a step the instruction did not name."
```

## Questions for the principal (step 3, not asked in this headless probe)

- Q1: Which areas should this pass capture? (several allowed) Response style; autonomy and the ship chain; verification and review; delegation and subagents; follow-up tracking (nodes); none of these.
- Q2: After a merge, where should "install" reach? This host's Claude Code only; every installed substrate (Claude Code, Codex, pi); ask each time.
- Q3: Anything the options missed?

## Lone signals

W4, W5 and W6 each appear in one slice. Promote one by answering Q1, or by naming it.
