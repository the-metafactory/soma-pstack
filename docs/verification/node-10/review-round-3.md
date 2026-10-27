**Verdict: concerns**

The port is faithful in structure and mostly honest in its qualifications. Several published claims are stronger than the evidence, and some evidence predates this revision.

**Findings**

1. **Medium: the "three independent lenses" probe supports less than README claims.**
   - `probe-provenance.json` shows the lens and synthesizer spawn messages are "encrypted at rest", so prompt isolation is not inspectable. The only readbacks are from a later re-run (sourceLine 403–407).
   - Model is `null` and unknown for every call. The node-10 README discloses this, but it still labels the calls "independent" with no cross-model corroboration.
   - The same-session scripted transcript also lets all three lenses converge on one finding (B1). That convergence is weak evidence of independence.

2. **Medium: the approval boundary is procedural only, and the probe covers only the unapproved path.**
   - `skills/reflect/SKILL.md` §5 and the README say so.
   - `approval-probe.json` shows hashes unchanged after one synthetic Accepted row, but it uses a single scenario and a single model run.
   - No approved-edit path is tested. This is disclosed, but ISC-6 is checked off without that qualification.

3. **Medium: invocation guard lost, and it has no machine enforcement outside Codex.**
   - Upstream `disable-model-invocation: true` is dropped. `agents/openai.yaml` and `test/reflect.test.ts` pin only Codex.
   - The loss is disclosed. The claim that Soma "projects it unchanged" rests on author inspection of the projector. `projection.jsonl` shows the files match but cannot show the flag's absence from the projector code.
   - Only the description text guards the other six substrates.

4. **Low–Medium: the B1 backlog sequencing claim is overstated.**
   - Transcript lines 9, 12, 14 and 23 are cited, but the node-8 transcript shows the removal decision was made after a how-check. The "inventory not completed first" reading rests on the lenses' interpretation.
   - `backlog.md` concedes the agent knew of the comments, so the proposal is a gating idea, not a demonstrated failure.
   - The target files `slice.ts` and its test do not exist (disclosed).

5. **Low: "prompts rewritten" versus the source-fidelity claim.**
   - Reviewer prompts are substantially rewritten, not verbatim. Upstream's `<ABSOLUTE_PATH>` and digest templates, the MCP lookup guidance, the 60/40 style examples and the file-the-backlog-without-waiting behavior are all changed or dropped.
   - The SKILL.md source line and the README disclose this. The pin covers the upstream files, but fidelity is partial and unverifiable here because the upstream diff was not run.

6. **Low: manifest access exceeds the declared "exact-session" scope.**
   - `arc-manifest.yaml` grants read on whole session stores for four substrates, plus `write: ./**`.
   - The SKILL.md restriction to the exact session is prose only (disclosed).
   - `api.github.com` is declared for backlog filing, which the skill otherwise forbids unless externally authorized.

7. **Low: evidence from this revision is pending or unreproduced.**
   - Claimed passes (`finish-checks.json`, the refreshed `projection.jsonl`, 2 tests, `check-pack` with 10 members) are asserted but `finish-checks.json` and `pack-check.txt` were not supplied.
   - The final pack gate and commit are pending, as stated. `README.md` and `finish-pass.md` say the earlier host gate describes the original implementation.
   - `test/reflect_review_test.py` mocks `subprocess`, so it checks the runner's plumbing and no real audit.

8. **Low: reviewer routing is thin on portability.**
   - The "inherit default, record the model" rule is clear, but the sequential-fallback and "report incomplete" branches were never exercised.
   - The skill says "authenticated model-CLI call", yet `review.py` hard-codes the `claude` CLI and the `sonnet` alias. That is audit tooling, not the skill, but it ties the verification to one vendor.

**Attention list for principal**
- Decide whether to accept the Codex-only machine guard, or ask Soma for a projector flag capability.
- The "independent lenses" label has weak support: the probe cannot show model diversity or prompt isolation.
- The approved-edit path and missing-reviewer fallback remain untested.
- Check the final gate output and clean-status commit once they exist. Nothing here verifies them.
- Treat the B1 backlog as a hypothesis until triaged.

**Unsupported suspicions** (not findings)
- The synthesizer may have seen more than the three outputs. The readback is not available to check this.
- The round-2 steering may have affected the dispositions of F1 and F8 beyond the disclosed caveat. Round 3 omits those disclosures, so the effect cannot be assessed here.
- Whether the actual projectors handle `agents/openai.yaml` identically across substrates is not shown.
