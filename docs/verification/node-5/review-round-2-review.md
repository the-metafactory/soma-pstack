# Independent review of round-two repair and decision trail

I read only the supplied text. I could not run anything. The extract starts at source line 91, so the baseline run, setup forks and capability-gate refusal (lines 16–87) are not in front of me.

## Finding 1: duplicate JSONL parsing

**Verdict: the diff is a faithful, behavior-preserving extraction.**

- The helper body matches the removed inline expression exactly. The `events` → `transcriptEvents` rename avoids shadowing the new import.
- `readFileSync` is still used in both the probe and the test, so no import was orphaned.
- The post-change run (12 pass, 43 assertions, source line 118) is visible and shows exit 0.

**Weak points**
- The "before" baseline (source lines 54–60) is claimed in `review-round-2.md` and in row 26 ("before and after"). I could not inspect it. The identical 12/43 counts are consistent but not proof.
- `events` is only tested indirectly, through the scratch test. Its edge cases are unpinned: an empty file, which makes `JSON.parse("")` throw, and blank interior lines.
- The probe's pointer check (`transcriptEvents[n-1]`) assumes line number equals array index. It never compares the recorded `line` field to the index.
- Bun does not typecheck, and no `tsc` run is recorded. `events` returns `any[]`, so a type regression would pass unnoticed.

## Finding 2: manifest redaction assertion

**Verdict: the wording fix is correct and honest, but it is only a wording fix.**

- Both `reason` strings no longer say "redacted". The diff confirms exactly two lines changed.
- `SKILL.md` still requires redaction before hand-off. That is a procedural obligation, not a mechanism.
- The only evidence of an actual check is the scan at source line 131:
  - It tests five credential regexes (private-key header, `sk-`, `ghp_`/`github_pat_`, `AKIA`, Bearer).
  - It runs before egress and asserts, so it is correctly ordered. That is better than round 1, where the scan was retrospective.
  - It would miss other secret shapes, such as JWTs, Slack or Google tokens, and passwords in URLs.
  - It says nothing about non-credential disclosure. The payload contains absolute home paths, a username and session IDs.
- No test guards the manifest wording. `arc validate` only checks schema validity, so it would not catch the word "redacted" returning.
- The egress itself, meaning which tool, flags and payload were actually sent, is not in this pack. I can only see that a scan ran.

## Finding 3: row-11 enforcement claim

**Verdict: the supersession is correctly formed and appropriately hedged.**

- Counting the header as row 1, row 11 is the `capabilities` row at 20:37:59Z, and row 24 targets it with the exact timestamp. The pointer is correct.
- The original bytes are preserved, as the append-only rule requires.
- "No runtime enforcement was tested" is an honest absence claim. It rests on no test existing rather than on a check that none could exist.
- Row 24's evidence pointer is the manifest. That supports only "declares broad globs and hosts", not the claim that nothing enforces them.
- The tension remains: `SKILL.md` says "never glob across other projects", while the manifest declares `~/.claude/projects/**` and similar. Row 24 and the doc acknowledge this, but nothing resolves it.

## Wider risks the principal should see

1. **Supersession pointers are hand-typed and unvalidated.**
   - Row 19 carried a wrong timestamp, which row 20 had to correct.
   - Second-granularity timestamps are ambiguous. Rows 3–5 share 20:28:31Z in the committed trail, and the fresh scratch trail has the same collision. A `supersedes row N (ts)` pointer cannot distinguish them, so the row number is the only real discriminator.
2. **The audit is largely self-referential.**
   - The probe generates its own transcript and the audit text is hard-coded.
   - "Every evidence pointer resolves" means only that the index exists. It does not check that the event supports the claim.
   - The probe's closing disclaimer states this limit.
3. **The final audit row's byte-preservation claim was not re-verified.**
   - The 5241-byte check ran at lines 111–118, before rows 26 and 27 were appended.
   - Row 27 repeats "prior 5241 bytes preserved" without a post-append recheck.
   - Append-only logic makes this likely true, but it was not re-checked.
   - The `16aa34b` commit reference in the doc is not shown being resolved in the extract. Only `HEAD:` was used.
4. **The capability gate was satisfied ceremonially.**
   - The `sequential-analysis` capability was selected because the phase gate refused to advance without one.
   - It is then recorded as "[invoked]" with a reasoning summary.
   - The summary is plausible, since the files were read at lines 45–50, but the invocation exists to unblock the gate. The doc discloses this, though the TSV does not.
5. **Not reviewed.** The full pack gate and final commit follow this review, and I make no claim about them. The review row and the final audit row do not yet exist.

## Attention

reviewed by claude-sonnet-5-5

- **Row 24 / `arc-manifest.yaml`:** the "redacted" wording is gone, but the only redaction evidence is a five-pattern scan (source line 131). Home paths and session IDs were also sent. The review reached a remote service under a pattern-scan guarantee only.
- **Rows 3–5, 14, 19–20:** timestamp-based supersession pointers collide within a second and are hand-typed, and one has already been mistyped. Treat the row number as authoritative.
- **Row 27 / `review-round-2.md`:** the "5241 bytes preserved" claim was last verified before rows 26–27 were appended. Re-verify after the final commit.
- **Source lines 54–60 and 16–87:** the baseline test run, setup fallback and gate-refusal forks are asserted by the audit but were not in my material.
- **`events` helper:** no direct test and no typecheck. Behavior parity rests on the 12 indirect tests.
- **Capability row in the Algorithm run:** "invoked" was recorded to satisfy a gate, not as independent analysis.
- **Access constraint:** the manifest globs are broad and nothing enforces exact-session reads. Row 24 says so, but the principal should not assume otherwise.
