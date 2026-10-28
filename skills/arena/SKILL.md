---
name: arena
description: "Spawn N parallel candidates at the same task, pick a base, graft the strongest parts of the losers into it. Use for /arena, 'arena this', 'throw it in the arena', or when one attempt at a non-trivial artifact would lock in the wrong shape."
disable-model-invocation: true
triggers:
  - pattern: "/arena"
    type: command
    priority: 100
  - pattern: "arena this"
    type: keyword
    priority: 60
  - pattern: "throw it in the arena"
    type: keyword
    priority: 60
---

# Arena

Open a todolist with one entry per phase (Frame, Fan out, Cross-judge, Pick, Graft, Verify) before launching anything.

## Phase A: Frame

Every candidate gets the same prompt, so the prompt is the contract.

1. State the artifact each candidate is producing.
2. Derive the rubric, 3-6 concrete gradeable criteria for what success looks like on *this* task. It is the picker's tool in Phase D. Candidates only see the task.
3. Pick the runners. A roster the principal names in the request (models, a count, or a model CLI) is the roster; use it as given. Otherwise run three candidates in parallel, so they span two model families: two sub-agents, one on model `opus` and one on model `fable`, and one `codex exec` runner on codex's configured default model (Phase B gives its command). On Claude Code the sub-agents are the Agent tool with its `model` parameter. If `codex` is missing or fails to start, run without it and say the roster lost its second family. On a substrate whose sub-agent tool cannot pick a model, run each seat as its own model CLI process (`claude -p --model <model>`, `codex exec -m <model>`) instead. If the tool or CLI rejects a model, use the closest valid model of the same tier from its error message, or drop the seat and say so when there is none. If dropped seats leave fewer than two runners, add runners on a remaining runner's model until there are two, or on the parent model when none remain, and say so. Spawn more runners when the arena covers multiple design directions. Use the same model N times when the work is generation-bound rather than judgment-sensitive. Pick each runner's reasoning effort for the job: raise it for judgment-heavy design work and leave it at the default for generation. Never write a candidate yourself in this conversation, since each would see the one before it. With no sub-agent tool and no model CLI, stop and say the arena cannot run here.
4. Give each candidate its own output location, per the **separate-before-serializing-shared-state** principle (`the-algorithm/references/principles/separate-before-serializing-shared-state.md` in the Soma skills directory). On Claude Code, the Agent tool's `isolation: "worktree"` gives each sub-agent its own git worktree and branch, and the harness picks the path. Elsewhere, use `git worktree add` or a directory `/tmp/arena-<slug>/candidate-<n>/` that you name. The codex runner always gets `/tmp/arena-<slug>/candidate-<n>/`, or, when the task needs the repository, a `git clone` at `/tmp/arena-<slug>-codex/clone-<n>/` passed to `-C` in place of it, never a linked worktree: its profile (Phase B) denies reads under `$HOME`, and a linked worktree keeps its git directory in the repository. Copy any shared grounding it needs from under `$HOME` into `/tmp/arena-<slug>/grounding/`.

## Phase B: Fan out

Spawn all N candidates in one message so they run in parallel in the background, each with the task, the path to the shared grounding, where to write, and instructions to produce the artifact and a short rationale naming the alternatives it considered and what it rejected. A candidate in a directory you named gets that path. A candidate in a harness-picked worktree gets a directory relative to its worktree root, commits the artifact there on its worktree branch, and ends its report with its worktree path, branch and commit SHA. The commit keeps the artifact when the harness cleans up the worktree.

Start the codex runner in the same message as the sub-agents, in the background. Write its prompt to `/tmp/arena-<slug>-codex/prompt-<n>.md` first, with the Write tool on Claude Code, and keep that directory outside the labeled tree so the judge does not see which seat was codex. Then run, in bash or zsh:

```sh
fs="{\":root\"=\"read\", \"$HOME\"=\"none\", \"$HOME/.gitconfig\"=\"read\", \"$HOME/.bun\"=\"read\", \"/tmp/arena-<slug>/rubric.md\"=\"none\", \":project_roots\"=\"write\"}"
codex exec --skip-git-repo-check \
  -c "permissions.arena.filesystem=$fs" \
  -c 'default_permissions="arena"' \
  -c 'approval_policy="never"' \
  -C /tmp/arena-<slug>/candidate-<n> -o /tmp/arena-<slug>-codex/report-<n>.md \
  - < /tmp/arena-<slug>-codex/prompt-<n>.md > /tmp/arena-<slug>-codex/session-<n>.txt 2>&1
```

The profile lets the runner write only in its own directory, read nothing under `$HOME` except the listed paths, never read the rubric, and reach no network; `approval_policy="never"` keeps it from asking to escalate. These `-c` overrides take precedence over the user's codex config for the sandbox, the network and approvals. Add a `"read"` entry for any other toolchain directory under `$HOME` the task's checks need. `-` reads the prompt from the file on stdin, so stdin is always closed and a background run never waits on a terminal; never leave it open. A prompt inline in double quotes is expanded by the shell, which can drop a clause without an error. `-o` writes its final message to a known file. Its session header in `session-<n>.txt` must read `approval: never` and `sandbox: workspace-write [workdir]` with no network note; stop the runner and drop the seat if it reads otherwise.

When the candidates finish, label them `candidate-1` to `candidate-N` in spawn order and copy each artifact into `/tmp/arena-<slug>/candidate-<n>/`, beside the rubric. Copy a worktree candidate from the commit it reported (`git archive <sha> <dir> | tar -x -C /tmp/arena-<slug>/candidate-<n> --strip-components=<depth>`), and check that the SHA is on the branch the harness reported. The codex runner already wrote into its labeled directory; when it worked in a clone, copy its artifact from the clone into `/tmp/arena-<slug>/candidate-<n>/`. The judge and you then read one labeled tree. Leave the candidate worktrees and branches in place, and list them in the synthesis note so the principal can remove them.

If a candidate produces no output, proceed with N-1 and note the dropout.

## Phase C: Cross-judge

After all Phase B candidates complete, spawn one read-only judge on a model family other than the parent's, through an available sub-agent or model CLI. A family is the model's vendor: Claude models (`opus`, `sonnet`, `fable`, `haiku`) are one family, OpenAI's GPT models behind `codex` are another. The judge is never from the parent's family. A Claude parent gets a codex judge, which runs in the labeled tree on codex's configured default model. Write its prompt to `/tmp/arena-<slug>-codex/judge-prompt.md`, outside the labeled tree, and run `codex exec --sandbox read-only --skip-git-repo-check -c 'approval_policy="never"' -C /tmp/arena-<slug> -o /tmp/arena-<slug>-codex/judge-verdict.md - < /tmp/arena-<slug>-codex/judge-prompt.md > /tmp/arena-<slug>-codex/judge-session.txt 2>&1`. As with the runner, `-` reads the prompt from the file on stdin so stdin is always closed, and `-o` writes the verdict to a known file. Its session header must read `approval: never` and `sandbox: read-only`; stop the judge if it reads otherwise and treat it as a judge that did not run. A parent from any other family gets a Claude judge on `opus`, as a sub-agent or `claude -p --model opus`. A remote judge must use a host declared in [arc-manifest.yaml](arc-manifest.yaml), currently `api.anthropic.com` or `api.openai.com`, through an already authenticated CLI. If `claude` rejects `opus`, use the closest valid Claude model from its error message. If no judge from another family runs, skip the judge, pick the base alone in Phase D, and say so. Never label a judge from the parent's family as cross-family. If you do not know the parent's model, use the Claude-parent route and say that the family check did not run. With the default roster the judge shares a family with one candidate: a Claude parent's codex judge with the codex runner, an `opus` judge with the `opus` runner. Do not look for a third family. The judge sees candidates only by label, never by model, and your Phase D scoring is the check on any bias toward its own family. Record in the synthesis note which candidate the judge shared a family with. The judge sees the rubric and the candidates by their labels in that tree, scores each criterion, and recommends a base with rationale. Save its verdict with the judge's model identity; codex prints it in its session header. It runs in parallel with your reading in Phase D. Don't spawn it while candidates are still writing.

## Phase D: Pick a base

Read every candidate end to end before picking. A candidate's rationale is a claim about its artifact; read the artifact. Score each against the rubric criterion by criterion, not on holistic feel, and compare with the cross-judge when Phase C ran one. Agreement on the base confirms the pick. Disagreement means one of you is biased or the rubric was ambiguous. Read both rationales before deciding.

Pick the base a future maintainer can extend most easily without breaking invariants. When two feel tied, prefer the cleaner boundary or smaller API, per the **laziness-protocol** principle (`the-algorithm/references/principles/laziness-protocol.md`).

## Phase E: Graft

Walk each losing candidate once more for what is worth porting into the base, usually one or two things per candidate, not most of it. Fold each graft in by hand, per the **redesign-from-first-principles** principle (`the-algorithm/references/principles/redesign-from-first-principles.md`), so the result stays coherent under one mental model. Don't paste mechanically.

If the candidates converge on one shape, that is strong agreement. Note it and ship the consensus shape. No graft is needed. If they wildly diverge, Phase A was under-specified. Reframe and re-run rather than averaging the divergence.

## Phase F: Verify

Verify the synthesized artifact like any other output, per the **verify-before-claiming** principle (`the-algorithm/references/principles/verify-before-claiming.md`). If verification finds a problem the arena missed, either Phase A was wrong (re-frame and re-run) or a candidate caught it and you missed the graft (go back to Phase E). Don't paper over it.

## Outputs

One synthesized artifact, with a short synthesis note alongside naming the base and why, the cross-judge's verdict or that Phase C skipped the judge, the candidate the judge shared a family with, if any, each graft with its source candidate, what was rejected and why, any convergence or dropouts, any candidate worktrees left in place, and the verification result.

Source: ported from pstack `pstack/skills/arena/SKILL.md` at commit c742dd61706fbacc1b95f1a20b7b988cf096ce6c (MIT, © 2026 Lauren Tan). Phase letters and names are upstream's, since other skills cite them.

Added rules, which change behavior:

- Never write a candidate yourself in this conversation.
- Stop and say the arena cannot run here when there is no sub-agent tool and no model CLI.
- Save the judge's verdict with the judge's model identity.
- A remote judge uses only a host declared in the manifest, through an already authenticated CLI.
- Phase B says how a worktree candidate reports its path, branch and commit, and the parent copies every candidate into one labeled tree for the judge.
- Phase D: a candidate's rationale is a claim about its artifact.

Adaptations:

- Triggers added.
- Phase A step 3 takes the runners from the principal's roster, or a Soma default instead of the pstack models rule. Upstream's default is a pair from two families; Soma's is three seats in two families, an `opus` and a `fable` sub-agent plus a confined `codex exec` runner, whose command Phase B gives. Without codex the default falls back to the two Claude seats. Upstream's fast/standard speed choice is dropped. Upstream's one-line rule for a short roster becomes: add runners until there are two, on a remaining runner's model or the parent's.
- Phase C picks the judge by model family through a sub-agent or model CLI, as `show-me-your-work` picks its reviewer. Upstream's chain of fallback judges becomes one judge per family: codex for a Claude parent, `opus` for any other. Because the default roster has a seat in each family, the judge may share a family with one candidate; Phase C says so and leaves the check to the parent's Phase D scoring.
- Principle names point at Soma's `the-algorithm` skill. Upstream's `prove-it-works` is `verify-before-claiming`.
