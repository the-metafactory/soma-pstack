---
name: reflect
description: "Only when the principal explicitly requests reflection or invokes /reflect; never auto-invoke. Review a session through judgment, tooling and divergent reviewers, then a synthesizer; propose skill edits for approval and route enforceable findings to a structural backlog."
---

# Reflect

Mine a completed session or the current conversation for durable lessons. Skip a trivial or off-topic session, or one whose lessons are already covered by guidance the agent followed correctly; state why. One-offs need not become instructions.

Run only when the principal requests reflection. Codex's explicit invocation policy lives in [agents/openai.yaml](agents/openai.yaml). On other substrates this is a procedural instruction; the port loses upstream's Claude Code `disable-model-invocation` flag because the shared source must pass the Codex authoring validator and Soma currently projects it unchanged.

## 1. Locate the session

Use the exact session id/path supplied by the active substrate or caller, within the read paths in [arc-manifest.yaml](arc-manifest.yaml). Confirm its opening request matches the session being reviewed. Never scan unrelated sessions or glob across projects. For another store location, obtain a caller-supplied transcript in the work directory or an authorized declaration update first.

If the transcript is unavailable, use a tight digest of this conversation, label it as a digest and disclose its coverage limits. Include the request, consequential decisions, corrections, tool results and outcomes. Do not invent missing turns. For a finished-session probe, a captured task transcript is valid; identify it as a scripted session when that is what it is.

## 2. Run three independent reviewers

Read [references/review-contract.md](references/review-contract.md). Start one subagent or authenticated model-CLI call per row, in parallel where supported. Give each the shared contract, its role prompt verbatim, the same scoped transcript/digest, and the relevant skill sources. Do not share the other reviewers' conclusions. Reviewers return text and do not edit files or file tickets.

| Lens | Prompt |
| --- | --- |
| Judgment | [references/judgment-reviewer.md](references/judgment-reviewer.md) |
| Tooling | [references/tooling-reviewer.md](references/tooling-reviewer.md) |
| Divergent | [references/divergent-reviewer.md](references/divergent-reviewer.md) |

Use the substrate's supported reviewer/model routing, honoring an explicit principal choice. Otherwise inherit its configured default; do not hard-code upstream Cursor model slugs or read credentials. Prefer distinct expertise where available, but different model families are not required for these lenses. Record the requested and reported model identity and any fallback. A rejected model selection gets one supported fallback, then report the gap.

Use only authorized reviewer services and scoped, redacted material. The manifest declares access, not permission. Read-only tools suffice; if a substrate couples lookup access to writable mode, prohibit mutation in the prompt. With no parallel fan-out, run three separate reviewer calls sequentially and disclose that fallback. With no independent reviewer mechanism, report incomplete rather than impersonating three reviewers inline.

## 3. Synthesize after all three return

Start a separate synthesizer call with the shared contract and [references/synthesizer.md](references/synthesizer.md), the three full reviewer outputs labeled by lens, and the same evidence and skill sources. Wait for all three; a missing or failed lens makes the review incomplete. Preserve the three lens sections followed by `Synthesis`, containing `Accepted`, `Rejected` and `Backlog`. Empty sections say `None`; do not force a finding.

## 4. Check for structural enforcement

Apply Soma's **encode-lessons-in-structure** principle: move any Accepted item a lint, test, script, schema, metadata flag or runtime check could enforce more reliably into Backlog. Do not add a parallel prose rule for it. Each backlog item names the observed failure, a concrete mechanism, its target and a failing-before/passing-after probe. Already-enforced behavior is an execution miss or rejection unless evidence shows a gap in the mechanism.

Save backlog proposals in the work directory. File them in the team's tracker only when the caller's authorization includes external writes; otherwise label them `proposed — not filed`. Include evidence and avoid duplicates. Never claim an item was filed without a returned id/link. Reflection does not authorize graph mutations, pushes, PRs or merges.

## 5. Present proposals and wait for approval

Show the full Accepted / Rejected / Backlog result with stable finding ids and evidence. For each Accepted row, show the destination skill source, section, concrete proposed edit and routing. **Do not edit any skill without the principal's explicit approval of that row.** Invoking reflect, a reviewer's recommendation, or having write access is not approval. The principal may approve a subset or redirect it. In a headless run, leave proposals pending and stop before applying them.

Never edit a generated projection, installed pack cache or `plugins/cache/`. Resolve the maintained source and show its destination before approval. If that source is unavailable, propose a writable source copy and its destination for approval; do not silently fork it.

After approval, apply only approved rows at their approved destinations:

- Trivial body correction: the parent applies it directly.
- Substantive body edit, description tuning or a new skill: use the installed skill-authoring workflow (`skill-creator` on Codex), including its validation and behavioral iteration. If unavailable, retain the proposal and report the gap.

Run the target repository's skill validator and relevant probes on touched skills. Summarize edits applied, proposals pending approval, backlog saved/filed with evidence, and rejected findings with reasons. Distinguish proposals from completed changes.

Source: ported from pstack (MIT, © 2026 Lauren Tan); upstream pin in [arc-manifest.yaml](arc-manifest.yaml), notice in the library root. The role prompts are rewritten for Soma and share a new review contract. Other adaptations: scoped portable transcripts and reviewer routing, local backlog proposals under restricted authority, structural probes, and principal-approved source edits. Decision source: [soma#1089](https://github.com/the-metafactory/soma/issues/1089), moved to pack node #10.
