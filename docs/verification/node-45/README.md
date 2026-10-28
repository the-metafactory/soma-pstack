# Node #45 verification

Run on the host on 2026-10-28. The port is `skills/arena`, from `pstack/skills/arena/SKILL.md` at `cursor/plugins` `c742dd6` (full SHA in the member manifest).

## What changed from upstream

- Frontmatter: `disable-model-invocation: true` stays, and `triggers` are added (`/arena`, `arena this`, `throw it in the arena`).
- Phase A step 3: the pstack models rule and its Cursor model slugs are gone. A roster the principal names in the request wins. The default is two sub-agents, one on `opus` and one on `fable`. A substrate whose sub-agent tool cannot pick a model runs each seat as a model CLI process. The rules for a rejected model and for fewer than two runners are kept, in Soma terms.
- Phase A step 4: on Claude Code the Agent tool's `isolation: "worktree"` gives each candidate its own worktree.
- Phase C: the judge is picked by model family through a sub-agent or model CLI, the same mechanism `show-me-your-work` uses for its reviewer, with the same two declared hosts. A Claude parent gets `codex exec --sandbox read-only`; any other parent gets a Claude judge. The rules that the judge is never the parent's family and that a missing judge is skipped and reported are upstream's.
- Principles point at Soma's `the-algorithm` skill. Upstream's `prove-it-works` is Soma's `verify-before-claiming`.
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

## Gate

`bun test`: 106 tests across 12 files, 0 fail. `bun scripts/check-pack.ts`: see [pack-check.txt](pack-check.txt).
