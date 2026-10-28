# Node #49 verification

The port is `skills/automate-me`, from `pstack/skills/automate-me/SKILL.md` at `cursor/plugins` `c742dd6` (full SHA in the member manifest). Tracking issue: the-metafactory/soma-pstack#49. Verified on the host on 2026-10-28.

## What changed from upstream

The orchestrator decided the target before this port: in Soma the principal's working style is not a `<handle>-mode` skill. It lives on four Soma home surfaces (the communication contract, the behavior policy, local principles and memory notes), and Soma treats each as a principal-trust surface. The port follows from that decision:

- Output: a proposal file in the work directory with one row per candidate and a diff or `soma memory write` command per surface, instead of a new `-mode` skill. Nothing is applied until the principal approves the row.
- Mining: one store per substrate (Claude Code, Codex, pi, Cursor), scoped to the active workspace. Codex keeps sessions by date, so the skill reads only the `cwd` field of each file's first line, the `session_meta` row, and drops subagent sessions. On this host that filter keeps 916 of 1,623 session files as top-level sessions. Other substrates are reported as unsupported.
- Routing: a candidate already covered by a rule is dropped and named, a covered rule that agents missed gets a sharper wording instead of a second rule, and an enforceable one becomes a structural backlog item.
- Skills: Cursor's `create-skill` becomes the playbooks `authoring-a-skill` card and `writing-for-agents`. `unslop` becomes `humanizer`. The `poteto-mode` model-selection pointer becomes "pick a cheaper model".
- Landing: re-project with `soma install <substrate> --apply` instead of a worktree and PR. The Soma home is committed or pushed only when the principal asks.
- Kept: `disable-model-invocation: true` (with a `/automate-me` command trigger, as `explain` does), the 2+ slice bar, the short structured interview, and the guardrails.

The `soma` CLI has one proposal path, `soma graph file-proposal`. It files a work-graph node from `proposals/<ref>.md`, and its schema requires an Errata checkpoint and Errata ids (`src/graph/proposal-file.ts` in the soma repo), so it does not fit edits to the principal's own files. The governed write that does fit is `soma memory write --trigger principal-correction --principal-authority`, which the proposal names for memory notes and does not run.

## Live probe

A real mining pass over this workspace's Claude Code store, 2026-10-26 to 2026-10-28:

1. [extract.ts](extract.ts) kept 25 principal-authored turns from six session files, up to the turn that launched the pass, and cut them into three time slices of 9, 9 and 7 turns. The first run kept 29: it also kept three ranger resume prompts and one `/clear` command row. The extractor now drops both kinds, and [proposal.md](proposal.md) records the correction. [slices.json](slices.json) holds each slice's range and pointers, with no turn text.
2. Three Sonnet subagents mined one slice each, in parallel, read-only, under the signal list in `SKILL.md`. Each returned up to eight paraphrased patterns with pointers. Five pointers were checked against the source transcripts and matched.
3. [proposal.md](proposal.md) is the clustered result. One signal is new and seen in all three slices (W1: a ship instruction runs through release and a local install), so it gets a proposed memory note. Two signals seen in all three slices are already covered by the communication contract and the behavior policy and are dropped with the rule named. Three lone signals are listed for the principal.

Step 3 (asking the principal) was not run: this probe ran headless inside a teammate agent with no channel to the principal. The questions are in the proposal, unanswered, as the skill says to do in a headless run.

Nothing was applied. `git -C <soma-home> diff --quiet HEAD -- profile/communication.md policy/behavior.md skills/the-algorithm/references` exited 0 after the run, and no memory note with the proposed id exists.

The committed evidence carries no transcript text. The proposal paraphrases and quotes at most a few words of an instruction.

## Checks

- `test/automate-me.test.ts` checks the command-only frontmatter, the upstream pin, the four surfaces and the approval rule, the per-substrate stores, the 2+ slice bar, the absence of upstream tooling names, that no member or evidence file names a private Soma home path, that the extractor keeps only principal turns on a fixture store (including slash-command rows and a ranger resume prompt, which the previous extractor kept), that the documented slug and Codex commands behave as stated on fixtures (the Codex test feeds `session_meta` lines for top-level, guardian, review and thread-only subagent sessions), and that the proposal routes only multi-slice signals. Each new behavior test failed against the code before this fix.
- On this host the slug rule matched all 1,071 project directories under `~/.claude/projects` that record a `cwd`, including one whose path holds ` - ` (mapped to `---`).
- `bun test` and `bun scripts/check-pack.ts` pass; see [gate.txt](gate.txt).
