**Reviewer identity:** Claude Sonnet 5.5 (`claude-sonnet-5-5`). I read only the named files and ran no commands.

**Verdict: pass.** I see no material blocker for node #6. The rungs now match what ran, the skill was actually used, and the evidence reproduces. The items below are small and none of them invalidates a stated fact.

## Earlier concerns, re-audited

- **F1 and F7 split: resolved.**
  - F1 is rung 5 and scoped to explicit `-e` paths, offline, startup and RPC only (`live-report.md:15`).
  - The hook claim is separate at rung 4 (`live-report.md:21`).
  - The loader output shows `tool_call` on the path guard (`replay-transcript.txt:300-303`).
  - The CLI output (`replay-transcript.txt:329-331`) never mentions the path guard, and the report doesn't claim it does.
- **Skill use: resolved, with a stated limit.**
  - The worker's first action was `cat SKILL.md`, with a recorded exit 0 (`invocation-provenance.md:25-31`).
  - The inherited-context limit is explicit (`:54-64`, `README.md:13-15`).
- **F6 base failure: resolved.** The inherited guard test, copied into `before/`, fails on the `dir-lock.ts -> bun:ffi` edge (`additional-checks.txt:42-60`, exit 1 as expected).
- **F3 and F4: resolved.**
  - F3 is narrowed to the exercised caller, with the `rg` output saved.
  - F4's focused test passes: 1 pass, 47 filtered (`additional-checks.txt:24-36`).
- **Two commits, base lockfile and blobs: resolved.**
  - `replay-transcript.txt:128` shows both commits.
  - The lockfile `cmp` checks cover repo against head and base against head (`:142-148`).
  - The blob hashes match (`additional-checks.txt:4-7`).
- **Runner and transcript mismatch: resolved.** `git show --format=%H%n%s` in `replay-transcript.txt:9` now matches `run_live.py:20`. The extra checks live in `additional-checks.py`. The original exploratory transcript is disclosed as separate.
- **Pipe-reader bug:** `pi-cli-probe.py:23-35` now uses `os.read` plus manual line splitting. The final replay is 42 pass, 2 pass, and both loader and CLI probes pass.
- **Validator exit codes:** `member-checks.txt:1-7` captures them per command.
- **Skill fidelity to upstream:** I compared against the upstream file. All five rungs and all six steps are kept. Replacing `why`, `arena` and `unslop` with portable wording is reasonable, and the added "higher number doesn't erase a gap" rule is consistent with the skill's intent.

## Remaining supported issues (all minor, none a blocker)

1. **Redaction claim is inaccurate.**
   - `live-report.md:80` says the transcript omits a personal author identity.
   - `replay-transcript.txt:128` embeds the full `gh pr view` JSON, including `[redacted commit-author email]`.
   - `run_live.py:22` writes the same JSON to `pr-metadata.json`, which `live-report.md:67` says to retain.
   - Either redact those fields or correct the sentence. This is the most concrete one.
2. **Projection readback method is not saved.**
   - `member-checks.txt:9-15` holds only `MATCH` lines. The `soma init --apply` and `soma project-skill` commands, their exits, and the comparison script aren't captured, and the `MATCH` lines carry no root paths.
   - The README says "fresh readback comparisons" (`README.md:56-58`). Either save the script or command, or soften that wording.
3. **Skill-read provenance is for a pre-final revision.**
   - `invocation-provenance.md:52` says the frontmatter changed after the worker's read.
   - Nothing shows the body is otherwise identical. The final `SKILL.md:43` has a Source footer, and I can't tell from the excerpt whether the worker saw it.
   - A one-line hash comparison, or a statement of exactly what differs, would close this. It is bounded coverage, not a failure.
4. **Capability declarations are not disclosed in the named files.** You say they are disclosed. I found only the invocation-policy difference (`README.md:8-9,45-46`). Nothing there mentions `write: ./**` or `bash` from `arc-manifest.yaml`. If the disclosure sits elsewhere, point to it. Otherwise add one sentence.
5. **A few report facts lack saved artifacts.**
   - **Alias claim:** the "older `@mariozechner` alias" claim (`live-report.md:25`) isn't in the cited `loader.js:462-578` excerpt. Only `getAliases()` is called, at `:479`. That branch is also the unbundled one, while the CLI probe runs the bundled CLI.
   - **Dependency versions:** the jiti, yaml and zod versions (`live-report.md:25`) aren't evidenced in any named file.
   - **Test lines:** the `test/goal-accept.test.ts:243-250` pointer for the CLI happy path isn't in the saved excerpt (`additional-checks.txt` covers lines 190-218).
   - Drop these claims or add excerpts.
6. **F4 stop reason is slightly generous.**
   - The focused test asserts the `publicEntries` declaration and that `types.ts` reaches nothing outside core (per the diff, `live-transcript` PR diff).
   - The "no violations" check on the `flows → core/dir-lock` edge is a different assertion. "Other boundary tests were not needed" (`live-report.md:18`) is arguable.
   - The fact is worded narrowly enough to stand. Keep it as bounded coverage, or run the repo-wide no-violation boundary test.
7. **Reproduction recipe is incomplete for the supplemental script.**
   - `additional-checks.py` isn't in the retain list (`live-report.md:67`) or the run steps (`:69-78`).
   - It also needs `rg` on PATH, `SOMA_REPO` and `PI_PACKAGE_DIR` set, and the `node_modules` symlinks that `run_live.py:27-29` creates. Add one line to the recipe.
8. **Pending housekeeping.**
   - `README.md:53` links `pack-gate.txt`, which doesn't exist yet.
   - After the gate runs, update the "had run at the time of audit" tense (`README.md:60-61`) and re-check that no wording edits invalidate the earlier evidence.

## Bounded coverage (explicit, no action needed)

- F5 stays rung 1.
- There was no cross-process or Linux run, and no model-backed pi turn.
- The guard's static-scan exclusions are stated.
- Concurrency tests use one process.
- The two `check-pack.test.ts` runs are fixture tests, not the pack gate.
- I could not read `node-loader-probe.mjs`, `project-fixtures.test.ts.txt`, `live-transcript.txt`, `pr-metadata.json`, `replay-failed.txt` or `pack-targeted-tests.txt`, because they weren't in my named set. I judged the F7 assertion only from the transcript's PASS lines.

## Author disposition of minor notes

Commit-author fields are now removed by the gh query itself; the final runner was replayed after that change. The projection commands, exits and comparison script are saved. Invocation provenance includes an operating-body comparison. Capability declarations are explicitly described in README. Unsupported alias/dependency-version and CLI-test-source claims were dropped; F4 is bounded to its actual declaration check. The reproduction recipe includes the supplemental script and rg prerequisite. Full pack gate follows this pass and is captured separately.
