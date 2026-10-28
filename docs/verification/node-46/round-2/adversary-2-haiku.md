Final report of adversary 2, an Agent-tool `general-purpose` sub-agent on `haiku`, as it handed back. Its fixture manifests are copied under `adversary-2-repro/`.

The duplicate check only catches a path listed twice in a row. A duplicate that is not adjacent passes, so the intent is not met.

**Finding 1: non-adjacent duplicate member paths pass the checker (exit 0)**

The new check compares each path only to `previous`, the entry just before it, so `[A, B, A]` is never flagged. The intent requires a failure naming the path whenever the same member path appears more than once.

Repro 1, adjacent duplicate (detected):
```
cd /tmp/interrogate-dup-artifacts/adversary-2/repro/adjacent && bun ../../scripts/check-pack.ts
```
Output: `skills/recall: listed more than once in artifacts`, exit 1. Correct.

Repro 2, non-adjacent duplicate (missed):
```
cd /tmp/interrogate-dup-artifacts/adversary-2/repro/nonadjacent && bun ../../scripts/check-pack.ts
```
`arc-manifest.yaml` lists `skills/recall`, `skills/correct`, `skills/recall`. Output: `Pack checks passed (3 members).`, exit 0. Intent requires exit 1 with `skills/recall` named.

Repro 3, realistic case on a copy of the real manifest with `  - path: skills/recall` appended as the last entry:
```
cd /tmp/interrogate-dup-artifacts/adversary-2/repro/real && bun ../../scripts/check-pack.ts
```
Output: `Pack checks passed (23 members).`, exit 0. Intent requires exit 1.

**Finding 2: the commit adds no test, so the gap is not caught**

`git diff 48eb39e --stat` shows only `scripts/check-pack.ts` changed. `bun test test/check-pack.test.ts` passes 31 of 31 with no duplicate case, and grep finds no "more than once" or "duplicate" test. The adjacent-only behavior is therefore unverified by the suite, and the non-adjacent miss in Finding 1 went unnoticed. A test with `[A, B, A]` would fail on the current code.

Fix direction (not applied): track seen paths in a `Set` rather than comparing to `previous`. The repro directory is `/tmp/interrogate-dup-artifacts/adversary-2/repro/`.
