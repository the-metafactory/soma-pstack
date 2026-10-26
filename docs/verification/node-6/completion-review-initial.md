**Reviewer identity:** Claude Sonnet 5.5 (`claude-sonnet-5-5`). I only read the authorized files and ran no commands.

**Verdict: concerns.** No critical issue blocks node #6. The skill itself looks fine. The weaknesses are in how the live probe is evidenced and in a few rung and stop-reason claims.

## Direct answers

**1. Does the skill keep graded evidence without unavailable skills? Yes.**
- `SKILL.md:10-22` has the five-rung table, and `:24-31` has six steps. Per-fact reporting is required at `:36` as `Fact | Rung | Evidence | Why stopped / remaining gap`.
- It names no other skill. The only redirect is generic wording ("a mechanics or history investigation", `:3`). Step 6 (`:31`) says to use "authorized review tools" and to report missing coverage if they are unavailable.
- I could not check fidelity to upstream. The pinned upstream file is not in my authorized set. `docs/verification/node-6/README.md:7-9` ("preserved") and the "unavailable why/arena/unslop" rationale (root-transcript-excerpt, LINE 110 and the VSA changelog) are the root agent's assertions to me.

**2. Does the PR probe show actual skill use and per-fact evidence? Per-fact evidence is strong. Actual skill use is only indirectly supported.**
- The executed evidence is real and matches the saved output. `live-transcript.txt:148-202` shows 42 pass, 0 fail. `:220-257` shows the base failing at `bun:ffi`. `:259-307` shows the head loading 3 extensions with `tool_call` registered. `:311-331` shows the CLI exiting 1 on the base and 0 on the head.
- The PR body's claims were not the evidence. The base failure was reproduced independently.
- Nothing I was given shows the independent agent reading or following the skill.
  - The `spawn_agent` and `send_message` payloads are opaque (excerpt LINE 101, 168).
  - The subagent's own trace is absent.
  - The report format matches the skill's handback format and its "retrospective follow-ups" label. That is consistent with skill use but does not prove it.
- Independence from the author's facts is unverified. The root agent had already described the transitive `bun:ffi` mechanism (excerpt LINE 73). It also named the F1/F2-shaped facts mid-run (LINE 152). The README claim "without the author's proposed safety facts" (`README.md:13-14`) cannot be checked against the hidden prompt.

**3. Do the rungs overstate what ran? Mildly, in places.**
- **F1 (rung 5).**
  - The rung-5 evidence is startup and RPC responsiveness only (`live-report.md:15,53`). That part is disclosed.
  - The path guard's `tool_call` hook registration is shown only by the Node loader probe (`live-transcript.txt:283-289`), which is rung 4. The CLI output (`:329`) lists only the `soma` and `algorithm` commands and shows nothing about the path guard.
  - The CLI probe passes explicit `-e` paths with `--no-extensions` (`pi-cli-probe.py:12-13`). It does not use pi's normal discovery from an installed home. A single "rung 5" for the whole fact, including the hook, is generous.
- **F6 (rung 4).**
  - The guard test was run only on the head. Showing it goes red on the base was cheap: copy it into `before/` and run it. This is the skill's own "where cheap" rule (`SKILL.md:30`).
  - The report cites the F1 probes as the base-detection evidence (`live-report.md:20`). That evidence belongs to F1, not to the guard test.
- **F2 (rung 4).** It is bounded honestly, and the unchanged `dir-lock.ts` blob hash is strong. I could not see the test bodies. The "separate descriptors in one process" and "reread inside the critical section" claims (`live-report.md:16,26`) have no saved excerpt.
- **F3 and F4 (rung 2).** The stop reason is a scope instruction ("parent task's targeted-test boundary", `live-report.md:17,18`), not a cost.
  - `tsc --noEmit` would have decided F3 more strongly than `rg` over `src test` only.
  - The boundaries test is a cheap check for F4.
  - Step 5 asks for "concrete cost, missing prerequisite or permission" (`SKILL.md:30`).
- **F5 (rung 1).** This is honest.

## Supported findings

1. **"Two commits" has no backing in the transcript.** `live-report.md:3` says the metadata showed two commits. The only metadata command requests `title,body,mergedAt,baseRefOid,headRefOid,mergeCommit,comments,reviews` (`live-transcript.txt:129`, `run_live.py:21`). It has no commits field, and step 1 (`SKILL.md:26`) says to read commits.
2. **The transcript did not come verbatim from the checked-in script.**
   - `live-transcript.txt:9` uses `git show --format=short`. `run_live.py:20` uses `--format=%H%n%s`.
   - Transcript commands at `:335`, `:341` and `:354` (blob `rev-parse`, `rg`, version reads) are not in `run_live.py:15-33`.
   - So `README.md:20-21` ("probe scripts preserve the checks that ran") overstates. The F2 blob check and the F3 search cannot be rerun from the scripts.
   - The author redaction is disclosed (`live-report.md:79`). The command mismatch is not.
3. **Base and head share dependencies.** `run_live.py:25` compares only `after/bun.lock`. `:26-28` symlinks the same `node_modules` into both trees. The report says only that the head lockfile matched (`live-report.md:24`). Base dependency equality is unstated.
4. **Several claims have no saved artifact.** These are the pi loader source reading (`live-report.md:24`, `loader.js:462-578`), the `finally`-close timing (`:26`), and the `src/policy/policy-path-guard.ts:4` and `path-guard.ts:179` pointers. A reader would have to rerun the inspection to confirm them.
5. **Trail rows are written without a check.** In the excerpt (LINE 135), the `log.sh` calls ran in the same script as the readback, with no conditional. Rows 5 and 6 of `decisions.tsv` ("validated", "verified") would have been written even if the checks had failed. They happened to pass. The `exit 0` claims for `arc validate` and `quick_validate` (`README.md:31-33`) were inferred from grouped command chunks (excerpt LINE 110, 131) and not captured per command.
6. **Invocation policy forks by substrate.** Upstream's `disable-model-invocation` was dropped from frontmatter. It is carried only in `agents/openai.yaml:2`. `README.md:8-9,45-46` discloses that other substrates keep their own behavior and that Codex enforcement was not tested. The description (`SKILL.md:3`) also lists trigger phrases, which invite auto-invocation elsewhere.
7. **Manifest capabilities are broad.** `skills/blast-radius/arc-manifest.yaml:15-27` grants `write: ./**` and `bash: allowed: true`. The skill itself calls for read-only assessment on disposable state (`SKILL.md:30`). Only the two GitHub hosts are listed for network.
8. **`check-pack` was run twice.** The first run's completion was lost (excerpt LINE 138, 143). The repeat is disclosed (`README.md:36-38`, `trail-audit.md:5`). That test uses fixtures (`pack-targeted-tests.txt`), so it does not show the real pack accepts the new member.

## Unsupported speculation (not findings)

- `pi-cli-probe.py:18` writes to stdin before the process has necessarily started. On the base, a `BrokenPipeError` race is conceivable. It passed here.
- The first, uncaptured `check-pack` run may have overlapped the second. `pgrep` failed (`sysmond` error, excerpt LINE 147), so this is unknowable.
- Whether the independent agent saw the author's candidate facts is unknown, because the prompt is encrypted.
- Whether `allow_implicit_invocation: false` is honored in Codex is untested.

## What the principal should look at

- **Skill-use evidence.** Get the subagent's prompt and trace, or accept that skill use is inferred from the report format. This is the largest audit gap against the acceptance line "actual skill use".
- **Cheap rung gaps.** Ask for the guard test on the base tree, `tsc`, and the boundaries test. Or accept F3, F4 and F6 as rung 2, 2 and 4 with scope-based stop reasons.
- **F1 wording.** It should read "reproduced at pi startup with explicit `-e` extensions, offline, on the host. Path-guard hook registration shown at loader level. No tool call or model-backed run."
- **Fork decisions.** Accept or reject the invocation-policy fork and the broad capabilities.
- **Final gate.** It is pending, not faked. `pack-gate.txt` is referenced (`README.md:51`) but does not exist yet, and the gate should be rerun after any wording edits.

**Keeping the scopes separate.** The report mostly does this: `live-report.md:53` says startup, not a model-backed run, and `:15` limits it to synthetic homes. The one place the scopes blur is F1's single "rung 5" label.
