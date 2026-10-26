# Node #4 verification

Verified on the host on 2026-10-26. The port is named `bug-fix-test`; Soma's existing `tdd` remains unchanged. No bug-fix playbook card lives in this pack, so no card pointer was changed.

Upstream: [cursor/plugins pstack/skills/tdd/SKILL.md](https://github.com/cursor/plugins/blob/b6375f1c3a8600fa8907d2214ed9f8aad0028dde/pstack/skills/tdd/SKILL.md). GitHub's commit lookup resolved the specified `b6375f1` to this full SHA. The member manifest records it; root NOTICE.md supplies the MIT notice.

## Live invocation method

Two independent agents received only the skill path, the scratch bug request and the isolated fixture path. They read and applied the skill, changed only their scratch fixture and captured their reports below. The author did not supply the test decision or fix. All commands ran on this host; no containers, production printer calls or live installations were used.

Cheap fixture before invocation:

```js
export function discountedTotal(cents, percent) {
  return Math.round(cents * (1 - percent));
}
```

An existing `discount.test.js` checked only that `discountedTotal(2000, 0)` is `2000`, using `bun:test`. Request: percent is in percentage points; a 20 percent discount on 2000 cents must produce 1600.

No-cheap fixture: `print-job.sh` called `/opt/pressvendor/bin/pressrender --input "$1" --orientation landscape --duplex long-edge --printer production-proof`. OPERATIONS.md required short-edge landscape proofs and documented that the licensed renderer, license server, printer and job service were unavailable, without a simulator, harness or output fixture. The request was to repair the wrong flip edge without contacting production or installing infrastructure.

## Cheap-path report (verbatim)

Fixed `discountedTotal` to interpret the discount as percent points by dividing by 100.

The cheap test path exists: the scratch project already uses `bun:test` for `discountedTotal` through its exported interface. I added `discount takes percent points` to the existing test file before changing production code.

Failing-before command: `bun test discount.test.js` (exit status 1).

```text
bun test v1.4.2 (744846f84)

discount.test.js:
(pass) zero discount keeps the price [0.10ms]
2 | import { discountedTotal } from "./discount.js";
3 | test("zero discount keeps the price", () => {
4 |   expect(discountedTotal(2000, 0)).toBe(2000);
5 | });
6 | test("discount takes percent points", () => {
7 |   expect(discountedTotal(2000, 20)).toBe(1600);
                                        ^
error: expect(received).toBe(expected)

Expected: 1600
Received: -38000

      at <anonymous> (/private/tmp/soma-pstack-node-4-probes/cheap/discount.test.js:7:37)
(fail) discount takes percent points [0.22ms]

 1 pass
 1 fail
 2 expect() calls
Ran 2 tests across 1 file. [7.00ms]
```

This fails for the intended bug: the observable result for 2000 cents and 20 percent is -38000 instead of 1600. The existing zero-discount test passes, and there is no import or harness failure.

Passing-after command: `bun test discount.test.js` (exit status 0).

```text
bun test v1.4.2 (744846f84)

discount.test.js:
(pass) zero discount keeps the price [0.13ms]
(pass) discount takes percent points

 2 pass
 0 fail
 2 expect() calls
Ran 2 tests across 1 file. [7.00ms]
```

The same command also validates the nearby zero-discount contract. All checks ran directly on the host. Files changed: `cheap/discount.js`, `cheap/discount.test.js`, and this report.

## No-cheap-path report (verbatim)

Changed `/tmp/soma-pstack-node-4-probes/no-cheap/print-job.sh` from `--duplex long-edge` to `--duplex short-edge`, matching OPERATIONS.md's requirement for landscape proofs.

No test was added. There is no cheap behavioral test path: the licensed renderer, license server, job service and physical printer are unavailable, with no simulator, harness or captured output fixture. A fake renderer would mostly test a mock; a source-text assertion would encode implementation details. Prefer no new test over a bad test.

Closest useful verification: host shell syntax checks and a renderer availability check. Commands ran in `/tmp/soma-pstack-node-4-probes/no-cheap`.

Before the change:

```text
$ sh -n print-job.sh
exit status: 0
output: (empty)

$ test -x /opt/pressvendor/bin/pressrender
exit status: 1
output: (empty)
```

These are syntax and environment evidence, not failing-before evidence of the printing bug. The original adapter's `--duplex long-edge` conflicts with the documented short-edge requirement, but failing-before physical behavior could not be demonstrated without the unavailable renderer and printer. No production service was contacted.

After the change:

```text
$ sh -n print-job.sh
exit status: 0
output: (empty)
```

Source inspection confirms the adapter now passes `--orientation landscape --duplex short-edge`. Remaining verification gap: render and print a landscape proof in an authorized environment and confirm its physical flip edge. Shell syntax validation does not establish physical printer behavior.

Files changed: `no-cheap/print-job.sh`; report created: `/tmp/soma-pstack-node-4-probes/no-cheap-report.md`.

## Side-by-side description probe

# Independent routing and instruction audit

Audited 2026-10-26. This audit reads the two actual skill descriptions side by side and makes routing choices from their stated triggers. It does not execute either skill or establish a statistical routing guarantee.

## Descriptions inspected

`skills/bug-fix-test/SKILL.md`:

> Use for bug-fix-test or a focused bug-fix regression check: add a test only with a cheap local path, otherwise explain why it is skipped. Capture failing-before output. Do not select for requests naming tdd, TDD, red-green-refactor, or general test-first development; those belong to Soma's tdd skill.

`/Users/fischer/.soma/skills/tdd/SKILL.md`:

> Test-driven development with red-green-refactor loop. Use when user wants to build features or fix bugs using TDD, mentions "red-green-refactor", wants integration tests, or asks for test-first development.

## Routing choices

| Request | Selected skill | Reason |
| --- | --- | --- |
| Use tdd to fix this bug. | `tdd` | Explicit name; `bug-fix-test` excludes requests naming tdd. |
| Use bug-fix-test to check this bug fix. | `bug-fix-test` | Explicit name; the request does not ask for TDD, integration tests, or test-first development. |
| Build this feature using red-green-refactor. | `tdd` | Explicit positive trigger in `tdd` and exclusion in `bug-fix-test`. |
| Run bug-fix-test on this regression; skip adding a test if no cheap path exists. | `bug-fix-test` | Explicit name and matching gated regression behavior. |
| Use TDD for a bug with an obvious cheap local test. | `tdd` | Explicit TDD trigger takes precedence over the cheap-path aspect; `bug-fix-test` expressly excludes TDD. |

No cross-selection occurred in these five description-based choices. Soma's `tdd` description does not explicitly exclude `bug-fix-test`, but neither of the explicit `bug-fix-test` requests contains a positive `tdd` trigger. The result supports the supplied probe set; it does not prove all possible ambiguous natural-language requests are disjoint.

## Instruction criteria

Upstream source independently read from `https://raw.githubusercontent.com/cursor/plugins/b6375f1c3a8600fa8907d2214ed9f8aad0028dde/pstack/skills/tdd/SKILL.md`, matching the member manifest pin.

- **Cheap test gate: supported.** Workflow step 2 permits adding a test only with a clear, cheap path. The introduction forbids forcing a test even when a regression test is requested. The fallback explicitly says to add no test and explain the impractical constraint.
- **Bad-test definition: preserved.** The fallback contains the upstream sentence beginning “Prefer no new test over a bad test” and every upstream category: mostly tests mocks; current implementation details; timing or unrelated global state; expensive infrastructure for a small fix; and immediate disposal after proving the fix. The node's four named categories are covered without dropping the upstream fifth category.
- **Intended failure before production edits: supported.** Workflow step 4 captures command, exit status, and actual failure output before fixing. It requires correcting the test/reproduction when it passes or fails for an unrelated reason and explicitly rejects setup/import/infrastructure errors as bug evidence.
- **Actual failing-before report: supported as an instruction.** The Report section requires a fenced block with the command, exit status, actual failure output, and explanation of the intended bug. It explicitly says an expected-failure paraphrase is insufficient. Workflow step 6 and Report require the passing-after result.
- **No-cheap-path reporting: supported as an instruction.** The fallback prohibits inventing failing-before evidence and requires stating verification gaps. The Report section requires the reason for adding no test and the verification actually performed.

## Manifest routing follow-up

Re-read both `skills/bug-fix-test/arc-manifest.yaml` and the `skills/bug-fix-test` artifact description in root `arc-manifest.yaml` after the metadata update. Both now say:

> Gate a bug-fix-test regression check on a cheap path and capture failing-before evidence. Requests naming tdd, TDD, red-green-refactor or general test-first development belong to Soma's tdd skill.

Re-evaluating the same five requests separately against the member description and library artifact description produces the same choices on each surface: `tdd`, `bug-fix-test`, `tdd`, `bug-fix-test`, `tdd`. Explicit tdd/TDD/red-green-refactor requests are assigned to Soma's `tdd` by both metadata descriptions; explicit `bug-fix-test` requests select the distinct member. The earlier manifest exclusion gap is resolved. No unsupported cross-selection was found across these three inspected description surfaces for the supplied probe set.

This audit did not run the scratch cheap/no-cheap live probes. Their execution evidence must be assessed separately; source wording alone does not demonstrate observed skill behavior.

## Packaging and projection

- `arc validate skills/bug-fix-test`: exit 0, valid arc/v1 manifest.
- Skill Creator's `quick_validate.py skills/bug-fix-test`: exit 0, Skill is valid.
- Bootstrapped a fresh scratch Soma home with `soma init --apply`, then ran `soma project-skill <member> --substrate codex,pi-dev,claude-code,cursor,grok,dsh,anthropic-cowork --apply` against it. An initial apply against an uninitialized scratch home failed on missing `profile/assistant.md`; the initialized home succeeded.
- Read back all six full projections and compared their SKILL.md bytes with source: all match. Pi's metadata stub retains the same name/description and points to the complete matching registry body. The verification script threw on any mismatch and exited 0.
- Targeted host suite: `bun test test/check-pack.test.ts` exited 0 with 31 pass, 0 fail and 84 assertions.
- Full pack gate, run once immediately before the commit: `bun scripts/check-pack.ts` exited 0 with `Pack checks passed (6 members).`

These are bounded live probes of the skill's instructions and descriptions, not a statistical routing guarantee. The printer's physical behavior remains unverified for the reason stated above.

## Completion audit

Claude Sonnet 5.5 independently assessed the skill, manifests and live reports, returning **pass**. It treated the pack gate as pending. Supported refinements: clarify that the failure output is fenced while command/status may be in prose, and remove the unnecessary `/tmp/**` write grant. These do not change the test gate, execution order or routing.

The audit noted the bounded coverage of explicit-name requests and the two extreme test-path fixtures. Ambiguous unnamed requests and borderline mock-heavy cases were not separately evaluated. It also suggested including the cheap fix itself for inspection; the final fixture is:

```js
export function discountedTotal(cents, percent) {
  return Math.round(cents * (1 - percent / 100));
}
```

The new test calls `discountedTotal(2000, 20)` and expects `1600`; the original zero-discount test remains. The upstream source and NOTICE were independently read during implementation; the completion auditor did not receive those files. No live Soma skill was edited.
