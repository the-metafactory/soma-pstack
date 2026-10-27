# Node #7 verification

Verified on the host on 2026-10-27.

## What changed

`skills/recall` step 4 now sweeps six sources instead of three: git and `gh`, the work graph, chat, long-form docs and error tracking, with the own record from step 3. Chat, docs and error tracking read the `why` skill's playbooks (`chat.md`, `long-form-docs.md`, `observability.md` under `skills/why/references/sources/`). `recall` copies none of their commands, so there is one text to keep in step. The `why` skill landed with node #13 (soma#1070 is closed), so the pointer has a target.

The output contract gains a last part, Sources: one line per source, `swept` with what was searched and found, or `not reached` with the reason. Error tracking is always `not reached: no source in this pack`, as `observability.md` records it. If `why` is not installed, chat and docs are `not reached` for that reason. The manifest declares the `discord.com` and `confluence.switch.ch` hosts and read access to the installed `why` skill.

## Acceptance criteria

| Criterion | Where it is met |
| --- | --- |
| Names each source swept and each not reached, with the reason | The `Sources` part of the output contract; asserted by `test/recall.test.ts` |
| Chat, docs and error tracking reuse `why`'s investigators, not a second copy | Step 4 points at the three `why` playbooks; the test checks they exist, that `recall` has no `references/` directory and that none of the `discord` or `confluence` commands appear in `recall` |

## Live probe

Run by hand from `/tmp`, following the playbooks' read-only commands. I did not invoke `/recall` through a substrate, so this shows the sweep is reachable from this host, not how a model behaves with the new text.

- Discord: `discord threads` listed one thread (`arc/pr/433`); `discord channels` listed `#soma`; `discord read --channel soma --limit 100` returned messages. Searching them for "orienteer" and "pstack" found no hit, so the line for this topic would read: chat swept, `#soma` last 100 messages, no match.
- Confluence: `confluence search 'text ~ "Soma" and type = page' --limit 5` returned five pages, among them 358256515 "How-to: Better agent results with Soma, Algorithm and Orienteer". `text ~ "pstack"` returned `no results`, a null finding.

The acceptance probe in the node asks for a topic with a known Discord thread and Confluence page. I found no topic on this host that has both, so the "cites both" half is not shown. Each source was reachable, and the unreachable path is the `why`-not-installed and CLI-error text in step 4.

## Gate

`bun test test/recall.test.ts` passes. `bun scripts/check-pack.ts` output: see [pack-check.txt](pack-check.txt).
