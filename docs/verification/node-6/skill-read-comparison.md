# Original skill-read versus pre-review source

Historical comparison at commit `b524856`, before review round 1. The round restores
Claude invocation metadata and updates the footer; the operating body remains unchanged.
The hashes and diff below describe the pre-review source.

Compared only this worker's exact own session and the final skill source. No tests or behavior probes were run and no existing acceptance artifact was modified.

- Own session: `/Users/fischer/.codex/sessions/2026/10/26/rollout-2026-10-26T23-06-11-01a17a3f-eb77-7c02-90fd-cca398ddf4ec.jsonl`
- Original read: first command-completion record for `/bin/zsh -lc 'cat skills/blast-radius/SKILL.md'`; its `aggregated_output` is the complete original source, including the trailing newline.
- Final source: `/Users/fischer/work/ranger-repos/the-metafactory/soma-pstack/.worktrees/node-6/skills/blast-radius/SKILL.md`
- Comparison method: UTF-8 text, preserving line endings and whitespace. Exclude the opening YAML frontmatter through its closing `---` line, then exclude the final `Source:` footer paragraph. The intervening operating body, including its existing leading/trailing blank lines, is hashed without trimming or other normalization.

## Operating body

| Version | SHA256 |
| --- | --- |
| Original first read | `e5c03807ea7977bece6cda1fc23cdfb9664a613f51d47630f8316d79202364c8` |
| Final source | `e5c03807ea7977bece6cda1fc23cdfb9664a613f51d47630f8316d79202364c8` |

**Operating instructions identical: yes, byte-for-byte.**

The operating body is 5000 bytes in the original and 5000 bytes in the final. Metadata identical: False. Source footer identical: False.

## Precise full-source differences

The following unified diff includes every difference between the original returned source and final source:

```diff
--- original-first-read/SKILL.md
+++ final-source/SKILL.md
@@ -1,7 +1,6 @@
 ---
 name: blast-radius
 description: "Find what a change could break beyond its diff and prove the one or two facts its safety depends on. Use for 'blast radius of X', 'what could this break', or reviewing a small diff you do not trust. Use a mechanics or history investigation for a how/why question without a change to assess."
-disable-model-invocation: true
 ---

 # Blast radius
@@ -41,4 +40,4 @@

 Use plain prose and strip private material before sharing. This skill produces an assessment; it does not approve a merge.

-Source: ported from pstack (MIT, © 2026 Lauren Tan); upstream pin in [arc-manifest.yaml](arc-manifest.yaml), notice in [../../NOTICE.md](../../NOTICE.md). Soma adaptations: portable PR/reviewer lookup, explicit per-fact stop reasons and bounded execution evidence. Decision source: [soma#1085](https://github.com/the-metafactory/soma/issues/1085), moved to pack node #6.
+Source: ported from pstack (MIT, © 2026 Lauren Tan); upstream pin in [arc-manifest.yaml](arc-manifest.yaml), notice in [../../NOTICE.md](../../NOTICE.md). Soma adaptations: portable PR/reviewer lookup, explicit per-fact stop reasons and bounded execution evidence; upstream's explicit-invocation setting is expressed for Codex in [agents/openai.yaml](agents/openai.yaml). Decision source: [soma#1085](https://github.com/the-metafactory/soma/issues/1085), moved to pack node #6.
```

Full original-source SHA256: `fb639c132a810c73881c30083077fd21ba4be0df34617b341a89dfdab054218c`.

Full final-source SHA256: `a84f5e5260a4bae85c71cf35eac7eff9e1a48fcbf1a04f054f5f6346d6bf9c7f`.
