# Node #45 verification

Run on the host on 2026-10-28. The port is `skills/arena`, from `pstack/skills/arena/SKILL.md` at `cursor/plugins` `c742dd6` (full SHA in the member manifest).

## What changed from upstream

- Frontmatter: `disable-model-invocation: true` stays, and `triggers` are added (`/arena`, `arena this`, `throw it in the arena`).
- Phase A step 3: the pstack models rule and its Cursor model slugs are gone. A roster the principal names in the request wins. The default is three seats in two families, where upstream's is a pair from two families: two sub-agents, one on `opus` and one on `fable`, and one `codex exec` runner. Without codex the default is the two Claude seats, and the parent says the roster lost its second family. A substrate whose sub-agent tool cannot pick a model runs each seat as a model CLI process. The rules for a rejected model and for fewer than two runners are kept, in Soma terms.
- Phase A step 3 drops upstream's fast/standard speed choice. Upstream's one-line rule for a short roster becomes: add runners until there are two, on a remaining runner's model or the parent's.
- Phase A step 3 adds two rules: never write a candidate yourself in this conversation, and stop and say the arena cannot run here when there is no sub-agent tool and no model CLI.
- Phase A step 4: on Claude Code the Agent tool's `isolation: "worktree"` gives each candidate its own worktree and branch, at a path the harness picks.
- Phase B (added): a worktree candidate commits its artifact and reports its worktree path, branch and SHA. The parent copies every candidate from its commit into one labeled tree, `/tmp/arena-<slug>/candidate-<n>/`, and leaves the worktrees for the principal to remove.
- Phase C: the judge is picked by model family through a sub-agent or model CLI, the same mechanism `show-me-your-work` uses for its reviewer. Upstream's chain of fallback judges becomes one judge per family: `codex exec --sandbox read-only --skip-git-repo-check -C /tmp/arena-<slug>` for a Claude parent, `opus` for any other. Codex runs on its configured default model, so only the `opus` route names a model that can be rejected. The rules that the judge is never the parent's family and that a missing judge is skipped and reported are upstream's.
- Phase B (added): the codex runner's command. Its prompt comes from a file on stdin, so stdin is always closed; `-o` writes its final message; a permissions profile lets it write only in its own directory, denies reads under `$HOME` and of the rubric, and turns off its network, with `approval_policy="never"`. Its prompt, report and session log stay in `/tmp/arena-<slug>-codex/`, outside the labeled tree. It gets a directory or a clone, never a linked worktree, whose git directory the profile denies.
- Phase C (added): with the default roster the judge shares a family with one candidate. It sees candidates only by label, the parent's Phase D scoring is the check, and the synthesis note records which candidate shared its family. There is no third family.
- Phase C adds two rules: a remote judge uses only a host declared in the manifest, through an already authenticated CLI, and the verdict is saved with the judge's model identity.
- Principles point at Soma's `the-algorithm` skill, as `the-algorithm/references/principles/<name>.md` in the Soma skills directory. Upstream's `prove-it-works` is Soma's `verify-before-claiming`.
- Phase D adds one sentence: a candidate's rationale is a claim about its artifact, so read the artifact.

Phase letters A to F and their names are upstream's. The `interrogate` port cites them.

## Live probe

A real arena on a scratch task outside the repo, `/tmp/arena-parse-duration/`, copied here.

- [task.md](task.md) is the prompt both candidates got. [rubric.md](rubric.md) is the picker's rubric, which they did not see.
- [candidate-1/](candidate-1/) is an Agent-tool sub-agent on `opus`; [candidate-2/](candidate-2/) one on `fable`. Both ran in parallel, each in its own directory.
- The judge ran as `codex exec --sandbox read-only` with [judge-prompt.md](judge-prompt.md). [judge-session.txt](judge-session.txt) is the head of its session log and names the model (`gpt-6.1-sol`, provider `openai`); [judge-verdict.md](judge-verdict.md) is its verdict.
- [synthesis.md](synthesis.md) is the synthesis note. [synthesis/](synthesis/) is the grafted artifact.
- [verify.test.ts](verify.test.ts) runs the rubric's cases against both candidates and the synthesis; [verify-output.txt](verify-output.txt) and [synthesis-tests.txt](synthesis-tests.txt) are the results.

What it shows:

- The judge and I picked the same base, candidate-1, with the same scores.
- We disagreed on one graft. The judge's objection reproduced, so the graft went in with a guard and a regression case. The note records both views and the reproduction.
- Each candidate fails a hidden rubric case the other passes; the synthesis passes all of them.
- Two judge-proposed grafts were rejected, each with a reason in the note. One of them, candidate-2's decimal tests, passes on plain multiplication too, so the tests do not check what their names say.

To rerun the hidden check: `bun test ./docs/verification/node-45/verify.test.ts` (the leading `./` is needed, since `bunfig.toml` roots test discovery at `test/`). It reports 4 failures by design; they are the candidates' gaps, not the synthesis's.

The arena was run by me, the parent, following `SKILL.md` in this session. It shows the instructions working end to end on Claude Code with a codex judge. It does not cover a Codex or pi parent.

## Worktree run

The first run gave each candidate a directory under `/tmp`. [worktree-run/](worktree-run/) is a second, shorter arena on the Claude Code default: two Agent-tool sub-agents, `opus` and `fable`, each with `isolation: "worktree"`, on a page-range parser ([task.md](worktree-run/task.md), [rubric.md](worktree-run/rubric.md)).

- Each candidate committed its artifact on its worktree branch and reported the path, branch and SHA. The harness also returned `worktreePath` and `worktreeBranch` itself. [handoff.txt](worktree-run/handoff.txt) records both, the `git branch --contains` check, and the `git archive` command that copied each commit into `/tmp/arena-clamp-range/candidate-<n>/`.
- The judge ran as `codex exec --sandbox read-only --skip-git-repo-check -C /tmp/arena-clamp-range` on the labeled copies. [judge-session.txt](worktree-run/judge-session.txt) names the model (`gpt-6.1-sol`, provider `openai`). [judge-verdict.md](worktree-run/judge-verdict.md) picks candidate-1, as I did.
- [synthesis.md](worktree-run/synthesis.md) is the note: one test graft, two rejections, and the two worktrees left in place. [synthesis-tests.txt](worktree-run/synthesis-tests.txt) and [rubric-probe.txt](worktree-run/rubric-probe.txt) are its checks.

`codex exec --help` (v0.163.0) has `-C`/`--cd` for the working root and `--add-dir` for extra directories, but `--add-dir` makes them writable, so copying into one tree keeps the judge read-only.

## Default roster run (D1)

[d1-run/](d1-run/) is a third arena on the parseDuration task, with the default roster after D1: an `opus` and a `fable` sub-agent and a `codex exec` runner, all three started in one message, and a codex judge.

- The codex runner ran the Phase B command with [codex-runner-prompt.md](d1-run/codex-runner-prompt.md) on stdin. Its session header, [codex-runner-session.txt](d1-run/codex-runner-session.txt), reads `model: gpt-6.1-sol`, `approval: never`, `sandbox: workspace-write [workdir]`, with no network note; it exited 0 with its three files written.
- [confinement-probe.txt](d1-run/confinement-probe.txt) runs the same profile through `codex sandbox` from the runner's directory: the rubric is denied, its own directory is writable, a sibling candidate is not, `$HOME` is denied, and `bun` runs. A network check from the same sandbox, run earlier in the session, printed "net blocked"; the recorded probe leaves it out because the host's egress policy blocks a recorded `curl`.
- The judge ran `codex exec --sandbox read-only -C /tmp/arena-d1-duration` with [judge-prompt.md](d1-run/judge-prompt.md); [judge-session.txt](d1-run/judge-session.txt) and [judge-verdict.md](d1-run/judge-verdict.md). It picked candidate-1, as I did, and ranked the codex candidate last. That header reads `approval: on-request`, inherited from the codex config. [judge-confined-session.txt](d1-run/judge-confined-session.txt) is a rerun of the same judge on copies of the three candidates with the Phase C command as now written: prompt from a file on stdin, `-o` for the verdict and `approval_policy="never"`. Its header reads `approval: never` and `sandbox: read-only`.
- [synthesis.md](d1-run/synthesis.md) records that the judge shared a family with candidate-3. [verify-output.txt](d1-run/verify-output.txt): the synthesis passes every hidden case; the 8 failures are the candidates'. Rerun with `bun test ./docs/verification/node-45/d1-run/verify.test.ts`.

The judge's header reads `approval: on-request`, from the user's codex config: the Phase C command sets only `--sandbox read-only`. It ran to completion, since a read-only judge has nothing to escalate for.

## Gate

`bun test`: 110 tests across 12 files, 109 pass, 1 skip, 0 fail. The skip is the statechart TLC test, which needs `tla2tools` and Java and was skipped before this change too. `bun scripts/check-pack.ts`: see [pack-check.txt](pack-check.txt).
