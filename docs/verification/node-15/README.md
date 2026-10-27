# Node #15 verification

Verified on the host on 2026-10-27. The port is `skills/sharpen`, from `pstack/skills/sharpen/SKILL.md` at `cursor/plugins` `b6375f1` (full SHA in the member manifest).

## What changed from upstream

The upstream skill is one short prompt. `SKILL.md` keeps its text verbatim and makes three changes:

- Frontmatter: `disable-model-invocation: true` is dropped and `triggers` are added (`/sharpen`, `sharpen this task`, `sharpen this prompt`, `deeper, not bigger`), so Soma's router and the Skill tool can select it.
- An `## Output` section fixes the shape of the reply: the four points under four headings, then the rewritten prompt, with no work on the task itself. It also states how the "leave choices open" line applies: a stated choice stays as stated, an unmade choice stays unmade and is listed as an open question.
- A source line names the file and commit.

## Acceptance criteria

| Criterion | Where it is met |
| --- | --- |
| Names what a top professional would add, the rawest source material, their methods and an outside check | The four numbered points in `SKILL.md`, asserted verbatim by `test/sharpen.test.ts` |
| Leaves the principal's choices open | The last upstream line plus the `## Output` rule; asserted by the test |

## Live probe

[scratch-brief.md](scratch-brief.md) is a task brief with seven stated choices: Bun, `dedupe.ts`, `~/Pictures`, SHA-256, JSON output, no deleting or moving, and under 100 lines. [sharpened.md](sharpened.md) is the result of following `SKILL.md` on it: four headed parts, then the rewritten prompt.

- The rewrite contains the original brief word for word and adds depth: size-first filtering, link handling, a fixture with known answers, and an `fdupes` cross-check as the outside check.
- Choices the brief left unmade (near-duplicates, perceptual hashing, RAW and sidecar files) are listed as open questions, not answered.
- `test/sharpen.test.ts` checks the heading structure and that every stated choice survives in the rewrite.

This probe was run by hand: I followed `SKILL.md` myself, in this session, and did not invoke the skill through a substrate. It shows what the instructions produce when followed. It does not show how a substrate's model behaves with them.

## Gate

`bun scripts/check-pack.ts` output: see [pack-check.txt](pack-check.txt). `bun test test/` passes; bare `bun test` also collects `docs/verification/node-8/before-messages.test.js`, a stored "before" fixture that fails on a missing `./messages.js` module. That failure comes from node #8's evidence, not from this node.
