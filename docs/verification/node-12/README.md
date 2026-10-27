# Node #12 verification

Verified on the host on 2026-10-27. The port is named `typescript-best-practices`, after upstream `pstack/skills/typescript-best-practices/` at `cursor/plugins` `b6375f1` (full SHA in the member manifest). `SKILL.md` and `references/patterns.md` are upstream's text; the diff is the principle pointers (see below) and the source line.

## Acceptance criteria

The rules table in `skills/typescript-best-practices/SKILL.md` carries the four rules the node names:

| Rule | Table row |
| --- | --- |
| A lying type guard is worse than `as` | Type guards |
| Don't mock what you can run | Real tests |
| The narrowing order | Narrowing hierarchy |
| The simplest total type | Simplest total type |

## Projection

`project.py` projects the member into a scratch home with `soma project-skill` for all seven substrates and compares bytes ([projection.jsonl](projection.jsonl) holds the commands and exit statuses). Result: six full projections (codex, claude-code, cursor, grok, dsh, anthropic-cowork) match the source byte for byte, and the Pi stub names the registry copy, which matches too. The skill name is listed in the generated skill catalog of cursor, grok, codex, anthropic-cowork and pi. Claude Code discovers skills from its skills directory and has no catalog file.

## Adaptations

- Upstream says to apply the type-system-discipline and boundary-discipline "principle skills". Soma ships principles as files in the `the-algorithm` skill, so the text points at `references/principles/<name>.md` there.
- Upstream's `disable-model-invocation: true` is dropped so the principle can point at this skill by name and the Skill tool can resolve it. The `paths` filter for `.ts` and `.tsx` is kept. No `agents/openai.yaml` is shipped, so Codex keeps its default implicit invocation.

## Open: the principle pointer lives in Soma

`type-system-discipline.md` is in the Soma repository (`src/skills/the-algorithm/references/principles/`). The pack map keeps principles in Soma, so this node does not edit it. Soma's file does not name the skill yet (grep of the Soma repo and the installed home found no `typescript-best-practices`). Proposed line for that file, appended to the bullets:

```
- In TypeScript, load the `typescript-best-practices` skill (soma-pstack) for the narrowing order, type guards and the simplest total type.
```

The skill's name resolves in every substrate once the pack is installed, per the projection above. The live probe's second half (a grep of the installed principle for the name) passes only after Soma carries that line.

## Gate

`bun scripts/check-pack.ts` output: see [pack-check.txt](pack-check.txt).
