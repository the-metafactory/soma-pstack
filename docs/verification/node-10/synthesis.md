## Accepted

None.

## Rejected

None. J1, T1 and D1 converge on the structural proposal below; no duplicate prose edit is warranted because `skills/no-comments/SKILL.md`, Steps 1–3, already requires inventory before classification and removal.

Coverage remains unverified for independent final slice review: the supplied command transcript contains no reviewer input bundle or verdict. The commit’s “reviewed” wording does not establish compliance or prove review was skipped. This scripted scratch session also does not cover reshape, external-constraint keep, rebase conflicts, production-rule compatibility or PR reporting.

## Backlog

**B1 — Require recorded inventory before applying a no-comments slice**

- **Contributing findings:** J1, T1, D1.
- **Principle:** Failed inventory attempts do not complete the prerequisite; retrospective reconstruction cannot establish that classification used the required inventory.
- **Observed failure:** `docs/verification/node-8/probe-transcript.jsonl:9` records a formatter crash; line 12 records a runner failure with empty stdout. Line 14 records removal. The first successful inventory of the original source appears at line 23, after removal and final checks.
- **Evidence boundary:** Line 23 identifies exactly the two removed comment ranges. `how-check.md`, the original tests and the mutation failure at transcript line 13 support the encode decision; the before/after source preserves executable statements. No missed comment or incorrect removal is demonstrated.
- **Structural mechanism and target:** Add a staged slice runner for the inventory-to-apply transition in `skills/no-comments/SKILL.md`, Steps 1–3. Before permitting its apply stage, require a persisted manifest containing the original source hash, declared file scope and successfully parsed unsuppressed ESLint JSON. Validate expected file coverage, zero fatal diagnostics and no suppressed comment hits. Accept ESLint exit 1 when valid JSON contains ordinary comment violations; reject runner/formatter failures, missing or invalid JSON and scope mismatches. Tie classifications to the captured ranges. Record stage order so a reconstructed inventory cannot retroactively validate an earlier apply event. This guards the mediated workflow; arbitrary edits outside it would require a separate audit gate.
- **Failing-before/passing-after probes:** Using `before-messages.js` and `before-eslint.config.mjs`, valid inventory must expose original lines 2 and 5 and unlock classification despite exit 1. Replay the formatter crash and empty-output runner failure: both must leave apply blocked. Also reject fatal diagnostics, wrong-file results, a changed source hash and an apply event preceding inventory. After successful capture, complete classification and remove the two ranges; the existing tests must pass, while replacing `messages.slice()` with `messages` must still fail both batch assertions.
- **Routing:** Structural enforcement of the existing prerequisite; no duplicate skill-body rule.
- **Status:** proposed — not filed.
