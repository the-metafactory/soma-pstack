# Independent blast-radius invocation: merged Soma PR #1076

Applied the new `blast-radius` skill to [Soma PR #1076](https://github.com/the-metafactory/soma/pull/1076) on 2026-10-26. This assessment independently ran source and application code; the PR body's verification claims were treated as intent only. Read-only metadata showed two commits, a merged result, and no comments or reviews.

Base: `a59fc622116df0a50c3761a4d3f252a240958de1` (first parent). Assessed head: merge `4d6a775f1667f3d0b6c7f66724411ab667ed5c07`; original PR head was `e668c94a5da658857a835c39179228efa2f67cb8`. All source pointers below are relative to the assessed head unless explicitly marked base.

The change removes the `dir-lock` re-export from the core barrel, moves the goal-acceptance consumer to a direct import, declares that file a separate core public entry, and adds a static pi-extension import guard. The non-obvious effect is that Node no longer eagerly evaluates `bun:ffi` when loading extensions through that barrel. Independently, both the path-guard and Algorithm extensions failed on the base, while all three projected extensions loaded on the head.

## The facts safety depends on

The first two facts clear most immediate failure mechanisms. A rung applies only to the bounded fact and path described here, not the entire PR.

| Fact | Rung reached | Evidence | Why stopped / remaining gap |
| --- | --- | --- | --- |
| **F1. The projected pi extensions can initialize in the running pi CLI without loading `bun:ffi` through the core barrel.** If false, pi cannot start with those extensions. | **5 — running application reproduction** (explicit `-e` extension paths, offline) | Head `src/core/index.ts:19`; `src/policy/policy-path-guard.ts:4`; `src/substrates/adapters/pi-dev/path-guard.ts:179`. `node-loader-probe.mjs` calls the installed pi loader, asserts zero head errors and three loaded extensions. Hook registration is separately graded under F7. `pi-cli-probe.py` starts the actual bundled pi CLI offline with unmodified projected extension bytes: the base exits 1 at `bun:ffi`, the head responds successfully to RPC `get_state` and `get_commands`, exposes `algorithm`, and exits 0. Actual output below and in `live-transcript.txt`. | Reproduced initialization and session start with synthetic homes; no inference request or destructive tool execution. Future dynamic paths and other Node/pi versions remain outside this fact. A model-backed tool-using session would need a configured provider and is unnecessary to discriminate this startup failure. |
| **F2. Goal acceptance retains the existing lock implementation, exception identity, exclusion and release behavior after switching imports.** If false, concurrent acceptance can allocate duplicate goals or fail to translate a busy lock. | **4 — real implementation tests** | Head `src/flows/goal-accept.ts:7,129-135`; `src/core/dir-lock.ts:1,7,11-15,23-29`. Base and head `dir-lock.ts` have identical Git blob `eee6f5d8f8589058d2f4e69a199f60162ddac40d`. The targeted tests exercise actual Bun FFI/OS locks: `test/goal-accept.test.ts:193-216` asserts one successful concurrent acceptance, rejection under an already held lock, unchanged proposal, and successful acceptance after release. | Concurrency tests use separate descriptors in one process, not simultaneous CLI processes. No cross-process race campaign or Linux libc run was performed; the lock code is unchanged and this invocation was bounded to PR-specific probes. |
| F3. The known goal-acceptance caller still reaches the lock implementation through the direct entry. | 4 — the caller executes in the real-code tests under F2; bounded search supplements it | `rg -n 'LockBusyError\|withExclusiveLock' src test` finds the direct production import in `src/flows/goal-accept.ts:7` and the direct test import in `test/goal-accept.test.ts:7`, plus definitions/uses. Recorded output is in the transcript. | This search does not prove absence of computed property access, reflection, generated callers, or consumers outside these source/test trees. A full typecheck would inspect unrelated modules and still would not inventory out-of-tree or reflective consumers. The named caller is exercised under F2; no source-text test was added for the literal import spelling. Broader compatibility remains unproven under F5. |
| F4. The new direct core entry is accepted by the focused component-manifest boundary check. | 4 — focused real repository boundary test | `src/components.ts:63` includes `src/core/dir-lock.ts`; `test/boundaries.test.ts:286-289` updates the expected declaration. | The initial worker stopped at source inspection. The author then ran the focused core shared-entry test: 1 pass, 47 filtered out, 0 fail; see additional-checks.txt. No broader flows/core boundary behavior is claimed; that dedicated boundary test is the next check if this fact is expanded. |
| F5. No external source consumer relies on the removed core-barrel exports. | **1 — unproven** | No external consumer inventory was available in these snapshots. `package.json:4` declares the package private, but that does not prevent another local source consumer. | Repository grep cannot settle this. An out-of-tree consumer would get a missing named export or an undefined lock function. Search the actual installation/workspace consumer set before relying on this broader claim. |
| F6. The added guard passes for the current fixture's statically reachable local TypeScript module graph. | 4 — inherited PR test executed independently | `test/pi-dev-extension-imports.test.ts:12-40`; the targeted run includes this test and passed. The independent loader and CLI probes also establish that the original bad case exists at the base and disappears at the head. | This is not a universal Node-compatibility guarantee. The scanner skips dynamic imports (`:24`), bare-package traversal (`:26`), unresolved paths (`:28`) and non-`.ts` resolution candidates (`:14`), and does not inspect runtime `Bun` globals. The author additionally copied only the inherited test into the base snapshot and ran it: it failed with the expected dir-lock.ts → bun:ffi edge. additional-checks.txt preserves the actual assertion failure; the temporary test file was removed afterward. |
| **F7. The path guard registers its `tool_call` handler when loaded.** | **4 — real pi loader assertion** | node-loader-probe.mjs loads the exact projected extension and asserts the registered handler; the passing output is in both execution transcripts. | The offline CLI commands do not expose that hook, so its registration is not claimed at rung 5. A tool event would require a separate controlled app interaction. |

## Where grep stops

**Library/runtime boundary.** Inspected the installed pi 1.4.0 loader source at `dist/core/extensions/loader.js:462-484,510-578`: it creates jiti with `moduleCache: false`, imports the extension module, invokes its factory, and collects failures. The actual bundled CLI was exercised separately, so the source inspection is not substituted for application evidence. Runtime: Node `v24.19.0`, Bun `1.4.2`, pi `1.4.0`. The installed Soma dependency lockfile compared byte-identical to the head's `bun.lock`, and base/head lockfiles share blob `c8ce14fb04306a1a641f3ec44baf640be2cc6cae` (additional-checks.txt).

**Timing.** The FFI failure is module initialization, before extension factories can finish and register hooks. No tool call is required to trigger it. At the lock boundary, `withExclusiveLock` obtains a nonblocking native lock before calling the callback, awaits the callback, then closes the descriptor in `finally`. Goal acceptance rereads the proposal inside that critical section before writing it. The held-lock and concurrent-acceptance tests exercise those orderings; cross-process death/recovery remains untested here.

**Formats.** Generated extension source uses `file://` references into the corresponding exact source snapshot (`path-guard.ts:179,183`). Those bytes were written unchanged and loaded by Node/jiti, rather than resolved only by grep. The goal acceptance tests exercise actual YAML proposal/staged-activation data and CLI stdout. The independently issued pi RPC requests and returned JSON records are captured below. No database columns or other-language wire consumer changed in this six-file diff.

## Actual execution evidence

`live-transcript.txt` records commands, working directories, actual stdout/stderr and exit statuses. Relevant output excerpts:

```text
42 pass
0 fail
122 expect() calls
Ran 42 tests across 2 files.

PASS: base fails actual pi loader at bun:ffi
PASS: head loads all 3 projected extensions; path guard tool_call registered

STDERR Error: Failed to load extension ".../soma-path-guard.ts": Failed to load extension: Cannot find module 'bun:ffi'
STDERR Error: Failed to load extension ".../soma-algorithm.ts": Failed to load extension: Cannot find module 'bun:ffi'
CLI_EXIT 1
PASS: offline running pi app rejects base projection at bun:ffi

STDOUT {"id":"probe-commands","type":"response","command":"get_commands","success":true,"data":{"commands":[{"name":"soma","description":"Show Soma profile, lifecycle context, and PAI import pointers","source":"extension","sourceInfo":{"path":"/tmp/soma-pstack-node-6/projections/after/agent/extensions/soma.ts","source":"cli","scope":"temporary","origin":"top-level"}},{"name":"algorithm","description":"Start a Soma Algorithm run rendered as persistent widgets","source":"extension","sourceInfo":{"path":"/tmp/soma-pstack-node-6/projections/after/agent/extensions/soma-algorithm.ts","source":"cli","scope":"temporary","origin":"top-level"}}]}}
CLI_EXIT 0
PASS: offline running pi app starts with head extensions and exposes algorithm command
```

The separate projection fixture tests passed 2/2. The CLI reported an `unknown` model in its synthetic offline state; no inference request was made and no provider credentials were supplied. The CLI reproduction therefore proves startup, registration and RPC responsiveness, not a model-backed tool-using run.

## Risks, cleared paths and retrospective follow-ups

- **Confirmed base failure, cleared on the assessed head:** eager loading of `dir-lock.ts` caused two extensions to fail initialization. Likelihood was deterministic in the base probe, impact was rejected pi startup, and the same probes succeeded on the head. This is bounded to the recorded versions, extension bytes and synthetic setup.
- **External consumer compatibility remains unknown:** the removed exports can break an out-of-tree source importer. Likelihood is unknown because no external consumer inventory was inspected; impact is failure to import or run that caller. Cheapest check: search actual consumers for both named imports and namespace/property use and run any found caller.
- **The new guard has confirmed coverage limits:** the exclusions at `test/pi-dev-extension-imports.test.ts:14,24,26,28` mean a future dynamic, package, JavaScript or Bun-global dependency can evade it. Likelihood depends on a future change adding such a path; impact is recurrence of startup or invocation failure. Cheapest discriminating check is a controlled fixture for each intended import category, followed by the saved real-loader probe. This does not negate the reproduced current repair.
- **Component-policy and host scope remain bounded:** the focused core-entry boundary test passed after audit, while Linux/other pi versions were not exercised. If those hosts are supported, the next useful checks are the same loader/lock probes there. This is a merged PR, so these are retrospective follow-ups, not new merge gates.

No whole-change confidence score or merge approval is asserted. F1 is reproduced, F2 is tested within stated bounds, and F5 remains unproven.

## Reproduction recipe and required artifacts

Retain this report, `live-transcript.txt`, `pr-metadata.json`, `run_live.py`, `additional-checks.py`, `project-fixtures.test.ts.txt`, `node-loader-probe.mjs` and `pi-cli-probe.py`. Large source snapshots, dependency trees, generated projections and synthetic homes need not be committed. All scripts locate `before/` and `after/` relative to their own directory. `SOMA_REPO` names a local read-only Soma checkout containing both Git objects and a matching installed dependency tree. `PI_PACKAGE_DIR` names an installed pi-coding-agent package; the recorded installation was `@earendil-works/pi-coding-agent` 1.4.0. The scripts need its `dist/core/extensions/loader.js` and `dist/bundle/cli.js`. Git, gh (read-only PR access), rg, Python 3, Bun and Node must be available on PATH.

Copy the scripts into a fresh scratch directory, restoring `project-fixtures.test.ts.txt` to `project-fixtures.test.ts`, then run there:

```sh
export SOMA_REPO=/path/to/soma
export PI_PACKAGE_DIR=/path/to/node_modules/@earendil-works/pi-coding-agent
mkdir before after
git -C "$SOMA_REPO" archive a59fc622116df0a50c3761a4d3f252a240958de1 | tar -x -C before
git -C "$SOMA_REPO" archive 4d6a775f1667f3d0b6c7f66724411ab667ed5c07 | tar -x -C after
python3 run_live.py
python3 additional-checks.py
```

The runner checks the repository's `bun.lock` against `after/bun.lock` before creating scratch-only `node_modules` symlinks, runs only the two named PR test files, generates projected fixtures and executes both loader and offline CLI probes at both revisions. It overwrites its own transcript on rerun. No existing repository, graph, branch, deployment or user pi home is mutated. The original transcript redacts the git-show author identity. The final runner removes commit-author fields at the gh query boundary; synthetic fixture values are retained.

## Author replay after the independent invocation

The author reran the final portable runner on the same exact snapshots. Its first replay exposed a harness bug: Python text-stream buffering could retain the second RPC reply while `selectors` waited on the descriptor, causing a timeout despite Pi responding. [replay-failed.txt](replay-failed.txt) preserves that failed run. The saved `pi-cli-probe.py` now reads raw pipe chunks and splits complete JSON lines, preventing that buffering mismatch. The final full runner replay exited 0: 42 PR tests, two projection fixture tests, both actual-loader probes and both offline CLI probes passed. [replay-transcript.txt](replay-transcript.txt) contains the final script execution; the original independent invocation remains in [live-transcript.txt](live-transcript.txt). The scripts therefore reflect the corrected, executed reader, rather than the harness that timed out. No production code was changed.

## Audit-driven evidence refinements

[invocation-provenance.md](invocation-provenance.md) records the worker task and first skill-read evidence. The worker inherited the selected PR and startup/FFI premise through its parent fork. This demonstrates skill use and separate execution; it is not a blind discovery evaluation.

[additional-checks.py](additional-checks.py) and [additional-checks.txt](additional-checks.txt) save the missing blob checks, caller search, focused core boundary pass, intended base guard failure and revision-qualified source excerpts (including the real pi loader and lock timing). The final runner additionally captures the PR commits field and checks both snapshot lockfiles. Two commits are now directly visible in pr-metadata.json. The original transcript includes exploratory commands beyond the runner and a redacted author identity; the final runner and supplemental script together reproduce the saved checks. The scripts are evidence for this historical PR, not an install dependency of blast-radius.
