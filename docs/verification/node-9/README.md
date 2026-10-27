# Node #9 verification

Verified on the host on 2026-10-27. The port is named `ketchup`, after upstream `pstack/skills/ketchup/SKILL.md` at `cursor/plugins` `b6375f1` (full SHA in the member manifest).

## What was probed

A scratch subagent read only `skills/ketchup/SKILL.md` and was told the principal had typed `cup` after the multi-step session in `fixture-session.md`. The fixture holds two real calls (PR 40, PR 41), one fix the agent can make alone (a retry cap), one tempting non-call (log rotation) and one screenshot. `count-caps.py` counts words with pictures excluded.

| Run | Whole reply | Item D1 | Item D2 | Notes |
| --- | --- | --- | --- | --- |
| 1, before tightening ([reply](probe-reply-1-before-tightening.md)) | 206 | 41 | 57 | Items over "about 30"; two items over "well under 150". Caps failed. |
| 2, after tightening ([reply](probe-reply-2.md)) | 128 | 31 | 36 | Caps hold. |

Run 2 lists both pending calls with pick, evidence and risk, makes up no call (the retry cap and log rotation stay out of the action items), and embeds the one screenshot. It drew no diagram, so the visual cap (6 boxes of 8 words) was not exercised by this probe; the skill states it and it is inherited unchanged from upstream.

The change between runs: the item cap became "about 30, never over 40, counting call, pick, evidence and risk together", and the two-item total now counts the opening sentence and summary.

## Gate

`bun scripts/check-pack.ts` passes (9 members). Bare `bun test` has one failure that exists on the base commit and is not caused by this node: it collects `docs/verification/node-8/before-messages.test.js`, which imports a `./messages.js` that is not in that directory.

## The `cup` alias

The alias lives in the principal's Soma home (`~/.soma/profile/communication.md`), outside this repository, and is the principal's own writing. It is not changed here. Proposed replacement for the `cup` line:

```
- cup: Use the ketchup skill: catch me up on what changed since my last message, in plain words, and list every call waiting on me with your pick, its evidence and its risk.
```

`skills/recall/SKILL.md` already routes "what changed since my last message" to the `cup` alias.
