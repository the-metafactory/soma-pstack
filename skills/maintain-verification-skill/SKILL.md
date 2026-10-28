---
name: maintain-verification-skill
description: "Periodic pass that keeps a project's verify-<app> skill and its feature map honest: one read-only source reader per feature, one live session that drives every feature, and at most one PR of proven corrections. Use for /maintain-verification-skill or \"audit the verify skill\"."
route: "A project's verify-<app> skill may have drifted: the app's user-facing surface changed without its feature map, or a mapped drive fails for a reason the map does not explain."
disable-model-invocation: true
triggers:
  - pattern: "/maintain-verification-skill"
    type: command
    priority: 100
  - pattern: "audit the verify skill"
    type: keyword
    priority: 60
---

# Maintain a verification skill

A feature map rots as soon as the app changes. This skill is the upkeep loop for a skill that `/create-verification-skill` generated, or for any project-local verification skill with a feature map. The unit of rigor is the feature, not the sentence: cover every feature file from source and exercise every feature live, without turning every bullet into a command.

## Outcomes

Pick one, and say which:

- **clean**: every feature got source and live coverage, and nothing is worth shipping. No branch, no PR.
- **changed**: one branch of proven doc, harness or map corrections, shipped as one PR.
- **blocked**: coverage could not finish, or a proven fix could not ship safely. Say exactly what blocked it.

## Edit scope

Edit only the verification skill's own directory: its `SKILL.md`, `features/`, and any harness scripts it owns. Never edit product code during a run. When the app no longer does what the map describes, that is either doc drift (fix the map) or a product regression (report it, and do not paper over it in the docs).

## Pass

0. **Locate the target.** `create-verification-skill` writes the skill into the project's skill directory for the active substrate: `<repo>/.claude/skills/verify-<app>/` for Claude Code, `<repo>/.agents/skills/verify-<app>/` for substrates that read that path. Its body has Launch, Doctor, Drive, Evidence and Cleanup sections, and its feature map is `verify-<app>/features/README.md` with one file per feature. A skill under another name counts when it has that shape. Several candidates: ask the principal which one. None: stop and point at `/create-verification-skill` instead of inventing a target.

1. **Index hygiene.** Read the feature map README and list its sibling files. Fix missing, extra, duplicate or dead entries. Keep it light; do not generate an inventory.

2. **Source wave.** One read-only subagent per feature file, launched in parallel. Each one explains how the user-facing feature works from source, flags likely doc drift with `file:line` citations, and returns one concise recipe for the live pass. Subagents never drive the app and never edit files. Return shape: feature summary, source entry points, likely drift or none, one recipe. On a substrate that cannot spawn subagents, read the features one at a time in the same shape, and say so in the report.

3. **Reconcile.** Every feature file has a returned summary. Merge overlapping recipes into as few app states as practical. Spot-check cited drift at its citation; do not re-prove clean claims. Sweep recent churn (`git log` over the app's user-facing code) for surfaces the map lacks, and require a concrete source path before calling one missing.

4. **Live pass.** Required even when the source looks clean. The coordinator does all the driving, with the target skill's own Launch, Doctor, Drive, Evidence and Cleanup steps and its helper scripts. Its Launch section decides the launch model: one long-lived instance driven serially for servers and UIs, or a fresh isolated session per drive for short-lived CLIs. Exercise every feature at least once, and hold three invariants for the whole pass, whatever fails:
   1. Never drive an instance you have not health-checked since it last did something surprising. Run Doctor before the first drive, on each fresh session where sessions are the unit, and again after any failed drive. Where Doctor cannot see the failure (a wedged UI on a healthy process), reset to a known state or relaunch instead of hoping.
   2. Evidence captured so far survives every cleanup. Check it at the location the skill names; do not assume it.
   3. Nothing a drive started outlives its use. Clean failed-iteration residue whether the session is stuck, exited or shared. For a shared instance, clean the residue, not the instance.

   A Doctor failure caused by skill drift is drift: fix it under the edit scope and retry once, restarting only what the fix invalidated, before you call the pass `blocked`. A feature that cannot be reached is `verified-unreachable` only with the concrete prerequisite (auth, entitlement, OS, external state) and the route you tried. If the map omits that prerequisite, that is drift. Drive every harness fix from triage live again before it ships. Run the final Cleanup after the last drive of the run, re-proofs included, so nothing outlives the run. The evidence stays, as the skill says.

5. **Triage.** A wrong or missing user-POV description is doc drift: fix it. Working behavior the harness cannot drive is a harness gap: fix it, under the same Helpers rule as `create-verification-skill` (scripts executable, invocation shown in the skill body). App behavior that is broken is a product gap: record it for the principal and keep it out of this change.

6. **Ship or stop.** For `changed`, put the corrections on one branch in a worktree, and re-read every changed file before you commit. Push and open the PR only under the principal's approval or a grant that covers this work, and follow the `opening-a-pr` card (`playbooks/references/opening-a-pr.md` under the Soma skills directory). Without approval, stop at the local branch and report it as `changed`, with the PR waiting on the principal. For `clean` or `blocked`, open no PR, and report the outcome and the coverage as they are.

Keep short run notes in a scratch location: features covered, unreachable prerequisites, confirmed drift, outcome. Do not commit them. An unattended run also keeps its decision trail per `show-me-your-work`.

Source: ported from pstack `pstack/skills/maintain-verification-skill/SKILL.md`; upstream pin in arc-manifest.yaml. Changed: the target location, the subagent wording, the push gate and the route line. The rules are upstream's.
